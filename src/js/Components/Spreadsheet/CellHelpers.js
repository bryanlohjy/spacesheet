const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.trim()[0] === '=') {
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}
module.exports = { GetCellType };
