module.exports = {
  DemoSheet: (rows, cols) => {
    return {
      data: [
        [ 'Explore a latent space of fonts!' ],
        [ 'a', 'b', 'c' ],
        [ 'a', 'b', 'c' ],
        [ 'a', 'b', 'c' ],
        [ 'a', 'b', 'c' ],
        [ 'a', 'b', 'c' ],
        [ 'a', 'b', 'c' ],
        [ 'a', 'b', 'c' ],
        [ 'a', 'b', 'c' ],
        [ 'a', 'b', 'c' ],
      ],
      mergeCells: [
        { row: 0, col: 0, rowspan: 1, colspan: cols || 6 },
      ],
    }
  }
};
