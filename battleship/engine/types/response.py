from dataclasses import dataclass
from typing import Literal, Optional, TypedDict


class ShipDict(TypedDict):
    start_coord: list[int]
    length: int
    position: Literal['h', 'v']


@dataclass
class BodyResponse:
    is_game: bool
    is_it_move: Literal['player', 'rival']
    turn_move: Literal['player', 'rival']
    status_cell: Literal['miss', 'hit']
    sunk: bool
    x: int
    y: int
    impossible_fields: Optional[list[list[int]]] = None
    ship: Optional[ShipDict] = None
    winner: Optional[Literal['player', 'rival']] = None


@dataclass
class Response:
    action: str
    body: Optional[BodyResponse]
