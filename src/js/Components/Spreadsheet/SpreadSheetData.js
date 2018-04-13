const DemoSheet = (rows, cols) => {
  const emptyRow = [];
  for (let col = 0; col < (cols || 10); col++) {
    emptyRow.push('');
  }
  let data = {
    data: [
      emptyRow.slice(),
      [ '', 'Explore a latent space of fonts by picking fonts and\noperating between them!\n=======================================',  '', '' , '', '' ],
      emptyRow.slice(),
      [ '', "Fill a cell using the grid on the left. You can zoom in to find intermediate fonts. Let's pick a couple of interesting fonts.", '', '', '', "=DATAPICKER('1-8-6-0-0')", "=DATAPICKER('1-8-2-0-0')" ],
      [ '', 'Reference cells by specifying their cell coordinate. e.g. "=F4".', '', '', '', "=F4"],
      [ '', "Let's find the average of our two fonts. We can do so by using the \"AVERAGE\" operator.", '', '','', "=AVERAGE(F4, G4)" ],
      [ '', "Nice. Let's build a serif operator. We can do this by finding two similar fonts - one with serifs and one without.", '', '','', "=DATAPICKER('1-6-9-0-0')", "=DATAPICKER('1-8-9-0-0')" ],
      [ '', "Let's isolate the serif operator by subtraction. We can do so by using the \"MINUS\" operator.", '', '', '' , '=MINUS(F7, G7)', '' ],
      [ '', 'We can now apply the difference to our averaged font by using the \"SUM\" operator.',  '', '' , '', '=SUM(F6, F8)' ],
      [ '', 'Here we interpolate linearly between the two fonts using the \"LERP\" operator. We can also perform spherically by using \"SLERP\" instead.', ''],
      [ '', '=F4', '=LERP(B11, G11, 0.2)', '=LERP(B11, G11, 0.4)', '=LERP(B11, G11, 0.6)', '=LERP(B11, G11, 0.8)', '=G4', '' ],
    ],
    mergeCells: [
      { row: 1, col: 1, rowspan: 1, colspan: 6 },
      { row: 3, col: 1, rowspan: 1, colspan: 4 },
      { row: 4, col: 1, rowspan: 1, colspan: 4 },
      { row: 5, col: 1, rowspan: 1, colspan: 4 },
      { row: 6, col: 1, rowspan: 1, colspan: 4 },
      { row: 7, col: 1, rowspan: 1, colspan: 4 },
      { row: 8, col: 1, rowspan: 1, colspan: 4 },
      { row: 9, col: 1, rowspan: 1, colspan: 6 },
    ],
  }
  if (data.data.length < (rows || 17)) {
    const rowsToAdd = rows -  data.data.length;
    for (let row = 0; row < rowsToAdd; row++) {
      data.data.push(emptyRow.slice());
    }
  }
  return data;
}
module.exports = { DemoSheet };
