const Regex = {
  slider: /\s*slider/ig,
};

const GetCellType = cellData => {
  if (!cellData) { return; }
  if (cellData.trim()[0] === '=') {
    if (new RegExp(Regex.slider).test(cellData)) {
      return 'SLIDER';
    }
    return 'FORMULA';
  } else {
    return 'TEXT';
  }
}


module.exports = { GetCellType, Regex, };
