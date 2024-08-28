import random
import time
from typing import Literal, Optional

# matrix_field = [[0, 0, 0, 1, 1...], [...]]
# 0 - empty field
# 1 - neighbour
# 2 - hit ship in cell
# '2-h-id-state' - LenShip-(h/v)-id-(hit/live)


def get_random_placement(size_matrix_field: int = 10,
                         kit_ship_list: Optional[int] = None
                         ) -> list[list[int | str]]:
    matrix_field: list[list[int | str]] = [[0 for i in range(
                    size_matrix_field)] for i in range(size_matrix_field)]
    if kit_ship_list is None:
        # value = length ship
        ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]

    ships = sorted(ships, reverse=True)
    ship_list: list[tuple[int, Literal['h', 'v'], str]] = []
    for index, len_ship in enumerate(ships):
        ship_list.append((len_ship, random.choice(['h', 'v']), f'id_{index}'))

    border_matrix_field = len(matrix_field) - 1

    for ship in ship_list:
        ship_on_field = False
        max_iteration = 0
        while not ship_on_field:
            max_iteration += 1
            if max_iteration > 20:
                matrix_field = get_random_placement(kit_ship_list=kit_ship_list)
                return matrix_field

            n_row = random.randint(0, border_matrix_field)
            n_col = random.randint(0, border_matrix_field)
            ship_on_field, matrix = is_posible_put_ship_on_field(
                                                        matrix_field=matrix_field,
                                                        border_matrix_field=border_matrix_field,
                                                        n_row=n_row,
                                                        n_col=n_col,
                                                        len_ship=ship[0],
                                                        location_ship=ship[1],
                                                        id_ship=ship[2])
            if matrix is not None:
                matrix_field = matrix

    return matrix_field


def is_posible_put_ship_on_field(matrix_field: list[list[int | str]],
                                 border_matrix_field: int,
                                 n_row: int,
                                 n_col: int,
                                 location_ship: Literal['h', 'v'],
                                 len_ship: int,
                                 id_ship: str) -> tuple[bool,
                                                        Optional[list[list[int | str]]]]:
    isBusy = False
    match location_ship:
        case 'h':
            # exit on border
            if len_ship + n_col >= border_matrix_field:
                return False, None

            for field in range(len_ship):
                if check_busy_field(matrix_field, n_row, n_col+field):
                    isBusy = True
                    break
            if isBusy:
                return False, None

            for field in range(len_ship):
                matrix_field[n_row][n_col+field] = f'{len_ship}-{location_ship}-{id_ship}'

        case 'v':
            if len_ship + n_row >= border_matrix_field:
                return False, None

            for field in range(len_ship):
                if check_busy_field(matrix_field, n_row+field, n_col):
                    isBusy = True
                    break
            if isBusy:
                return False, None

            for field in range(len_ship):
                matrix_field[n_row+field][n_col] = f'{len_ship}-{location_ship}-{id_ship}'
    return True, matrix_field


def check_busy_field(matrix: list[list[int | str]],
                     row: int,
                     col: int,
                     data_ship: Optional[str] = None) -> bool:
    """If the cell is not free and its neighboring cells are occupied,
        then return True"""
    neighbour_fields = _get_neighbour_fields(row, col)
    for x, y in neighbour_fields:
        if not check_bounds(x, y):
            continue
        if type(matrix[x][y]) is str and data_ship != matrix[x][y]:
            return True
    return False


def fill_busy_field(matrix: list[list[int | str]],
                    row: int,
                    col: int) -> list[list[int | str]]:
    """Fills in all fields around the cell, including the cell itself"""
    neighbour_fields = _get_neighbour_fields(row, col)
    for x, y in neighbour_fields:

        if check_bounds(x, y):
            if type(matrix[x][y]) is str:
                if x == row and y == col:
                    matrix[x][y] = 2
            else:
                matrix[x][y] = 1
    return matrix


def check_bounds(x: int, y: int) -> bool:
    if x < 0 or y < 0 or x > 9 or y > 9:
        return False
    return True


def _get_neighbour_fields(row: int, col: int) -> list[list[int]]:
    return [
            [row, col],
            [row, col+1],
            [row, col-1],

            [row+1, col],
            [row+1, col+1],
            [row+1, col-1],

            [row-1, col],
            [row-1, col+1],
            [row-1, col-1],
            ]


def fill_auto_miss(matrix: list[list[int | str]],
                   row: int,
                   col: int) -> list[list[int | str]]:
    auto_miss = get_auto_miss_fields(row, col)
    matrix[row][col] = 2
    for x, y in auto_miss:
        if check_bounds(x, y):
            matrix[x][y] = 1
    return matrix


def get_possible_hit_move(row: int, col: int) -> list[list[int]]:
    possible_hit_fields = [
                        [row+1, col],
                        [row-1, col],
                        [row, col+1],
                        [row, col-1],
                        ]
    correct_possible_hit_fields = []
    for x, y in possible_hit_fields:
        if check_bounds(x, y):
            correct_possible_hit_fields.append([x, y])
    return correct_possible_hit_fields


def get_auto_miss_fields(row: int, col: int) -> list[list[int]]:
    return [
        [row+1, col+1],
        [row-1, col-1],
        [row-1, col+1],
        [row+1, col-1]]


if __name__ == '__main__':
    start_time = time.time()
    get_random_placement()
    end_time = time.time()
    print('Время выполнения:', end_time-start_time)
