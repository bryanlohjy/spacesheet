const { Parser } = require('hot-formula-parser');
import * as dl from 'deeplearn';
import Formulae from './Formulae.js';
import Regex from '../../lib/Regex.js';
import { getIndicesOf } from '../../lib/helpers.js';
import { isFormula } from './CellHelpers.js';

const arrayContainsArray = arr => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].constructor.name === 'Array' || arr[i].constructor.name === 'Float32Array') {
      return true;
    }
  }
  return false;
};

const getArgumentsFromFunction = (string) => {
  let res = [];
  const openBracketIndices = getIndicesOf('(', string);
  const closeBracketIndices = getIndicesOf(')', string);
  if (openBracketIndices.length && closeBracketIndices.length) {
    const startIndex = openBracketIndices[0];
    const endIndex = closeBracketIndices[closeBracketIndices.length - 1];
    let betweenBrackets = (/\((.*)\)/gi).exec(string.substr(startIndex, endIndex));
    betweenBrackets = betweenBrackets ? betweenBrackets[1] : null;

    let args = [];
    if (betweenBrackets && betweenBrackets.trim().length > 0) {
      const split = betweenBrackets.split(',');
      let concat = false;
      for (let index = 0; index < split.length; index++) {
        const argFragment = split[index];
        if (concat && args.length > 0) {
          args[args.length - 1] += `,${argFragment}`;
        } else {
          args.push(argFragment);
        }
        concat = (/\(/gi).test(argFragment) && !(/\)/gi).test(argFragment);
      }
    }
    for (let argIndex = 0; argIndex < args.length; argIndex++) {
      const arg = args[argIndex];
      if (arg && arg.trim().length) {
        res.push(arg.trim());
      }
    }
  }
  return res;
};

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
        if (isFormula(value.toString())) {
          value = parser.parse(rowData[col].slice(1)).result;
        }
        fragment.push(value);
      }
    }
    done(fragment);
  });

  // override common functions to check for and work with tensors
  parser.on('callFunction', (name, paramChunks, done) => {
    const params = [];
    // flatten all arg chunks into a single array
    for (let argIndex = 0; argIndex < paramChunks.length; argIndex++) {
      const paramChunk = paramChunks[argIndex];
      // flatten nested arrays
      if (Array.isArray(paramChunk) && paramChunk.length !== 40) { // if it is an array and not a vector, flatten it out
        for (let paramIndex = 0; paramIndex < paramChunk.length; paramIndex++) {
          params.push(paramChunk[paramIndex]);
        }
      } else {
        params.push(paramChunk);
      }
    }

    const isTensorCalculation = arrayContainsArray(params);
    // evaluates using overwritten formulae, first, otherwise uses hot-formula defaults
    const result = CustomFormula.call(name, params, isTensorCalculation);
    done(result);
  });
  return parser;
};

module.exports = { FormulaParser, getArgumentsFromFunction };
