import { Parser } from 'hot-formula-parser';
import grammarParser from 'hot-formula-parser/lib/grammar-parser/grammar-parser';
import * as dl from 'deeplearn';
import Formulae from './Formulae.js';
import Regex from '../../lib/Regex.js';
import { getIndicesOf } from '../../lib/helpers.js';
import { isFormula, cellCoordsToLabel } from './CellHelpers.js';

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

      // flag to group arguments which have been split within nested brackets
      let captureGroup = false;
      for (let index = 0; index < split.length; index++) {
        const argFragment = split[index];

        if (captureGroup && args.length > 0) {
          args[args.length - 1] += `,${argFragment}`;
        } else {
          args.push(argFragment);
        }

        if (!captureGroup) { // start capturing if there is an unclosed set of brackets
          captureGroup = (/\(/gi).test(argFragment) && !(/\)/gi).test(argFragment);
        } else { // stop capturing if prev argument has a closed bracket
          var prevArg = args[args.length - 1];
          if (prevArg && prevArg.indexOf(')') > -1) {
            captureGroup = false;
          }
        }

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

  let parseCount = 0;
  let circRef = false;
  let cellBeingParsed = "";
  let seenCells = {};

  const parseDecorator = function(func) { // runs once per cell
    return function(value, srcCellLabel) {
      parseCount = 0;
      circRef = false;
      cellBeingParsed = srcCellLabel;
      seenCells = {};
      seenCells[srcCellLabel] = value;

      const result = func.apply(this, arguments);

      // if (result.error) {
      //   console.log(srcCellLabel, result.error, result.result)
      // }

      if (result.error && circRef) {
        result.error = '#CIRCREF';
      }

      if (typeof result.result === 'boolean') {
        result.error = '#CIRCREF';
        result.result = null;
      }

      return result;
    }
  };

  const recursiveParseDecorator = function(func) {
    return function(cellVal, cellLabel) {
      parseCount++;

      for (const label in seenCells) {
        circRef = cellVal.indexOf(label) > -1 && seenCells[label].indexOf(cellLabel) > -1;

        if (circRef) {
          break;
        }
      }

      if (circRef || parseCount > 999) {
        circRef = true;
        return { result: null, error: '#CIRCREF' };
      } else {
        seenCells[cellLabel] = cellVal;
      }

      if (!circRef) {
        const result = func.apply(this, arguments);
        return result;
      }
    }
  };

  parser.recursiveParse = recursiveParseDecorator(parser.parse);
  parser.parse = parseDecorator(parser.parse);

  parser.on('callCellValue', (cellCoord, done) => {
    const rowIndex = cellCoord.row.index;
    const columnIndex = cellCoord.column.index;
    const val = hotInstance.getDataAtCell(rowIndex, columnIndex);

    let cellVal;

    if (new RegExp(Regex.SLIDER).test(val)) {
      const input = hotInstance.getCell(rowIndex, columnIndex).querySelector('input');
      cellVal = input.value;
    } else {
      cellVal = val.replace('=', '');
    }

    let parsed = parser.recursiveParse(cellVal, cellCoord.label);

    if (parsed.error) {
      return parsed.error;
    } else {
      done(parsed.result);
    }
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
          const cellLabel = cellCoordsToLabel({row, col});
          const result = parser.recursiveParse(rowData[col].slice(1), cellLabel);
          value = result.error || result.result;
        }
        fragment.push(value);
      }
    }

    // TODO: tidy up bad
    fragment.isFragment = true;
    done(fragment);
  });

  // override common functions to check for and work with tensors
  parser.on('callFunction', (name, paramChunks, done) => {
    const params = [];

    // flatten all arg chunks into a single array
    for (let argIndex = 0; argIndex < paramChunks.length; argIndex++) {
      const paramChunk = paramChunks[argIndex];
      // flatten nested arrays
      if (Array.isArray(paramChunk) && paramChunk.isFragment) { // if it is an array and not a vector, flatten it out
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
