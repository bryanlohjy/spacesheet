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
    // model params
    this.networkSize = 16;
    this.hiddenLayers = 3;
    this.latentDimensions = 8;
    console.log(dl)
    this.hasPrint = false;
  }
  init(loadedCallback) { // executed by ModelLoader. This loads the checkpoint and model parameters
    this.modelVars = {};
    // input vector = [ x, y, r, latentVec... ]
    const w = this.outputWidth;
    const h = this.outputHeight;
    this.modelVars.in = dl.randomUniform([this.latentDimensions, this.networkSize], -1, 1);
    for (let i = 0; i < this.hiddenLayers; i++) {
      this.modelVars[`w_${i}`] = dl.randomUniform([this.networkSize, this.networkSize], -1, 1);
    }
    this.modelVars.out = dl.randomUniform([this.networkSize, this.outputWidth * this.outputHeight], -1, 1);
    loadedCallback(this);
  }
  drawFn(ctx, decodedData) {
    // logic to draw decoded vectors onto HTML canvas element.
    // console.log(decodedData)
    const ctxData = ctx.getImageData(0, 0, this.outputWidth, this.outputHeight);
    const ctxDataLength = ctxData.data.length;
    for (let i = 0; i < ctxDataLength/4; i++) {
      const val = decodedData[i] * 255;
      ctxData.data[4*i] = val;    // RED (0-255)
      ctxData.data[4*i+1] = val;    // GREEN (0-255)
      ctxData.data[4*i+2] = val;    // BLUE (0-255)
      ctxData.data[4*i+3] = 255;  // ALPHA (0-255)
    }
    ctx.putImageData(ctxData, 0, 0);
  }
  decodeFn(inputVector) { // vector to image
    // https://github.com/Zephyr-D/cppn-tfjs/blob/master/cppn.js
    return dl.tidy(() => {
      const w = this.outputWidth;
      const h = this.outputHeight;
      const numPixels = w * h;

      let x = dl.range(0, 1, 1/w);
      x = x.tile([h]).reshape([numPixels, 1]);

      let y = dl.range(0, 1, 1/h);
      y = y.tile([w]).reshape([numPixels, 1]);

      const square = dl.scalar(2);
      let r = dl.sqrt(x.pow(square).add(y.pow(square)));
      r = r.reshape([numPixels, 1]);

      let z = dl.tensor(inputVector).reshape([1, this.latentDimensions]).mul(dl.ones([numPixels, 1]));
      z = z.reshape([numPixels, this.latentDimensions]);

      const input = x.add(y).add(r).add(z);
      // if (!this.hasPrint) {
      //   // console.log( input.print(), input.shape)
      //   console.log('oi', input.shape)
      //   this.hasPrint = true;
      // }

     // let input = dl.concat([x, y, r], -1).reshape([h, w, 3])

      // const vecScaled = dl.ones([h, w, this.latentDimensions]).mul(dl.tensor(inputVector));
      // input = input.concat(vecScaled, -1).reshape([1, h * w * (this.latentDimensions + 3)])

      let output = input.matMul(this.modelVars.in).tanh();

      for (let i = 0; i < this.hiddenLayers; i++) {
        const layerKey = `w_${i}`;
        output = output.matMul(this.modelVars[layerKey]).tanh();
      }
      output = output.matMul(this.modelVars.out).sigmoid();

      return output.dataSync();
    });
  }
  randVectorFn(params) {
    let randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);
    // return [ randomInt(0, 99999, randomSeed) / 99999 ]
    return dl.tidy(() => {
      return dl.randomUniform([this.latentDimensions], -1, 1, null, randomSeed);
    }).getValues();
  }
}
