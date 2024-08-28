const CLASS_BUSY_CELL = 'battle-cell-busy';
const CLASS_EMPTY_CELL = 'battle-cell-empty';
const initShips = document.getElementsByClassName('ship-box');
const wrapperInitShips = document.querySelector('.init-ships');
const htmlInitShips = wrapperInitShips.innerHTML;


window.ondragstart = () => { return false; };

wrapperInitShips.addEventListener('pointerup', () => {
    if (wrapperInitShips.children.length === 0) {
        wrapperInitShips.style.display = 'none';
    };
});

for (ship of initShips) {
    ship.onpointerdown = dragShip
};


function dragShip (event) {
    if (isGame === true) return

    event.preventDefault();
    let startCoords = getCoords(event.target);
    let shiftX = event.pageX - startCoords.left;
    let shiftY = event.pageY - startCoords.top;
    event.target.style.zIndex = 200;
    event.target.classList.add('ui-draggable');
    let isPort = event.target.classList.contains('port');
    event.target.classList.remove('port');

    let neighbourFields = [];
    let cellsCoordsShip = [];
    // проверка соседних клеток на занятость
    let isBusyField = true;

    let locationShip = event.target.getAttribute('data-location');
    let lengthShip = Number(event.target.getAttribute('data-length'));

    event.target.hidden = true;
    let elemBelow = document.elementFromPoint(startCoords.x+15, startCoords.y+15);
    event.target.hidden = false;
    if (isPort === true) {
        event.target.style.top = event.pageY -  shiftY + 'px';
        event.target.style.left = event.pageX - shiftX + 'px';
    }
    else {

        if (elemBelow.parentElement.parentElement.id !== 'self'){
            return
        };
        startX = elemBelow.getAttribute('data-x');
        startY = elemBelow.getAttribute('data-y');
        if (startX === null || startY === null) {
            return
        };
        startX = Number(startX);
        startY = Number(startY);
        event.target.setAttribute('data-old-x', startX);
        event.target.setAttribute('data-old-y', startY);
        for (let i = 0; i < lengthShip; i++) {
            let cell;
            if (locationShip === 'h') {
                cell = document.getElementById('self').querySelector(`td[data-x="${startX+i}"][data-y="${startY}"]`);
                cellsCoordsShip.push([startX+i, startY]);
            }
            else {
                cell = document.getElementById('self').querySelector(`td[data-x="${startX}"][data-y="${startY+i}"]`);
                cellsCoordsShip.push([startX, startY+i]);
            };
            cell.classList.remove(CLASS_BUSY_CELL);
            cell.classList.add(CLASS_EMPTY_CELL);
        };
    };

    // MOVE SHIP
    document.onpointermove = (e) => {
        e.preventDefault();
        // for clear field
        neighbourFields.forEach((coordField)=> {
            let field = selfField.querySelector(
                `.${CLASS_EMPTY_CELL}[data-x="${coordField[0]}"][data-y="${coordField[1]}"]`);
            if (field === null) {return}
            field.classList.remove('possible-field');
        });

        if (isPort === true) {
            event.target.style.top = e.pageY - shiftY + 'px';
            event.target.style.left = e.pageX - shiftX + 'px';
        }
        else {
            event.target.style.top = e.pageY - event.target.parentElement.offsetTop - shiftY + 'px';
            event.target.style.left = e.pageX - event.target.parentElement.offsetLeft - shiftX + 'px';
        };

        shipWindowCoords = getCoords(event.target);
        event.target.hidden = true;
        let elemBelow = document.elementFromPoint(shipWindowCoords.x+15, shipWindowCoords.y+15);
        let elemBelowEnd = document.elementFromPoint(shipWindowCoords.x+shipWindowCoords.width-15,
                                                    shipWindowCoords.y+shipWindowCoords.height-15);
        event.target.hidden = false;

        neighbourFields = [];
        cellsCoordsShip = [];
        isBusyField = false;
        if (elemBelow !== null &&
            elemBelow.classList.contains(CLASS_EMPTY_CELL) &&
            elemBelowEnd.classList.contains(CLASS_EMPTY_CELL) &&
            elemBelow.parentElement.parentElement.id === 'self' &&
            elemBelowEnd.parentElement.parentElement.id === 'self') {

            let fieldX = Number(elemBelow.getAttribute('data-x'));
            let fieldY = Number(elemBelow.getAttribute('data-y'));
            if (locationShip === 'h') {
                for (let i = 0; i < lengthShip; i++) {
                    neighbourFields.push(...getNeighbourCells(fieldX+i, fieldY));
                    cellsCoordsShip.push([fieldX+i, fieldY]);
                };
            }
            else if (locationShip === 'v') {
                for (let i = 0; i < lengthShip; i++) {
                    neighbourFields.push(...getNeighbourCells(fieldX, fieldY+i));
                    cellsCoordsShip.push([fieldX, fieldY+i]);
                };
            };

            for (neighbour of neighbourFields) {
                let field = selfField.querySelector(
                    `.${CLASS_EMPTY_CELL}[data-x="${neighbour[0]}"][data-y="${neighbour[1]}"]`);
                if (field === null) {
                    isBusyField = true;
                    event.target.style.borderColor = 'red';
                    return};
            };
            if (isBusyField === false) {
                cellsCoordsShip.forEach((coord) => {
                    selfField.querySelector(
                    `.${CLASS_EMPTY_CELL}[data-x="${coord[0]}"][data-y="${coord[1]}"]`).classList.add('possible-field');

                });
            };
            event.target.style.borderColor = 'green';
        }
        else {
            event.target.style.borderColor = 'red';
            isBusyField = true;
        };
    };


    // POINTER UP
    event.target.onpointerup = () => {
        document.onpointermove = null;
        event.target.onpointerup = null;
        event.target.style.zIndex = 1;

        if (isBusyField === false) {
            let startCell = document.getElementById('self').querySelector(`td[data-x="${
                                        cellsCoordsShip[0][0]}"][data-y="${
                                        cellsCoordsShip[0][1]}"]`);
            // for position: relative parentElement
            event.target.style.top = 0;
            event.target.style.left = 0;
            startCell.append(event.target);

            cellsCoordsShip.forEach((cellCoords) => {
                let cell = selfField.querySelector(
                    `.${CLASS_EMPTY_CELL}[data-x="${
                        cellCoords[0]}"][data-y="${
                        cellCoords[1]}"]`);
                cell.classList.add(CLASS_BUSY_CELL);
                cell.classList.remove(CLASS_EMPTY_CELL);
                cell.classList.remove('possible-field');
            });
        }
        else {
            let oldX = Number(event.target.getAttribute('data-old-x'));
            let oldY = Number(event.target.getAttribute('data-old-y'));
            let startCell

            if (isPort === true) {
                startCell = document.querySelector('.init-ships');
                startCell.append(event.target);
                event.target.classList.add('port');
                event.target.style.borderColor = null;
                return;
            };

            startCell = selfField.querySelector(`td[data-x="${oldX}"][data-y="${oldY}"]`);
            event.target.style.top = 0;
            event.target.style.left = 0;
            startCell.append(event.target);

            for (let i = 0; i < lengthShip; i++) {
                let cell;
                if (locationShip === 'h') {
                    cell = selfField.querySelector(`td[data-x="${oldX+i}"][data-y="${oldY}"]`)
                }
                else {
                    cell = selfField.querySelector(`td[data-x="${oldX}"][data-y="${oldY}"]`)
                };
                cell.classList.add(CLASS_BUSY_CELL);
                cell.classList.remove(CLASS_EMPTY_CELL);
                cell.classList.remove('possible-field');
            };
        };
        event.target.style.borderColor = null;
        event.target.classList.remove('ui-draggable');
        event.target.removeAttribute('data-old-x');
        event.target.removeAttribute('data-old-y');
    };
};


function getCoords(elem) {
    let box = elem.getBoundingClientRect();
    return {
      top: box.top + scrollY,
      bottom: box.bottom + scrollY,
      left: box.left + scrollX,
      right: box.right + scrollX,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    };
};

function checkBounds(x, y) {
    if (x < 0 || y < 0 || x > 9 || y > 9) return false;
    return true;
};

function getNeighbourCells (fieldX, fieldY) {
    let neighbourFields = [];
    let cells = [
                    [fieldX, fieldY],
                    [fieldX, fieldY+1],
                    [fieldX, fieldY-1],

                    [fieldX-1, fieldY],
                    [fieldX-1, fieldY+1],
                    [fieldX-1, fieldY-1],

                    [fieldX+1, fieldY],
                    [fieldX+1, fieldY+1],
                    [fieldX+1, fieldY-1],
                ];
    cells.forEach( cell => {
        if (checkBounds(cell[0], cell[1])) {
            neighbourFields.push(cell)
        };
    });
    return neighbourFields
};

function getCoordsShipWithNeighbour (fieldX, fieldY, location, lengthShip) {
    let neighbourFields = []
    let cellsCoordsShip = []
    if (location === 'h') {
        for (let i = 0; i < lengthShip; i++) {
                neighbourFields.push(...getNeighbourCells(fieldX+i, fieldY));
                cellsCoordsShip.push([fieldX+i, fieldY]);
            };
        }
    else if (location === 'v') {
        for (let i = 0; i < lengthShip; i++) {
            neighbourFields.push(...getNeighbourCells(fieldX, fieldY+i));
            cellsCoordsShip.push([fieldX, fieldY+i]);
        };
    };
    return {'neighbour': neighbourFields, 'ship': cellsCoordsShip}
};