const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.trim()[0] === '=') {
    if ((/\s*slider/ig).test(cellData)) {
      return 'SLIDER';
    }
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}

module.exports = { GetCellType };
