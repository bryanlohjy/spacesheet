import Regex from '../../lib/Regex.js';

const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.trim()[0] === '=') {
    if (Regex.SLIDER.test(cellData)) {
      return 'SLIDER';
    }
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}


module.exports = { GetCellType, Regex, };
