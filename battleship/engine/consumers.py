import json
from typing import Optional

from channels.generic.websocket import AsyncWebsocketConsumer

from .services.field import get_random_placement
from .services.game import GameWithPC
from .services.validation import validation_field


class GameSettingsConsumer(AsyncWebsocketConsumer):
    def __init__(self,
                 *args: tuple, **kwargs: dict) -> None:  # type: ignore[type-arg]
        super().__init__(*args, **kwargs)
        self.game: Optional[GameWithPC] = None

    async def connect(self) -> None:
        await self.accept()

    async def disconnect(self, close_code: int) -> None:
        pass

    async def receive(self, text_data: str) -> None:
        text_data_json = json.loads(text_data)
        action = text_data_json['action']
        match action:
            case 'get_random_placement':
                if self.game is not None:
                    return None
                placement = get_random_placement()
                await self.send(text_data=json.dumps({
                                            'action': 'random_placement',
                                            'placement': placement
                                            }))
            case 'start_game_with_pc':
                if self.game is not None:
                    if self.game.is_game:
                        return None

                player_matrix = text_data_json.get('matrix')
                kit_ships = text_data_json.get('kit_ships')
                if not validation_field(player_matrix, kit_ships):
                    player_matrix = get_random_placement()
                self.game = GameWithPC(self, player_matrix)
                await self.game.start_game()
            case 'move_player':
                if self.game is None:
                    return
                motion = text_data_json.get('move')
                x, y = motion[0], motion[1]

                await self.game.proccess_move(x, y)
