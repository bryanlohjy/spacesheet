const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.toUpperCase().indexOf('=DATAPICKER') > -1) {
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}

module.exports = { GetCellType };
