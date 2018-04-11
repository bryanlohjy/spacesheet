const CellSchema = { image: [], value: [] };
module.exports = {
  Data: (rows, columns) => {
    const data = [];
    const dataSchema = [];
    return []
  },
  DataSchema: (rows) => {
    let dataSchema = [];
    for (let row = 0; row < rows; row++) {
      dataSchema.push(CellSchema);
    }
    return dataSchema;
  }
}
