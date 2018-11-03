const fillGrid = (data, rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
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

const BlankSheet = (rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
  let data = {
    data: [emptyRow.slice()],
    mergeCells: [],
  };

  return fillGrid(data, numRows, numCols);
}

const OperatorDemoSheet = (rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
  let data = {
    data: [
      emptyRow.slice(),
      ["","has property","=DATAPICKER('V1-1-5-3-0-0')","=DATAPICKER('V1-1-4-8-0-0')","=DATAPICKER('V1-1-4-7-0-0')"],
      ["","doesn't have property","=DATAPICKER('V1-1-1-6-0-0')","=DATAPICKER('V1-1-3-7-0-0')","=DATAPICKER('V1-1-2-6-0-0')"],
      ["","difference","=MINUS(C2, C3)","=MINUS(D2, D3)","=MINUS(E2, E3)"],
      ["","scaled difference","=MUL(C4, C8)","=MUL(D4, D8)","=MUL(E4, E8)"],
      emptyRow.slice(),
      ["","input","boldness","serif strength","italic strength","transformed"],
      ["","=DATAPICKER('V1-1-4-6-0-0')","=SLIDER(-1, 1, 0.05)","=SLIDER(-1, 1, 0.05)","=SLIDER(-1, 1, 0.05)","=SUM(B8, C5:E5)"],
    ],
    mergeCells: [],
  };

  return fillGrid(data, numRows, numCols);
}

const FontDemoSheet = (rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
  let data = {
    data: [
      emptyRow.slice(),
      ["", "=DATAPICKER('V1-1-4-7-0-0')", "=DATAPICKER('V1-1-2-6-0-0')", "=MINUS(B2, C2)"],
      ["", "", "", "=SLIDER(-1, 1, 0.05)"],
      ["", "", "=DATAPICKER('V1-1-4-6-0-0')", "=MUL(D2, D3)", "=SUM(C4:D4)"],
    ],
    comments: [
      {row: 1, col: 3, comment: {value: 'An italic operator is created by subtracting an italicised glyph with a similar non-italicised glyph.', readOnly: true}},
      {row: 3, col: 3, comment: {value: 'Scaling the operator with a slider element.', readOnly: true}},
      {row: 3, col: 2, comment: {value: 'Input font.', readOnly: true}},
      {row: 3, col: 4, comment: {value: 'Applying the italic operator to the input font.', readOnly: true}}
    ]
  };

  return fillGrid(data, numRows, numCols);
}

const FaceDemoSheet = (rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
  let data = {
    data: [
      emptyRow.slice(),
      ["","","=DATAPICKER('V-1-1-2-0-0')","=LERP(C2, E2, 0.50)","=DATAPICKER('V-1-3-4-0-0')"],
      ["", "", "=LERP(C2, C4, 0.50)", "=LERP(D2, D4, 0.50)", "=LERP(E2, E4, 0.50)"],
      ["", "=LERP(C4, D4, -1.00)", "=DATAPICKER('V-1-5-4-0-0')", "=LERP(C4, E4, 0.50)", "=MOD(DATAPICKER('V-1-5-4-0-0'), 5, -0.70)"],
    ],
    comments: [
      {row: 1, col: 2, comment: {value: 'This grid is contructed by interpolating between four corners. These corners have been selected from the data picker to the left.', readOnly: true}},
      {row: 3, col: 1, comment: {value: 'Extrapolating in the direction of darker hair.', readOnly: true}},
      {row: 3, col: 4, comment: {value: 'Click and drag the circle to scrub the surrounding area for similar faces.', readOnly: true}},
    ]
  };

  return fillGrid(data, numRows, numCols);
}

const MNISTDemoSheet = (rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
  let data = {
    data: [
      emptyRow.slice(),
      ["","=DATAPICKER('MNIST-1-8-5-0-0')","=MOD(B2, 4, -0.20)","=MOD(B2, 5, -0.60)","=MOD(B2, 5, -0.78)","=AVERAGE(B2:E5)"],
      [ "", "=MOD(B2, 1, 0.40)", "=MOD(B2, 5, -0.70)", "=MOD(B2, 3, -0.50)", "=MOD(B2, 3, -0.47)"],
      [ "", "=MOD(B2, 1, 0.35)", "=MOD(B2, 3, -0.55)", "=MOD(B2, 1, 0.35)", "=MOD(B2, 2, -0.50)"],
      [ "", "=MOD(B2, 1, 0.52)", "=MOD(B2, 3, -0.50)", "=MOD(B2, 5, -0.60)", "=MOD(B2, 1, 0.51)"]
    ],
    comments: [
      {row: 1, col: 1, comment: {value: 'A grid of random neighbours are created from this cell using the MOD operation.', readOnly: true}},
      {row: 1, col: 5, comment: {value: 'The average result of the group.', readOnly: true}},
    ]
  };

  return fillGrid(data, numRows, numCols);
}

const Word2VecDemoSheet = (rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
  let data = {
    data: [
      emptyRow.slice(),
      ["", "=DATAPICKER('WORDS-1-0-5-0-0')", "=DATAPICKER('WORDS-1-6-9-0-0')"],
      ["", "=DATAPICKER('WORDS-1-3-4-0-0')", "=SUM(B3, MINUS(C2, B2))"],
    ],
    comments: [
      {row: 1, col: 1, comment: {value: 'Computing analogies using word vectors. "man" is to "woman" as "king" is to "queen".', readOnly: true}},
      {row: 2, col: 2, comment: {value: 'A list of closest matches are displayed when there isn\'t an exact match.', readOnly: true}},
    ]
  };

  return fillGrid(data, numRows, numCols);
}

const ColourDemoSheet = (rows, cols) => {
  const emptyRow = [];
  const numRows = rows || 17;
  const numCols = cols || 10;

  for (let col = 0; col < numCols; col++) {
    emptyRow.push('');
  }
  let data = {
    data:[
      emptyRow.slice(),
      ["", "=DATAPICKER('COL-1-5-3-0-0')", "=LERP(B2, F2, 0.25)", "=LERP(B2, F2, 0.50)", "=LERP(B2, F2, 0.75)", "=DATAPICKER('COL-1-1-1-0-0')"],
      ["", "=LERP(B2, B6, 0.25)", "=LERP(C2, C6, 0.25)", "=LERP(D2, D6, 0.25)", "=LERP(E2, E6, 0.25)", "=LERP(F2, F6, 0.25)"],
      ["", "=LERP(B2, B6, 0.50)", "=LERP(C2, C6, 0.50)", "=LERP(D2, D6, 0.50)", "=LERP(E2, E6, 0.50)", "=LERP(F2, F6, 0.50)"],
      ["", "=LERP(B2, B6, 0.75)", "=LERP(C2, C6, 0.75)", "=LERP(D2, D6, 0.75)", "=LERP(E2, E6, 0.75)", "=LERP(F2, F6, 0.75)"],
      ["", "=RANDVAR(3250)", "=LERP(B6, F6, 0.25)", "=LERP(B6, F6, 0.50)", "=LERP(B6, F6, 0.75)", "=DATAPICKER('COL-1-2-0-0-0')"]
    ],
    comments: [
      {row: 1, col: 1, comment: {value: 'The same interface can be used to explore colour spaces. This isn\'t a generative model, but makes for an effective tool to generate colour palettes.', readOnly: true}},
      {row: 5, col: 1, comment: {value: 'Click on the button in the bottom-right corner to randomise this cell\'s colour.', readOnly: true}},
    ]
  };

  return fillGrid(data, numRows, numCols);
}

module.exports = {
  BlankSheet,
  OperatorDemoSheet,
  FontDemoSheet,
  FaceDemoSheet,
  MNISTDemoSheet,
  Word2VecDemoSheet,
  ColourDemoSheet
};
