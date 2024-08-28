const rivalField = document.querySelector('.battlefield_rival #rival');
const selfField = document.querySelector('.battlefield_self #self');
const CLASS_MISS_CELL = 'battle-cell-miss';
const CLASS_MISSING = 'missing';
const CLASS_HIT_CELL = 'battle-cell-hit';
const btnRandomPlacement = document.getElementById('btn-random-placement');
const btnCleanSheet = document.getElementById('btn-clean-sheet');
const btnStartGamePC = document.getElementById('btn-start-game-pc');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const host = window.location.host;
const url = 'http://' + host;
const url_ws = 'ws://' + host + '/ws/game_settings/';

let isGame = false;
let gameSocket = new WebSocket(url_ws);

gameSocket.onclose = closeWS;
gameSocket.onmessage = getMessageWS;
btnStartGamePC.onpointerup = startGamePC;
btnRandomPlacement.onpointerup = getRandomPlacement;
btnCleanSheet.onpointerup = cleanSheet;

async function closeWS () {
    while (gameSocket.readyState !== 1) {
        gameSocket = new WebSocket(url_ws);
        await sleep(3000);
    };
    gameSocket.onmessage = getMessageWS;
    gameSocket.onclose = closeWS;

}

function getMessageWS (msg) {
    let msgJSON = JSON.parse(msg.data);
    if (msgJSON.action === 'random_placement') {
        if (msgJSON.placement === null) return;
        putOnField(msgJSON);
    }
    else if (msgJSON.action === 'started_game') {

        createStatistcsDiv(msgJSON.body.kit_ships)
        if (msgJSON.body.turn_move === 'rival') {
            rivalField.onpointerup = null;
        }
        else {
            rivalField.onpointerup = makeMove;
        };
    }
    else if (msgJSON.action === 'return_motion') {
        if (msgJSON.body.turn_move === 'rival') {
            rivalField.onpointerup = null;
            rivalField.classList.add('field-disabled')
        }
        else {
            rivalField.onpointerup = makeMove;
            rivalField.classList.remove('field-disabled')
        }
        showResponseShot(msgJSON.body)
    }
};

function createDivEndGame () {
    let divEndGame = document.createElement('div');
    let p = document.createElement('p');
    let but = document.createElement('button');
    but.setAttribute('type', 'button');
    but.classList.add('custom-btn');
    but.classList.add('custom-btn-small');
    but.classList.add('btn-active');
    but.textContent = 'Сыграть еще раз';
    but.onpointerup = () => {
        window.location.href = url;
    };
    divEndGame.id = 'end-game';
    divEndGame.appendChild(p);
    divEndGame.appendChild(but);
    return divEndGame
}


function createDivShips (length, position, dataId = null, size=2) {
    let divShip = document.createElement('div');
    divShip.classList.add('ship-box');
    divShip.setAttribute('data-location', position);
    divShip.setAttribute('data-length', length);
    if (dataId !== null) {
        divShip.setAttribute('data-id', dataId);
    };

    divShip.style = `z-index: 1;`
    if (Number(length) === 1) {
        divShip.style.cssText += `width: ${size}.1rem;
                                height: ${size}.1rem;`;
    };
    if (position ===  'h') {
        divShip.style.cssText += `width: ${Number(length)*size}.1rem;
                                height: ${size}.1rem;`;
    }
    else {
        divShip.style.cssText += `width: ${size}.1rem;
                                height: ${Number(length)*size}.1rem;`;
    };
    return divShip
};

function createStatistcsDiv (kit_ships) {
    let divStatistics = document.createElement('div');
    divStatistics.id = 'statistics-ships';
    for (const[shipId, ship] of Object.entries(kit_ships)) {
        let divShip = createDivShips(ship.length, 'h', shipId, 1);
        //setup position:static and cursor default
        divShip.classList.add('port');
        divShip.classList.add('ui-draggable');
        divStatistics.appendChild(divShip);
    };
    let firstChild = document.querySelector('.block-init').firstChild;
    document.querySelector('.block-init').insertBefore(divStatistics, firstChild);
};

function putOnField (msgJSON) {
    matrix = msgJSON.placement;
    cleanField(selfField);

    let idShips = [];
    for (let [y, row] of matrix.entries()) {
        for (let [x, cell] of row.entries()) {
            if (typeof cell === 'string') {
                let ship = cell.split('-');
                let cellField = selfField.querySelector(`
                                td[data-x="${x}"][data-y="${y}"]`);
                cellField.classList.add(CLASS_BUSY_CELL);
                cellField.classList.remove(CLASS_EMPTY_CELL);
                if (idShips.includes(ship[2])) {
                    continue
                };
                let divShip = createDivShips(ship[0], ship[1], ship[2]);

                cellField.appendChild(divShip);
                idShips.push(ship[2]);
            }
        };
    };
    wrapperInitShips.style.display = 'none';
    removeBlockInitShips();
    Array.from(document.getElementsByClassName('ship-box')).forEach((elem) => {
        elem.onpointerdown = dragShip;
    });
};

function removeBlockInitShips () {
    let initShips = document.querySelector('.init-ships');
    if (initShips !== null) {
        document.querySelector('.init-ships').remove();
    }
};

function cleanField (field) {
    Array.from(field.getElementsByClassName('ship-box')).forEach((elem) => {
        elem.remove();
    });
    Array.from(field.querySelectorAll('td')).forEach((elem) => {
        elem.setAttribute("class", "");
        elem.classList.add(CLASS_EMPTY_CELL);
    });
};

function cleanSheet () {
    cleanField(selfField);
    let firstChild = document.querySelector('.block-init').firstChild;
    document.querySelector('.block-init').insertBefore(wrapperInitShips, firstChild);
    wrapperInitShips.style.display = '';
    wrapperInitShips.innerHTML = htmlInitShips;
    Array.from(document.getElementsByClassName('ship-box')).forEach((elem) => {
        elem.onpointerdown = dragShip;
    });
};


function getRandomPlacement () {
    if (isGame === true) return;
    cleanField(selfField);
    gameSocket.send(JSON.stringify({'action': 'get_random_placement'}));
};

function startGamePC (event, DefcountShip = 10,
                      ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]) {
    if (isGame === true) return;
    let countShips = 0;
    for (elem of document.getElementsByClassName('ship-box')) {
        countShips++;
        if (elem.parentElement.tagName !== 'TD') {
            alert('Выставьте все корабли на поле боя');
            return;
        };
    };
    if (countShips !== DefcountShip) {
        getRandomPlacement();
    };

    switchBtnActive();
    let matrix = getMatrix(selfField.children);
    gameSocket.send(JSON.stringify({"action": "start_game_with_pc",
                                    "matrix": matrix,
                                    "kit_ships": ships,
        })
    );
};

function switchBtnActive () {
    // Отключаем или включаем все кнопки и движение кораблей
    if (isGame === false) {
        isGame = true;
        for (elem of selfField.getElementsByClassName('ship-box')) {
            elem.style.cursor = 'default'
        };
        btnCleanSheet.onpointerup = null;
        btnRandomPlacement.onpointerup = null;
        btnStartGamePC.onpointerup = null;
        btnCleanSheet.classList.add('btn-disabled');
        btnRandomPlacement.classList.add('btn-disabled');
        btnStartGamePC.classList.add('btn-disabled');
        btnCleanSheet.classList.remove('btn-active');
        btnRandomPlacement.classList.remove('btn-active');
        btnStartGamePC.classList.remove('btn-active');
    }
    else {
        isGame = false;
        btnStartGamePC.onpointerup = startGamePC;
        btnRandomPlacement.onpointerup = getRandomPlacement;
        btnCleanSheet.onpointerup = cleanSheet;

        btnCleanSheet.classList.remove('btn-disabled');
        btnRandomPlacement.classList.remove('btn-disabled');
        btnStartGamePC.classList.remove('btn-disabled');
        btnCleanSheet.classList.add('btn-active');
        btnRandomPlacement.classList.add('btn-active');
        btnStartGamePC.classList.add('btn-active');
    }

}

function getMatrix (field) {
    let matrix = [];
    for (let y = 0; y < field.length; y++) {
        matrix[y] = [];
        for (let x = 0; x < field[0].children.length; x++) {
            matrix[y][x] = 0;
        };
    };
    for (let [fieldY, row] of Array.from(field).entries()) {
        for (let [fieldX, cell] of Array.from(row.children).entries()) {
            if (cell.classList.contains(CLASS_BUSY_CELL)) {
                let ship = cell.querySelector('.ship-box')
                if (ship) {
                    let length = ship.getAttribute('data-length');
                    let location = ship.getAttribute('data-location');
                    let dataId = ship.getAttribute('data-id');
                    dataShip = `${length}-${location}-${dataId}`;

                    let _coords = getCoordsShipWithNeighbour(fieldX, fieldY, location, length);
                    coordsShip = _coords['ship'];
                    coordNeighbour = _coords['neighbour'];
                    for (let coord of coordsShip) {
                        matrix[coord[1]].splice([coord[0]], 1, dataShip)
                    }
                };
            }
        };
    };
    return matrix
}


function makeMove (event) {
    if (isGame === false) {return};
    let field = event.target
    if (field.style.disabled === true ||
        field.tagName === 'SPAN'
    ) {return};
    let fieldX = Number(field.getAttribute('data-x'));
    let fieldY = Number(field.getAttribute('data-y'));
    gameSocket.send(JSON.stringify({'action': 'move_player',
                                    'move': [fieldX, fieldY],
    }));
};

function showResponseShot (body) {
    let status_cell = body.status_cell;
    let isSunk = body.sunk;
    let fieldX = body.x;
    let fieldY = body.y;
    let turn = body.is_it_move;
    let field
    let cell = null;

    if (turn === 'rival') {
        cell = selfField.querySelector(`td[data-x="${fieldX}"][data-y="${fieldY}"]`);
        field = selfField;
    }
    else {
        cell = rivalField.querySelector(`td[data-x="${fieldX}"][data-y="${fieldY}"]`);
        field = rivalField;
    };

    let cellLastShot = field.querySelector('.last-shot');
    if (cellLastShot !== null) {
        cellLastShot.classList.remove('last-shot');
    };
    cell.classList.add('last-shot');

    if (status_cell === null) {return};
    if (status_cell === 'hit') {
        cell.classList.remove(CLASS_EMPTY_CELL);
        cell.classList.add(CLASS_HIT_CELL);
        cell.style.disabled = true;
        let missAuto = [];
        if (isSunk === true) {
            if (turn === 'player') {
                let ship = body.ship;
                let startCoordShip = field.querySelector(`td[data-x="${ship.start_coord[0]}"][data-y="${
                                                                                ship.start_coord[1]}"]`);
                let divShip = createDivShips(ship.length, ship.position);
                startCoordShip.appendChild(divShip);
                updateStatisticsShips(ship.length)
            }
            missAuto = body.impossible_fields;
        }
        else {
            missAuto = [[fieldX+1, fieldY+1], [fieldX-1, fieldY-1], [fieldX-1, fieldY+1], [fieldX+1, fieldY-1]]
        }

        missAuto.forEach((coord) => {
            if (checkBounds(coord[0], coord[1]) === true) {
                let missField = field.querySelector(`.${CLASS_EMPTY_CELL}[data-x="${
                                            coord[0]}"][data-y="${
                                            coord[1]}"]`);
                if (missField === null) {return};
                missField.classList.remove(CLASS_EMPTY_CELL);
                missField.classList.add(CLASS_MISS_CELL);
                missField.style.disabled = true;
                missField.querySelector('span').classList.add(CLASS_MISSING)
            };
        });
        if (body.is_game === false) {
            rivalField.onpointerup = null;
            let txtWinner
            if (body.winner === 'rival') {
                txtWinner = 'Вы проиграли. Сыграть еще раз?'
            }
            else {
                txtWinner = 'Вы победили. Сыграть еще раз?'
            }
            let divEndGame = createDivEndGame();
            divEndGame.firstChild.textContent = txtWinner;
            document.body.appendChild(divEndGame);
        }
    }
    else if (status_cell === 'miss') {
        cell.classList.remove(CLASS_EMPTY_CELL);
        cell.classList.add(CLASS_MISS_CELL)
        cell.style.disabled = true;
        cell.querySelector('span').classList.add(CLASS_MISSING)
    };
};

function updateStatisticsShips (shipLength) {
    let divStatisticsShips = document.getElementById('statistics-ships');
    for (ship of divStatisticsShips.children) {
        if (shipLength == Number(ship.getAttribute('data-length')) &
            ship.classList.contains('statistics-ship-hit') === false) {
                ship.classList.add('statistics-ship-hit');
                return
            }
    }
}