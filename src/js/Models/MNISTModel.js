// define model here
import * as dl from 'deeplearn';
import { randomInt } from '../lib/helpers.js';
import { inputTimesWeightAddBias } from '../lib/tensorUtils.js';

const math = dl.ENV.math;

// init
// outputWidth
// outputHeight
// drawFn
// decodeFn
// randVectorFn


// vector length = 100;
export default class Model {
  constructor() {
    this.outputWidth = 28;
    this.outputHeight = 28;
    try {
      this.init = this.init.bind(this);
      this.drawFn = this.drawFn.bind(this);
      this.decodeFn = this.decodeFn.bind(this);
      this.randVectorFn = this.randVectorFn.bind(this);
    } catch (e) {
      console.error(e);
    }
  }
  init(loadedCallback) { // executed by ModelLoader. This loads the checkpoint and model parameters
    const checkpointPath = './dist/data/MNISTModel'; // path to model checkpoint;
    const varLoader = new dl.CheckpointLoader(checkpointPath);
    varLoader.getAllVariables().then(vars => {
      this.modelVars = {
        dense: { biases: vars['gen/dense/bias'], weights: vars['gen/dense/kernel']},
        dense_1: { biases: vars['gen/dense_1/bias'], weights: vars['gen/dense_1/kernel']},
        dense_2: { biases: vars['gen/dense_2/bias'], weights: vars['gen/dense_2/kernel']},
      }
      loadedCallback(this);
    });
  }
  drawFn(ctx, decodedData) {
    // logic to draw decoded vectors onto HTML canvas element.
    const ctxData = ctx.getImageData(0, 0, this.outputWidth, this.outputHeight);
    const ctxDataLength = ctxData.data.length;
    for (let i = 0; i < ctxDataLength/4; i++) {
      const val = (decodedData[i]) * 255;
      ctxData.data[4*i] = val;    // RED (0-255)
      ctxData.data[4*i+1] = val;    // GREEN (0-255)
      ctxData.data[4*i+2] = val;    // BLUE (0-255)
      ctxData.data[4*i+3] = 255;  // ALPHA (0-255)
    }
    ctx.putImageData(ctxData, 0, 0);
  }
  decodeFn(inputVector) { // vector to image
    return dl.tidy(() => {
      const inputTensor = dl.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: inputVector,
            weights: this.modelVars.dense.weights,
            biases: this.modelVars.dense.biases,
          }),
          0.01);
        });
      const hidden1 = dl.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: inputTensor,
            weights: this.modelVars.dense_1.weights,
            biases: this.modelVars.dense_1.biases,
          }),
          0.01);
        });
      const output = dl.tidy(() => {
        return math.tanh(
          inputTimesWeightAddBias({
            input: hidden1,
            weights: this.modelVars.dense_2.weights,
            biases: this.modelVars.dense_2.biases,
          }),
        );
      });
      return output.getValues();
    });
  }
  randVectorFn(params) {
    let randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);
    return dl.tidy(() => {
      return dl.randomNormal([100], 0, 1, null, randomSeed);;
    }).getValues();
  }
}
