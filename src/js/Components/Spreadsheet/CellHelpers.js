import Regex from '../../lib/Regex.js';

const getCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.trim()[0] === '=') {
    if (new RegExp(Regex.CELLS.SLIDER).test(cellData)) {
      return 'SLIDER';
    }
    if (new RegExp(Regex.CELLS.RANDFONT).test(cellData)) {
      return 'RANDFONT';
    }
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}

const cellLabelToCoords = label => {
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
}

const isFormula = data => {
  if (data) {
    return data.trim()[0] === '=';
  }
  return false;
}

module.exports = { getCellType, cellLabelToCoords, isFormula };
