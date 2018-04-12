import { Parser } from 'hot-formula-parser';
// return a formula parser with overwritten functions to work with tensors
const FormulaParser = (hotInstance, opts) => {
  const parser = new Parser();

  parser.on('callCellValue', (cellCoord, done) => {
    const rowIndex = cellCoord.row.index;
    const columnIndex = cellCoord.column.index;
    const newVal = hotInstance.getDataAtCell(rowIndex, columnIndex).replace('=', '');
    done(parser.parse(newVal).result);
  });

  parser.setFunction('DATAPICKER', params => {
    return opts.getCellFromDataPicker(params);
  });
  return parser;

};

module.exports = { FormulaParser };
