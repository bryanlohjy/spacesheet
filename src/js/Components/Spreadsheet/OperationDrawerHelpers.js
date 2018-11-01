import { cellCoordsToLabel, matrixForEach, matrixMap, getCellType } from './CellHelpers.js';
import { getAllIndicesInArray, random, randomPick } from '../../lib/helpers.js';
import { randDist } from './ModJoystick.js';

const getValidMatrix = arr => {
  if (!arr) { return; }
  return arr.map(row => {
    return row.map(val => {
      return val && val.trim().length > 0;
    });
  });
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

const groupArgSmartFillFn = (hotInstance, currentSelection, operationName) => {
  const output = { cellsToHighlight: [], fillString: '' };
  const selection = currentSelection;
  const startRow = Math.min(selection[0], selection[2]);
  const startCol = Math.min(selection[1], selection[3]);
  const endRow = Math.max(selection[0], selection[2]);
  const endCol = Math.max(selection[1], selection[3]);

  const selectedCells = hotInstance.getData.apply(self, selection);
  const rows = selectedCells.length;
  const cols = selectedCells[0].length;

  const validMatrix = getValidMatrix(selectedCells);
  const verticalStrip = rows > 1 && cols === 1;
  const horizontalStrip = cols > 1 && rows === 1;
  const gridSelection = rows > 1 && cols > 1;

  let _valCount = 0;
  let hasMultipleValues;
  for (let rowIndex = 0; rowIndex < validMatrix.length; rowIndex++) {
    const row = validMatrix[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const val = validMatrix[rowIndex][colIndex];
      if (val === true) {
        _valCount++;
        if (_valCount >= 2) {
          hasMultipleValues = true;
          break;
        }
      }
    }
  }
  const hasVals = _valCount > 0;
  if (!hasMultipleValues) { return output; }

  // if there are vals, and there is an empty at the end of selection
  if (verticalStrip || horizontalStrip) {
    let vals;
    if (verticalStrip) {
      vals = validMatrix.map(row => row[0]);
    } else if (horizontalStrip) {
      vals = validMatrix[0];
    }

    const emptyLastVal = vals[vals.length - 1] === false;
    const emptyValIsWithinSelection = verticalStrip ? rows > 2 : cols > 2;

    let startLabel;
    let endLabel;
    if (emptyLastVal && emptyValIsWithinSelection && hasVals) {
      if (verticalStrip) {
        output.cellsToHighlight = [[endRow, startCol]];
        startLabel = cellCoordsToLabel({ row: startRow, col: startCol });
        endLabel = cellCoordsToLabel({ row: endRow - 1, col: startCol });
      } else if (horizontalStrip) {
        output.cellsToHighlight = [[startRow, endCol]];
        startLabel = cellCoordsToLabel({ row: startRow, col: startCol });
        endLabel = cellCoordsToLabel({ row: startRow, col: endCol - 1 });
      }
      output.fillString = `=${operationName}(${startLabel}:${endLabel})`;
      return output;
    }
  }

  if (hasVals) { // populate cells to right, or bottom
    const numRows = hotInstance.countRows();
    const numCols = hotInstance.countCols();
    // check cells outside of selection
    const rightCell = endCol + 1 < numCols ? [[startRow, endCol + 1]] : false;
    const bottomCell = endRow + 1 < numRows ? [[endRow + 1, startCol]] : false;

    let startLabel = cellCoordsToLabel({ row: startRow, col: startCol });
    let endLabel = cellCoordsToLabel({ row: endRow, col: endCol });

    if (verticalStrip) { // if vertical, look to the bottom first
      if (bottomCell) {
        output.cellsToHighlight = bottomCell;
        output.fillString = `=${operationName}(${startLabel}:${endLabel})`;
      } else if (rightCell) {
        output.cellsToHighlight = rightCell;
        output.fillString = `=${operationName}(${startLabel}:${endLabel})`;
      }
    } else {
      if (rightCell) {
        output.cellsToHighlight = rightCell;
        output.fillString = `=${operationName}(${startLabel}:${endLabel})`;
      } else if (bottomCell) {
        output.cellsToHighlight = bottomCell;
        output.fillString = `=${operationName}(${startLabel}:${endLabel})`;
      }
    }
  }
  return output;
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
  const firstArgLabel = cellCoordsToLabel(firstArgCoords);
  const secondArgLabel = cellCoordsToLabel(secondArgCoords);
  let fillString = `=${operationName}(${firstArgLabel}, ${secondArgLabel})`;
  // if labels have been reordered, order it back
  if (reversedLabels) {
    fillString = `=${operationName}(${secondArgLabel}, ${firstArgLabel})`;
  }
  output.fillString = fillString;

  const firstEmpty = vals.indexOf(false);
  if (firstEmpty >= 0) {
    if (horizontalStrip) {
      output.cellsToHighlight = [[startRow, startCol + firstEmpty]];
    } else if (verticalStrip) {
      output.cellsToHighlight = [[startRow + firstEmpty, startCol]];
    }
  } else { // if there are no empty cells selected, look outside selection
    const numRows = hotInstance.countRows();
    const numCols = hotInstance.countCols();
    const rightCell = endCol + 1 < numCols ? [[startRow, endCol + 1]] : false;
    const bottomCell = endRow + 1 < numRows ? [[endRow + 1, startCol]] : false;
    if (verticalStrip) { // if vertical, look to the bottom first
      if (bottomCell) {
        output.cellsToHighlight = bottomCell;
      } else if (rightCell) {
        output.cellsToHighlight = rightCell;
      }
    } else if (horizontalStrip) {
      if (rightCell) {
        output.cellsToHighlight = rightCell;
      } else if (bottomCell) {
        output.cellsToHighlight = bottomCell;
      }
    }
  }
  return output;
}

const lerpSmartFillFn = (hotInstance, currentSelection) => {
  const output = { cellsToHighlight: [], newData: [] };
  const selection = currentSelection;
  const selectedCells = hotInstance.getData.apply(self, selection);

  const validMatrix = getValidMatrix(selectedCells);

  let anchors = [];
  let empties = [];
  let cornerAnchors = [];

  const rows = selectedCells.length;
  const cols = selectedCells[0].length;

  matrixForEach(validMatrix, (val, rowIndex, colIndex) => {
    const cellCoord = [rowIndex, colIndex];

    if (val) {
      anchors.push(cellCoord);
    } else {
      empties.push(cellCoord);
    }

    const topLeft = rowIndex == 0 && colIndex == 0;
    const topRight = rowIndex == 0 && colIndex == cols - 1;
    const bottomLeft = rowIndex == rows - 1 && colIndex == 0;
    const bottomRight = rowIndex == rows - 1 && colIndex == cols - 1;

    if (topLeft || topRight || bottomLeft || bottomRight) {
      if (val) {
        cornerAnchors.push([rowIndex, colIndex]);
      }
    }
  });

  const isHorizontal = (rows == 1 && cols > 1);
  const isVertical = (rows > 1 && cols == 1);

  const isLinear = isHorizontal || isVertical;
  const extrapolate = anchors.length == 2 && cornerAnchors.length != 2 && isLinear;
  const interpolate = cornerAnchors.length == 2 && isLinear;
  const isGrid = cornerAnchors.length >= 3;

  const startRow = Math.min(selection[0], selection[2]);
  const startCol = Math.min(selection[1], selection[3]);
  const endRow = Math.max(selection[0], selection[2]);
  const endCol = Math.max(selection[1], selection[3]);

  if (isLinear && (extrapolate || interpolate)) {
    const lerpAnchors = extrapolate ? anchors : cornerAnchors;
    let cellsBetweenAnchors;

    if (isHorizontal) {
      cellsBetweenAnchors = Math.abs(lerpAnchors[0][1] - lerpAnchors[1][1]) - 1;
    } else if (isVertical) {
      cellsBetweenAnchors = Math.abs(lerpAnchors[0][0] - lerpAnchors[1][0]) - 1;
    }

    const startLabel = cellCoordsToLabel({
                        row: lerpAnchors[0][0] + startRow,
                        col: lerpAnchors[0][1] + startCol,
                      });

    const endLabel =  cellCoordsToLabel({
                        row: lerpAnchors[1][0] + startRow,
                        col: lerpAnchors[1][1] + startCol,
                      });

    let nonAnchors = [];

    const _newData =  matrixMap(selectedCells, (val, rowIndex, colIndex) => {
      const isStartCell = rowIndex == lerpAnchors[0][0] && colIndex == lerpAnchors[0][1];
      const isEndCell = rowIndex == lerpAnchors[1][0] && colIndex == lerpAnchors[1][1];

      if (isStartCell || isEndCell) {
        return val;
      } else {
        nonAnchors.push([rowIndex, colIndex]);
      }

      const startLabel = cellCoordsToLabel({
                          row: lerpAnchors[0][0] + startRow,
                          col: lerpAnchors[0][1] + startCol,
                        });

      const endLabel =  cellCoordsToLabel({
                          row: lerpAnchors[1][0] + startRow,
                          col: lerpAnchors[1][1] + startCol,
                        });

      const interval = 1 / (cellsBetweenAnchors + 1);
      const distFromFirstAnchor = isHorizontal ? colIndex - lerpAnchors[0][1] : rowIndex - lerpAnchors[0][0];
      const degree = interval * distFromFirstAnchor;

      return `=LERP(${startLabel}, ${endLabel}, ${Number(degree).toFixed(2)})`;
    });

    const _cellsToHighlight = nonAnchors;

    return {
      cellsToHighlight: _cellsToHighlight.map(coord => {
        return [coord[0] + startRow, coord[1] + startCol];
      }),
      newData: _newData
    };
  } else if (isGrid) {
    const gridAnchors = {
      TL: null,
      TR: null,
      BR: null,
      BL: null,
    };

    let nonAnchors = [];

    matrixForEach(selectedCells, (val, rowIndex, colIndex) => {
      const validCell = validMatrix[rowIndex][colIndex];

      const TL = rowIndex == 0 && colIndex == 0;
      const TR = rowIndex == 0 && colIndex == cols - 1;
      const BR = rowIndex == rows - 1 && colIndex == cols - 1;
      const BL = rowIndex == rows - 1 && colIndex == 0;

      const cellCoord = [rowIndex, colIndex];
      const isAnchor = TL || TR || BR || BL;
      if (isAnchor && validCell) {
        if (TL) { gridAnchors.TL = cellCoord; }
        if (TR) { gridAnchors.TR = cellCoord; }
        if (BR) { gridAnchors.BR = cellCoord; }
        if (BL) { gridAnchors.BL = cellCoord; }
      } else {
        nonAnchors.push(cellCoord);
      }
    });

    const analogyGrid = gridAnchors.TL && gridAnchors.TR && gridAnchors.BL;
    const lerpGrid = gridAnchors.TL && gridAnchors.TR && gridAnchors.BL && gridAnchors.BR;

    if (!analogyGrid && !lerpGrid) {
      return output;
    }

    const _newData = matrixMap(selectedCells, (val, rowIndex, colIndex) => {
      const TL = rowIndex == 0 && colIndex == 0;
      const TR = rowIndex == 0 && colIndex == cols - 1;
      const BR = rowIndex == rows - 1 && colIndex == cols - 1;
      const BL = rowIndex == rows - 1 && colIndex == 0;
      const isAnchor = TL || TR || BR || BL;

      if (isAnchor) {
        if (!val) {
          const TLLabel = cellCoordsToLabel({
            row: gridAnchors.TL[0] + startRow,
            col: gridAnchors.TL[1] + startCol
          });

          const TRLabel = cellCoordsToLabel({
            row: gridAnchors.TR[0] + startRow,
            col: gridAnchors.TR[1] + startCol
          });

          const BLLabel = cellCoordsToLabel({
            row: gridAnchors.BL[0] + startRow,
            col: gridAnchors.BL[1] + startCol
          });

          return `=SUM(${BLLabel}, MINUS(${TRLabel}, ${TLLabel}))`;
        } else {
          return val;
        }
      } else {
        if (rowIndex == 0 || rowIndex == rows - 1) {
          const startLabel = cellCoordsToLabel({ row: startRow + rowIndex, col: startCol });
          const endLabel = cellCoordsToLabel({ row: startRow + rowIndex, col: endCol });

          const interval = 1 / (cols - 1);
          const degree = colIndex * interval;

          return `=LERP(${startLabel}, ${endLabel}, ${Number(degree).toFixed(2)})`;
        } else {
          const startLabel = cellCoordsToLabel({ row: startRow, col: startCol + colIndex });
          const endLabel = cellCoordsToLabel({ row: endRow, col: startCol + colIndex });

          const interval = 1 / (rows - 1);
          const degree = rowIndex * interval;

          return `=LERP(${startLabel}, ${endLabel}, ${Number(degree).toFixed(2)})`;
        }
      }
    });

    const _cellsToHighlight = nonAnchors;

    return {
      cellsToHighlight: _cellsToHighlight.map(coord => {
        return [coord[0] + startRow, coord[1] + startCol];
      }),
      newData: _newData
    };
  }

  return output;
}

const modSmartFillFn = (hotInstance, selection, modSegmentCount) => {
  let output = { cellsToHighlight: [], newData: [] };

  const selectedCells = hotInstance.getData.apply(self, selection);

  const startRow = Math.min(selection[0], selection[2]);
  const startCol = Math.min(selection[1], selection[3]);

  // mod if all cells can be modded, or if one moddable cell is in selection, mod from it
  const convertableCells = [];
  const cellsThatCanBeModdedFrom = [];
  const empties = [];
  let allCellsCanBeModded = true;

  matrixForEach(selectedCells, (val, rowIndex, colIndex) => {
    const cellType = getCellType(val);

    let canBeConverted = val && val.trim().length > 0 && (cellType === 'FORMULA' || cellType === 'RANDVAR');
    let canBeModdedFrom = val && val.trim().length > 0 && (cellType === 'FORMULA' || cellType === 'RANDVAR' || cellType === 'MOD');

    if (canBeConverted || canBeModdedFrom) { // perform DOM check only if it passes
      const cell = hotInstance.getCell(rowIndex+startRow, colIndex+startCol);
      const cellHasCanvas = cell.querySelectorAll('canvas') && cell.querySelectorAll('canvas').length > 0;
      if (!cellHasCanvas) {
        canBeConverted = false;
        canBeModdedFrom = false;
      }
    }

    const cellCoord = [startRow+rowIndex, startCol+colIndex];

    if (canBeConverted) {
      convertableCells.push(cellCoord);
    }

    if (canBeModdedFrom) {
      cellsThatCanBeModdedFrom.push(cellCoord);
    }

    if (!canBeConverted) {
      allCellsCanBeModded = false;
    }

    if (!val || val.trim().length === 0) {
      empties.push(cellCoord);
    }
  });

  // turn all cells into mod cells
  if (allCellsCanBeModded) {
    const _cellsToHighlight = [];
    const _newData = matrixMap(selectedCells, (val, rowIndex, colIndex) => {
      _cellsToHighlight.push([rowIndex+startRow, colIndex+startCol]);

      const segment = parseInt(random(1, modSegmentCount+1));
      return `=MOD(${val.replace(/=/gi, '')}, ${segment}, ${randDist()})`;
    });
    return {
      cellsToHighlight: _cellsToHighlight,
      newData: _newData,
    };
  }

  // turn empty cells into MOD cells which refer to a single moddable cell
  const rows = selectedCells.length;
  const cols = selectedCells[0].length;

  const numSelected = rows * cols;

  if (numSelected-empties.length === 1 && cellsThatCanBeModdedFrom.length === 1) {
    const _cellsToHighlight = empties;

    const modFrom = cellsThatCanBeModdedFrom[0];
    const modFromLabel = cellCoordsToLabel({
                          row: modFrom[0],
                          col: modFrom[1]
                        });

    const _newData = matrixMap(selectedCells, (val, rowIndex, colIndex) => {
      if (val) {
        return val;
      } else {
        const segment = parseInt(random(1, modSegmentCount+1));
        return `=MOD(${modFromLabel}, ${segment}, ${randDist()})`;
      }
    });

    return {
      cellsToHighlight: _cellsToHighlight,
      newData: _newData,
    };
  }

  return output;
}




module.exports = {
  getValidMatrix,
  highlightCellsFromSelection,
  highlightSmartFillArray,
  groupArgSmartFillFn,
  twoArgSmartFillFn,
  lerpSmartFillFn,
  modSmartFillFn
};
