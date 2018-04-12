import { Parser } from 'hot-formula-parser';
// return a formula parser with overwritten functions to work with tensors
const FormulaParser = hotInstance => {
  // setInterval(() => {
  //   const rows = hotInstance.countRows();
  //   const cols = hotInstance.countCols();
  //
  //
  //   console.log(hotInstance.getData(0, 0, rows, cols))
  //
  // }, 10000)
  const parser = new Parser();
  return parser;
};

module.exports = { FormulaParser };
