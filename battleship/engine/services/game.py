import asyncio
import json
import random
from dataclasses import asdict
from typing import TYPE_CHECKING, Any, Literal

from engine.types.response import BodyResponse, Response, ShipDict

from .field import fill_auto_miss, get_possible_hit_move, get_random_placement
from .ship import Ship

if TYPE_CHECKING:
    from engine.consumers import GameSettingsConsumer


class GameWithPC:
    def __init__(self,
                 consumer: 'GameSettingsConsumer',
                 player_matrix: list[list[int | str]]) -> None:
        self.consumer = consumer
        self.player_matrix = player_matrix
        self.pc_matrix = get_random_placement()
        self.kit_ship_player: dict[str, Ship] = self._get_kit_ship_from_matrix(
                                                                self.player_matrix)
        self.kit_ship_pc: dict[str, Ship] = self._get_kit_ship_from_matrix(
                                                                self.pc_matrix)
        self.turn_move: Literal['player', 'rival'] = random.choice(['player', 'rival'])
        self.is_game = True

    def _get_kit_ship_from_matrix(self,
                                  matrix: list[list[int | str]]) -> dict[str, Ship]:
        ships: dict[str, Ship] = {}
        for y, row in enumerate(matrix):
            for x, cell in enumerate(row):
                if type(cell) is not str:
                    continue
                data_ship = cell.split('-')
                if ships.get(data_ship[2]) is None:
                    ships[data_ship[2]] = Ship(
                                            position=data_ship[1],  # type: ignore[arg-type]
                                            length=int(data_ship[0]),
                                            data_id=data_ship[2])
                ships[data_ship[2]].real_length += 1
                ships[data_ship[2]].coords.append([x, y])
        return ships

    def serialize_kit_ship(self,
                           kit_ships: dict[str, Ship]) -> dict[str, dict[str, Any]]:
        serialize_kit_ship = {}
        for ship_id, ship in sorted(kit_ships.items(),
                                    key=lambda item: item[1].length,
                                    reverse=True):
            serialize_kit_ship[ship_id] = {'length': ship.length,
                                           'position': ship.position
                                           }
        return serialize_kit_ship

    def get_matrix_for_move(self) -> tuple[list[list[int | str]],
                                           dict[str, Ship]]:
        if self.turn_move == 'player':
            matrix = self.pc_matrix
            kit_ships = self.kit_ship_pc
        else:
            matrix = self.player_matrix
            kit_ships = self.kit_ship_player
        return matrix, kit_ships

    def _get_possible_move(self, matrix: list[list[int | str]]) -> list[list[int]]:
        possible_move: list[list[int]] = []
        high_priority_cell: list[list[int]] = []
        for y, row in enumerate(matrix):
            for x, cell in enumerate(row):
                if cell == 2:
                    auto_hit = get_possible_hit_move(x, y)
                    for field in auto_hit:
                        if matrix[field[1]][field[0]] not in [1, 2]:
                            high_priority_cell.append(field)
                if cell not in [1, 2]:
                    possible_move.append([x, y])
        if len(high_priority_cell) > 0:
            return high_priority_cell
        return possible_move

    def _pass_turn(self):
        if self.turn_move == 'player':
            self.turn_move = 'rival'
        else:
            self.turn_move = 'player'

    async def start_game(self) -> None:
        await self.consumer.send(json.dumps({
                    'action': 'started_game',
                    'body': {
                        'is_game': self.is_game,
                        'turn_move': self.turn_move,
                        'kit_ships': self.serialize_kit_ship(self.kit_ship_pc)
                        }

                    }))
        if self.turn_move == 'rival':
            await self.make_move()

    async def make_move(self) -> None:
        await asyncio.sleep(0.5)
        pc_possible_move = self._get_possible_move(self.player_matrix)
        coord = random.choice(pc_possible_move)
        await self.proccess_move(coord[0], coord[1])

    async def proccess_move(self, x: int, y: int) -> None:
        if self.is_game is False:
            return None
        response = Response(
                            'return_motion',
                            BodyResponse(
                                is_game=self.is_game,
                                is_it_move=self.turn_move,
                                turn_move=self.turn_move,
                                status_cell='miss',
                                sunk=False,
                                x=x,
                                y=y,
                                )
                            )

        matrix, kit_ships = self.get_matrix_for_move()
        # for MYPY
        if response.body is None:
            return None

        # cell = matrix[y][x]
        if type(matrix[y][x]) is str:
            ship_id = matrix[y][x].split('-')[2]
            ship = kit_ships[ship_id]
            ship.damaged_coords.append([x, y])
            ship.check_sunk()

            matrix = fill_auto_miss(matrix, y, x)

            response.body.status_cell = 'hit'
            response.body.impossible_fields = ship.neighnour_fields
            response.body.sunk = ship.sunk
            if ship.sunk:
                for neighbour in ship.neighnour_fields:
                    matrix[neighbour[1]][neighbour[0]] = 1
                response.body.ship = ShipDict(
                    start_coord=ship.get_start_coord(),
                    length=ship.length,
                    position=ship.position
                )

                for boat in kit_ships.values():
                    if not boat.sunk:
                        break
                else:
                    self.is_game = False
                    response.body.is_game = self.is_game
                    response.body.winner = self.turn_move
        else:
            self._pass_turn()
            matrix[y][x] = 1

        response.body.turn_move = self.turn_move
        await self.consumer.send(json.dumps(asdict(response)))

        if self.turn_move == 'rival':
            await self.make_move()
