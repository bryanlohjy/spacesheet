import Regex from '../../lib/Regex.js';

const CellHelpers = {
  getCellType: cellData => {
    if (!cellData) { return; }
    if (cellData.trim()[0] === '=') {
      if (new RegExp(Regex.CELLS.SLIDER).test(cellData)) {
        return 'SLIDER';
      }
      if (new RegExp(Regex.CELLS.RANDVAR).test(cellData)) {
        return 'RANDVAR';
      }
      return 'FORMULA';
    } else {
      return 'TEXT';
    }
  },
  
  cellLabelToCoords: label => {
    const letter = label.match(/[a-z]{1}/gi);
    const number = label.match(/([0-9]+)/gi);
    let res;
    if (letter && number) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      res = {
        row: Number(number[0]) - 1,
        col: alphabet.indexOf(letter[0].toUpperCase()),
      };
    }
    return res;
  },
  
  cellCoordsToLabel: coords => {
    let res;
    if (coords) {
      if (coords.row >= 0 && coords.col >= 0) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letter = alphabet[coords.col];
        const number = Number(coords.row) + 1;
        res = `${letter}${number}`;
      }
    }
    return res;
  },
  
  getCellFromLabel: (hotInstance, label) => {
    const coords = CellHelpers.cellLabelToCoords(label);
    if (coords) {
      return hotInstance.getCell(coords.row, coords.col)
    }
  },
  
  isFormula: data => {
    if (data) {
      return data.trim()[0] === '=';
    }
    return false;
  },
  
  cellLabelIsWithinSpreadsheet: (hotInstance, label) => {
    if (!hotInstance || !label) { return; }
    const { row, col } = CellHelpers.cellLabelToCoords(label);
    if (row < 0 || col < 0) { return; }
    if (row < hotInstance.countRows() && col < hotInstance.countCols()) {
      return true;
    }
    return false;
  },

  matrixForEach: (matrix, cellFn) => {
    matrix.forEach((row, rowIndex) => {
      row.forEach((val, colIndex) => {
        cellFn(val, rowIndex, colIndex);
      });
    });
  },

  matrixMap: (matrix, cellFn) => {
    let _matrix = matrix.slice();
    return _matrix.map((row, rowIndex) => {
      return row.map((val, colIndex) => {
        return cellFn(val, rowIndex, colIndex);
      });
    });
  }
};

module.exports = CellHelpers;
