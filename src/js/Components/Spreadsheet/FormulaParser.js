const { Parser } = require('hot-formula-parser');
import * as dl from 'deeplearn';

const arrayContainsArray = arr => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].constructor.name === 'Array' || arr[i].constructor.name === 'Float32Array') {
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
  parser.on('callFunction', (name, params, done) => {
    switch (name.toUpperCase()) {
      case 'AVERAGE':
        if (arrayContainsArray(params)) { // calulate tensor
          const result = dl.tidy(() => {
            let count = 1;
            let total = dl.tensor1d(params[0]);
            for (count; count < params.length; count++) {
              total = total.add(dl.tensor1d(params[count]));
            }
            return total.div(dl.scalar(count));
          }).getValues();
          done(result);
        }
        break;
      default:
        return;
    }
    done();
  });

  parser.setFunction('DATAPICKER', params => {
    return opts.getCellFromDataPicker(params);
  });

  return parser;
};

module.exports = { FormulaParser };
