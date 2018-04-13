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
    if (arrayContainsArray(params)) { // calulate tensor
      let result;
      switch (name.toUpperCase()) {
        case 'AVERAGE':
          result = dl.tidy(() => {
            let count = 1;
            let total = dl.tensor1d(params[0]);
            for (count; count < params.length; count++) {
              total = total.add(dl.tensor1d(params[count]));
            }
            return total.div(dl.scalar(count));
          }).getValues();
          done(result);
          break;
        case 'SUM':
        case 'ADD':
          result = dl.tidy(() => {
            let total = dl.tensor1d(params[0]);
            for (let i = 1; i < params.length; i++) {
              total = total.add(dl.tensor1d(params[i]));
            }
            return total;
          }).getValues();
          done(result);
          break;
        case 'MINUS':
          result = dl.tidy(() => {
            let total = dl.tensor1d(params[0]);
            for (let i = 1; i < params.length; i++) {
              total = total.sub(dl.tensor1d(params[i]));
            }
            return total;
          }).getValues();
          done(result);
          break;
        case 'LERP':
        case 'INTERPOLATE':
          result = dl.tidy(() => {
            const from = dl.tensor1d(params[0]);
            const to = dl.tensor1d(params[1]);
            const step = params[2];
            return from.add(to.sub(from).mul(dl.scalar(step)));
          }).getValues();
          done(result);
          break;
        case 'SLERP':
          result = dl.tidy(() => {
            const from = dl.tensor1d(params[0]);
            const to = dl.tensor1d(params[1]);
            const step = params[2];
            const omega = dl.acos(from.mul(to));
            const so = dl.sin(omega);
            return dl.sin(omega.mul(dl.scalar(1 - step)).div(so).mul(from).add(dl.sin(dl.scalar(step).mul(omega)).div(so).mul(to)));
          }).getValues();
          done(result);
          break;
        default:
          return;
      }
    }
  });

  parser.setFunction('DATAPICKER', params => {
    return opts.getCellFromDataPicker(params);
  });

  return parser;
};

module.exports = { FormulaParser };
