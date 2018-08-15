import * as tf from '@tensorflow/tfjs';
import {loadFrozenModel} from '@tensorflow/tfjs-converter';

// define model here
import * as dl from 'deeplearn';
import { randomInt, getData } from '../lib/helpers.js';
// import { inputTimesWeightAddBias } from '../lib/tensorUtils.js';
//
// const math = dl.ENV.math;

// init
// outputWidth
// outputHeight
// drawFn
// decodeFn
// randVectorFn

export default class Model {
  constructor() {
    this.outputWidth = 128;
    this.outputHeight = 128;
    this.asyncDecode = true;
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
    const MODEL_URL = './dist/data/progan-128/tensorflowjs_model.pb';
    const WEIGHTS_URL = './dist/data/progan-128/weights_manifest.json';

    loadFrozenModel(MODEL_URL, WEIGHTS_URL).then(model => {
      this.loadedModel = model;
      loadedCallback(this);
    });
  }
  drawFn(ctx, decodedData) {
    // // logic to draw decoded vectors onto HTML canvas element.
    // decodedData = decodedData.dataSync();
    if (!decodedData) {
      // this.decodeFn(this.randVectorFn(), ctx);
      return;
    }
    const ctxData = ctx.getImageData(0, 0, this.outputWidth, this.outputHeight);
    const ctxDataLength = ctxData.data.length;

    for (let i = 0; i < ctxDataLength/4; i++) { // iterate through each pixel
      ctxData.data[4*i] = decodedData[3*i] * 255;    // RED (0-255)
      ctxData.data[4*i+1] = decodedData[3*i+1] * 255;  // GREEN (0-255)
      ctxData.data[4*i+2] = decodedData[3*i+2] * 255;  // BLUE (0-255)
      ctxData.data[4*i+3] = 255;  // ALPHA (0-255)
    }
    ctx.putImageData(ctxData, 0, 0);
  }
  decodeFn(inputVector, decodedCallback) { // vector to image
    getData('http://127.0.0.1:5000/decode', { 'latentVector': inputVector }).then(res => {
      if (decodedCallback) {
        decodedCallback(JSON.parse(res).payload);
      }
    });
  }
  randVectorFn(params) {
    let randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);
    let array = tf.tidy(() => {
      return tf.randomNormal([1, 512], 0, 1, null, randomSeed);
    }).dataSync();
    // return dl.tensor1d(array);
    return array;
  }
}
