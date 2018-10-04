import * as dl from 'deeplearn';
const math = dl.ENV.math;

const tensorUtils = {
  inputTimesWeightAddBias(params) { // takes in input, weights, biases and activation function
    return dl.tidy(() => {
      let { input, weights, biases } = { ...params };
      if (input.constructor.name !== 'Tensor') {
        input = dl.tensor(input);
      }
      return math.add(math.vectorTimesMatrix(input, weights), biases);
    })
  },
	lerp(from, to, step) {
    return dl.tidy(() => {
      return from.add(to.sub(from).mul(dl.scalar(step)));
    });
  },
  slerp(from, to, step) { // spherical
    return dl.tidy(() => {
      const omega = dl.acos(from.mul(to));
      const so = dl.sin(omega);
      return dl.sin(omega.mul(dl.scalar(1 - step)).div(so).mul(from).add(dl.sin(dl.scalar(step).mul(omega)).div(so).mul(to)));
    });
  },
  blerp(x, y, points) { // bilinear interpolation
    /* Adapted from Raymond Hettinger's python implementation https://stackoverflow.com/questions/8661537/how-to-perform-bilinear-interpolation-in-python
    Points are an array of four triplets [ col, row, value ]
    */
    return;
    let sorted = points.sort((a, b) => {
      // Sort first by x
      if (a[0] < b[0]) {
        return -1;
      } else if (a[0] > b[0]) {
        return 1;
      }
      // then by y
      if (a[1] < b[1]) {
        return -1;
      } else if (a[1] > b[1]) {
        return 1;
      }
      return 0;
    });

    return dl.tidy(() => {
      const [ x1, y1, q11 ]   = [ ... sorted[0] ];
      const [ _x1, y2, q12 ]  = [ ... sorted[1] ];
      const [ x2, _y1, q21 ]  = [ ... sorted[2] ];
      const [ _x2, _y2, q22 ] = [ ... sorted[3] ];

      const a = dl.tensor1d(q11).mul(dl.scalar(x2 - x)).mul(dl.scalar(y2 - y));
      const b = dl.tensor1d(q21).mul(dl.scalar(x - x1)).mul(dl.scalar(y2 - y));
      const c = dl.tensor1d(q12).mul(dl.scalar(x2 - x)).mul(dl.scalar(y - y1));
      const d = dl.tensor1d(q22).mul(dl.scalar(x - x1)).mul(dl.scalar(y - y1));

      const denominator = dl.scalar(x2 - x1).mul(dl.scalar(y2 - y1));
      const result = a.add(b).add(c).add(c).div(denominator).getValues();

      return a.add(b).add(c).add(c).div(denominator)
    });
  },
};
module.exports = tensorUtils;
