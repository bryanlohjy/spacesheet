const { Parser } = require('hot-formula-parser');

const arrayContainsArray = arr => {
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] === 'array') {
      return true;
    }
  }
  return false;
}

const FormulaParser = (hotInstance, opts) => {
  const parser = new Parser();
  parser.on('callCellValue', (cellCoord, done) => {
    const rowIndex = cellCoord.row.index;
    const columnIndex = cellCoord.column.index;
    const newVal = hotInstance.getDataAtCell(rowIndex, columnIndex).replace('=', '');
    done(parser.parse(newVal).result);
  });

  // override common functions to check for and work with tensors
  // parser.on('callFunction', (name, params, done) => {
  //   switch (name) {
  //     case 'AVERAGE':
  //       console.log(name, params, done)
  //       done('UWAT')
  //
  //       return;
  //       break;
  //     default:
  //       return;
  //   }
  //   done();
  // });

  parser.setFunction('DATAPICKER', params => {
    return opts.getCellFromDataPicker(params);
  });

  return parser;
};

module.exports = { FormulaParser };
