export default (rows, cols, key, model) =>  {
  const grids = {};
  const grid = {};

  const gridData = {};
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellKey = `${row}-${col}`;
      const cellData = {};
      cellData.row = row;
      cellData.column = col;
      cellData.vector = model.randVectorFn();
      gridData[cellKey] = cellData;
    }
  }
  gridData.grid = { rows: rows, columns: cols };

  grid.data = gridData;
  grid.label = key;

  grids[key] = grid;
  return grids;
};
