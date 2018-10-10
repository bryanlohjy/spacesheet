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

  console.log('parser:', parser, parser.parser.lexer)
  // let seenCells = [];
  // let seenCells = {};

  let cellBeingParsed = "";
  // let isCircular = false;

  let formulaToBeParsed = "";

  const parseDecorator = function(func) { // runs once
    return function() {
      formulaToBeParsed = arguments[0];

      if (arguments.length > 1) {
        cellBeingParsed = arguments[1];
      }



      // search for cell references to be parsed recursively and store indices

      // when a cell is recursively parsed, update the string and search for the cell which had been parsed.
      // if that cell matches its stored index, assume that it has been parsed successfully and move on.



      console.log(cellBeingParsed, ':start parse', parser.parser.lexer);


      // if (!seenCells[cellBeingParsed]) { seenCells[cellBeingParsed] = {} };
      // seenCells.push(cellBeingParsed);

      const result = func.apply(this, arguments);

      console.log(cellBeingParsed, ':finish parse')

      // seenCells = {};

      return result;
    }
  };

  const recursiveParseDecorator = function(func) {
    return function() {
      let cellLabel = arguments[1];
      console.log('|_', cellLabel, 'within', cellBeingParsed)

      // if (seenCells[cellBeingParsed][cellLabel])

      // if (cellLabel === undefined || seenCells.indexOf(cellLabel) > -1) {
      //   // console.log(cellBeingParsed, 'circref ')
      //   return { error: "#CIRCREF", result: null };
      // } else {
      //   seenCells.push(cellLabel);
      // }

      const result = func.apply(this, arguments);

      return result;
    }
  };

  parser.recursiveParse = recursiveParseDecorator(parser.parse);
  parser.parse = parseDecorator(parser.parse);



  let subCellBeingParsed = '';

  parser.on('callCellValue', (cellCoord, done) => {
    console.log(parser)
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
    // console.log(cellCoord)
    // if (!subCellBeing)
    const parsed = parser.recursiveParse(newVal,  cellCoord.label);

    if (parsed.error) {
      return;
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
