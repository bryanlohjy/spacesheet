import Regex from '../../lib/Regex.js';

const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.trim()[0] === '=') {
    if (Regex.SLIDER.test(cellData)) {
      return 'SLIDER';
    }
    if (Regex.CELLS.RANDFONT.test(cellData)) {
      return 'RANDFONT';
    }
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}


module.exports = { GetCellType, Regex, };
