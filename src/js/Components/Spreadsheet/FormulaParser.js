import { Parser } from 'hot-formula-parser';
// return a formula parser with overwritten functions to work with tensors
const FormulaParser = (hotInstance, opts) => {
  const parser = new Parser();
  parser.setFunction('DATAPICKER', params => {
    return opts.getCellFromDataPicker(params);
  });
  return parser;
};

module.exports = { FormulaParser };
