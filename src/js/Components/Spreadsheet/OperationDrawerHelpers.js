import { cellCoordsToLabel } from './CellHelpers.js';
import { getAllIndicesInArray } from '../../lib/helpers.js';

const getValidMatrix = arr => {
  if (!arr) { return; }
  return arr.map(row => {
    return row.map(val => {
      return val.trim().length > 0;
    });
  });
};
const arraysAreSimilar = (arr1, arr2) => {
  return JSON.stringify(arr1, null, 0) === JSON.stringify(arr2, null, 0);
};

const highlightCellsFromSelection = (hotInstance, selection) => {
  const startRow = Math.min(selection[0], selection[2]);
  const startCol = Math.min(selection[1], selection[3]);
  const endRow = Math.max(selection[0], selection[2]);
  const endCol = Math.max(selection[1], selection[3]);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = hotInstance.getCell(row, col);
      if (cell) {
        cell.classList.add('highlighted-reference');
      }
    }
  }
};

const highlightSmartFillArray = (hotInstance, arr) => {
  for (let cellRefIndex = 0; cellRefIndex < arr.length; cellRefIndex++) {
    const cell = arr[cellRefIndex];
    const reference = hotInstance.getCell(cell[0], cell[1]);
    if (reference) {
      reference.classList.add('highlighted-reference');
    }
  }
};

const twoArgSmartFillFn = (hotInstance, currentSelection, operationName) => {
  const output = { cellsToHighlight: [], fillString: "" };
  const selection = currentSelection;
  const startRow = Math.min(selection[0], selection[2]);
  const startCol = Math.min(selection[1], selection[3]);
  const endRow = Math.max(selection[0], selection[2]);
  const endCol = Math.max(selection[1], selection[3]);

  const reversedLabels = startRow != selection[0] || startCol != selection[1];

  const selectedCells = hotInstance.getData.apply(self, selection);
  const rows = selectedCells.length;
  const cols = selectedCells[0].length;
  const validMatrix = getValidMatrix(selectedCells);
  const verticalStrip = rows > 1 && cols === 1;
  const horizontalStrip = cols > 1 && rows === 1;

  let vals;
  if (horizontalStrip) {
    vals = validMatrix[0];
  } else if (verticalStrip) {
    vals = validMatrix.map(row => row[0]);
  }
  if (!vals || vals.length < 0) { return output };
  const valids = getAllIndicesInArray(vals, true);
  if (valids.length !== 2) { return output };

  let firstArgCoords;
  let secondArgCoords;
  if (horizontalStrip) {
    firstArgCoords = { row: startRow, col: valids[0] + startCol };
    secondArgCoords = { row: startRow, col: valids[1] + startCol };
  } else if (verticalStrip) {
    firstArgCoords = { row: valids[0] + startRow, col: startCol };
    secondArgCoords = { row: valids[1] + startRow, col: startCol };
  }

  const firstEmpty = vals.indexOf(false);
  let fillCellRow;
  let fillCellCol;
  if (firstEmpty < 0) { // if there are no empty cells selected, look outside selection
    if (horizontalStrip) {
      fillCellRow = startRow;
      fillCellCol = endCol + 1;
    } else if (verticalStrip) {
      fillCellRow = endRow + 1;
      fillCellCol = startCol;
    }
    if (fillCellRow < 0 || fillCellRow === hotInstance.countRows() || fillCellCol < 0 || fillCellCol === hotInstance.countCols()) {
      return output;
    }
  } else if (horizontalStrip) {
    fillCellRow = startRow;
    fillCellCol = startCol + firstEmpty;
  } else if (verticalStrip) {
    fillCellRow = startRow + firstEmpty;
    fillCellCol = startCol;
  }

  const firstArgLabel = cellCoordsToLabel(firstArgCoords);
  const secondArgLabel = cellCoordsToLabel(secondArgCoords);

  let fillString = `=${operationName}(${firstArgLabel}, ${secondArgLabel})`;

  // if labels have been reordered, order it back
  if (reversedLabels) {
    fillString = `=${operationName}(${secondArgLabel}, ${firstArgLabel})`;
  }
  output.fillString = fillString;

  output.cellsToHighlight.push([fillCellRow, fillCellCol]);
  return output;
}


module.exports = {
  getValidMatrix,
  arraysAreSimilar,
  highlightCellsFromSelection,
  highlightSmartFillArray,
  twoArgSmartFillFn,
};
