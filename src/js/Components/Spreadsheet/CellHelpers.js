const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.trim()[0] === '=') {
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}

const parseCellReferences = cellData => {
  let references = cellData.match(Regex.cellReferences);
  if (references && references.length > 0) {
    references = references.map(cell => {
      return cellReferenceToCoord(cell)
    });
  }
  return references;
}

const cellReferenceToCoord = cellReference => {
  const alphabet = cellReference.match(/[a-z]/ig)[0];
  const number = cellReference.match(/[0-9]+/ig)[0];
  const charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const res = {};
  if (alphabet && number) {
    res.row = parseInt(number) - 1;
    res.column = charString.indexOf(alphabet.toUpperCase());
  }
  return res;
}

const Regex = {
  cellReferences: /[a-z]\d{1,2}/ig,
}

module.exports = { GetCellType, parseCellReferences };
