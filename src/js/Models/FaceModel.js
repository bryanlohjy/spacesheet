import * as tf from '@tensorflow/tfjs';
import {loadFrozenModel} from '@tensorflow/tfjs-converter';

import { randomInt } from '../lib/helpers.js';

export default class Model {
  constructor() {
    this.outputWidth = 64;
    this.outputHeight = 64;
    try {
      this.init = this.init.bind(this);
      this.drawFn = this.drawFn.bind(this);
      this.decodeFn = this.decodeFn.bind(this);
      this.randVectorFn = this.randVectorFn.bind(this);
    } catch (e) {
      console.error(e);
    }
    this.latentDims = 128;
  }
  init(loadedCallback) { // executed by ModelLoader. This loads the checkpoint and model parameters
    const MODEL_URL = './dist/data/FaceModel/model.json';
    const model = tf.loadModel(MODEL_URL).then(model => {
      this.loadedModel = model;
      loadedCallback(this);
    });
  }
  drawFn(ctx, decodedData) {
    // logic to draw decoded vectors onto HTML canvas element.
    const ctxData = ctx.getImageData(0, 0, this.outputWidth, this.outputHeight);
    const ctxDataLength = ctxData.data.length;
    for (let i = 0; i < ctxDataLength/4; i++) { // iterate through each pixel
      var index = i *3;
      ctxData.data[4*i] = decodedData[index] * 255;    // RED (0-255)
      ctxData.data[4*i+1] = decodedData[index+1] * 255;  // GREEN (0-255)
      ctxData.data[4*i+2] = decodedData[index+2] * 255;  // BLUE (0-255)
      ctxData.data[4*i+3] = 255;  // ALPHA (0-255)
    }
    ctx.putImageData(ctxData, 0, 0);

  }
  decodeFn(inputVector) { // vector to image
    const output = tf.tidy(() => {
      return this.loadedModel.predict(tf.tensor(inputVector, [1, this.latentDims]))
              .squeeze().transpose([1, 2, 0])
              .div(tf.scalar(2)).add(tf.scalar(.5));
    });

    return output.dataSync();
  }
  randVectorFn(params) {
    const randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);
    let array = tf.tidy(() => {
      return tf.randomNormal([1, this.latentDims], 0, 1, null, randomSeed);
    }).dataSync();

    return array;
  }
}
