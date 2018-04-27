const { Parser } = require('hot-formula-parser');
import * as dl from 'deeplearn';
import Formulae from './Formulae.js';
import Regex from '../../lib/Regex.js';

const arrayContainsArray = arr => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].constructor.name === 'Array' || arr[i].constructor.name === 'Float32Array') {
      return true;
    }
  }
  return false;
};

const arrayIsARangeFragment = arr => {
  if (arr && arr.length === 1) {
    return true;
  };
}

const FormulaParser = (hotInstance, opts) => {
  const parser = new Parser();
  const CustomFormula = new Formulae({
    getCellFromDataPicker: opts.getCellFromDataPicker,
    model: opts.model,
  });

  parser.on('callCellValue', (cellCoord, done) => {
    const rowIndex = cellCoord.row.index;
    const columnIndex = cellCoord.column.index;
    const val = hotInstance.getDataAtCell(rowIndex, columnIndex);
    let newVal;
    if (new RegExp(Regex.SLIDER).test(val)) {
      const input = hotInstance.getCell(rowIndex, columnIndex).querySelector('input');
      newVal = input.value;
    } else {
      newVal = val.replace('=', '');
    }
    done(parser.parse(newVal).result);
  });

  parser.on('callRangeValue', function(startCellCoord, endCellCoord, done) {
    const startRowIndex = Math.min(startCellCoord.row.index, endCellCoord.row.index);
    const endRowIndex = Math.max(startCellCoord.row.index, endCellCoord.row.index);

    const startColIndex = Math.min(startCellCoord.column.index, endCellCoord.column.index);
    const endColIndex = Math.max(startCellCoord.column.index, endCellCoord.column.index);

    let fragment = [];
    for (let row = startRowIndex; row <= endRowIndex; row++) {
      const rowData = hotInstance.getDataAtRow(row);
      for (let col = startColIndex; col <= endColIndex; col++) {
        let value = rowData[col];
        if (value.toString().trim()[0] === '=') {
          value = parser.parse(rowData[col].slice(1)).result;
        }
        fragment.push(value);
      }
    }
    done(fragment);
  });

  // override common functions to check for and work with tensors
  parser.on('callFunction', (name, params, done) => {
    if (arrayIsARangeFragment(params)) {
      params = params[0];
    }
    const isTensorCalculation = arrayContainsArray(params);
    // evaluates using overwritten formulae, first, otherwise uses hot-formula defaults
    const result = CustomFormula.call(name, params, isTensorCalculation);
    done(result);
  });
  return parser;
};

module.exports = { FormulaParser };
