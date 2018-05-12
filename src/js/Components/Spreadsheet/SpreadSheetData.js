const DemoSheet = (rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
  let data = {
    data: [
      emptyRow.slice(),
      // [ '', 'Explore a latent space of fonts by picking fonts and\noperating between them!\n=======================================',  '', '' , '', '' ],
      // [ '', "Fill a cell using the grid on the left. You can zoom in to find intermediate fonts. Let's pick a couple of interesting fonts.", '', '', '', "=DATAPICKER('1-8-6-0-0')", "=DATAPICKER('1-8-2-0-0')" ],
      // [ '', 'Reference cells by specifying their cell coordinate. e.g. "=F3".', '', '', '', "=F3"],
      // [ '', "Let's find the average of our two fonts. We can do so by using the \"AVERAGE\" operator.", '', '','', "=AVERAGE(F3:G3)" ],
      // [ '', "Nice. Let's build a serif operator. We can do this by finding two similar fonts - one with serifs and one without.", '', '','', "=DATAPICKER('1-6-9-0-0')", "=DATAPICKER('1-8-9-0-0')" ],
      // [ '', "Let's isolate the serif operator by subtraction. We can do so by using the \"MINUS\" operator.", '', '', '' , '=MINUS(F6, G6)', '' ],
      // [ '', 'We can now apply the difference to our averaged font by using the \"SUM\" operator.',  '', '' , '', '=SUM(F5, F7)' ],
      // [ '', 'Here we interpolate linearly between the two fonts using the \"LERP\" operator.', ''],
      // [ '', '=F3', '=LERP(B10, G10, 0.2)', '=LERP(B10, G10, 0.4)', '=LERP(B10, G10, 0.6)', '=LERP(B10, G10, 0.8)', '=G3', '' ],
      // [ '', 'We can modify numbers as \"SLIDER\" elements. The operator takes in three arguments - a start and end value, as well as an optional step value.' ],
      // [ '', '=F3', '=G3', '=SLIDER(0, 1, 0.05)', '=LERP(F3, G3, D12)' ],
    ],
    mergeCells: [
      // { row: 1, col: 1, rowspan: 1, colspan: 6 },
      // { row: 2, col: 1, rowspan: 1, colspan: 4 },
      // { row: 3, col: 1, rowspan: 1, colspan: 4 },
      // { row: 4, col: 1, rowspan: 1, colspan: 4 },
      // { row: 5, col: 1, rowspan: 1, colspan: 4 },
      // { row: 6, col: 1, rowspan: 1, colspan: 4 },
      // { row: 7, col: 1, rowspan: 1, colspan: 4 },
      // { row: 8, col: 1, rowspan: 1, colspan: 6 },
      // { row: 10, col: 1, rowspan: 1, colspan: 6 },
    ],
  };

  // make sure that a full grid is returned. Empties should be ""
  for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
    let row = data.data[rowIndex];
    if (!row) {
      data.data.push(emptyRow.slice());
    } else {
      if (row.length < numCols) {
        const colsToAdd = numCols - row.length;
        for (let colCount = 0; colCount < colsToAdd; colCount++) {
          row.push('');
        }
      }
    }
  }
  return data;
}
module.exports = { DemoSheet };
