import Regex from '../../lib/Regex.js';

const GetCellType = cellData => {
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


module.exports = { GetCellType, Regex, };
