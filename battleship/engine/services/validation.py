from .field import check_busy_field
from .ship import Ship


def validation_field(matrix: list[list[str | int]],
                     kit_ships: list[int]) -> bool:
    if type(kit_ships) is not list:
        return False

    height_matrix = len(matrix)
    ships: dict[str, Ship] = {}
    for y, row in enumerate(matrix):
        if len(row) != height_matrix:
            return False
        for x, cell in enumerate(row):
            # checking for the purity of the matrix
            if type(cell) is int and cell != 0:
                return False

            if type(cell) is not str:
                continue

            if check_busy_field(matrix, y, x, cell):
                return False

            data_ship: list[str] = cell.split('-')
            if ships.get(data_ship[2]) is None:
                if data_ship[1] not in ['h', 'v']:
                    return False
                ships[data_ship[2]] = Ship(
                                        position=data_ship[1],  # type: ignore[arg-type]
                                        length=int(data_ship[0]),
                                        data_id=data_ship[2])
            ships[data_ship[2]].real_length += 1
    return _check_kit_ships(ships, kit_ships)


def _check_kit_ships(ships: dict[str, Ship],
                     kit_ships: list[int]) -> bool:
    for ship in ships.values():
        if ship.real_length != ship.length:
            return False

        # if ship not in kit, then data not valid
        try:
            kit_ships.remove(ship.real_length)
        except ValueError:
            return False

    # if kit_ships not empty, then data not valid
    if kit_ships != []:
        return False
    return True
