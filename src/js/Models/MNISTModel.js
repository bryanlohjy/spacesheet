// define model here
// import * as dl from 'deeplearn';
import * as tf from '@tensorflow/tfjs';

import { randomInt } from '../lib/helpers.js';

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
    this.latentDims = 2;
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
    const MODEL_URL = './dist/data/MNISTModel/model.json';
    const model = tf.loadModel(MODEL_URL).then(model => {
      this.loadedModel = model;
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
    const output = tf.tidy(() => {
      const z = tf.tensor(inputVector, [1, this.latentDims]);
      return this.loadedModel
                 .predict(z)
                 .reshape([28, 28]);
    });

    return output.dataSync();
  }
  randVectorFn(params) {
    const randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);

    const vec = tf.tidy(() => {
      return tf.randomNormal([1, this.latentDims], -1, 1, null, randomSeed); ;
    });

    return vec.dataSync();
  }
}
