const DataPickerHelpers = {
  parseDataPickerKey: key => {
    if (!key) { return };
    key = key.replace(/["'\s]/gi, "");
    const split = key.split('-');
    return {
      scale: split[0],
      column: split[1],
      row: split[2],
      subcolumn: split[3],
      subrow: split[4],
    };
  },
}
module.exports = DataPickerHelpers;
