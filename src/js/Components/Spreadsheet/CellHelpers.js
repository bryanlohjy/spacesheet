const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.toUpperCase().indexOf('=DATAPICKER') > -1) {
    return 'DATAPICKER';
  } else {
    return 'TEXT';
  }
}

module.exports = { GetCellType };
