from typing import Literal

from .field import _get_neighbour_fields, check_bounds


class Ship:
    def __init__(self,
                 position: Literal['h', 'v'],
                 length: int,
                 data_id: str) -> None:
        self.position = position
        self.length = length
        self.id = data_id
        self.real_length = 0
        self.coords: list[list[int]] = []
        self.damaged_coords: list[list[int]] = []
        self.neighnour_fields: list[list[int]] = []
        self.sunk = False

    def __str__(self) -> str:
        return f"{self.length}-{self.position}-{self.id}"

    def check_sunk(self) -> bool:
        if len(self.damaged_coords) == self.length:
            self.sunk = True
            self.fill_neighbour_fields()
            return True
        return False

    def fill_neighbour_fields(self) -> None:
        for coord in self.damaged_coords:
            neighbour = _get_neighbour_fields(coord[0], coord[1])
            for field in neighbour:
                if not check_bounds(field[0], field[1]):
                    continue
                if field in self.neighnour_fields:
                    continue
                if field in self.damaged_coords:
                    continue
                self.neighnour_fields.append(field)

    def get_start_coord(self) -> list[int]:
        if self.position == 'h':
            return sorted(self.coords, key=lambda coord: coord[0])[0]
        return sorted(self.coords, key=lambda coord: coord[1])[0]
