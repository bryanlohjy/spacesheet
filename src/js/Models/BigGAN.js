// define model here
import * as dl from 'deeplearn';
import { randomInt } from '../lib/helpers.js';
import { inputTimesWeightAddBias } from '../lib/tensorUtils.js';
import hash from 'object-hash';

// https://www.npmjs.com/package/object-hash
const math = dl.ENV.math;

// init
// outputWidth
// outputHeight
// drawFn
// decodeFn
// randVectorFn
export default class BigGANModel {
  constructor() {
    this.outputWidth = 64;
    this.outputHeight = 64;
    try {
      this.init = this.init.bind(this);
      this.drawFn = this.drawFn.bind(this);
      this.decodeFn = this.decodeFn.bind(this);
      this.randVectorFn = this.randVectorFn.bind(this);
      this.cacheDatapicker = this.cacheDatapicker.bind(this);
    } catch (e) {
      console.error(e);
    }

    this.imageCache = {}; // store image reconstructions here by checksum hash of vector
  }

  cacheDatapicker(dp) {
    /*
      iterates through datapicker and caches images by checksum keys of tensors
    */
    const cache = {};

    for (let dpKey in dp) {
      const data = dp[dpKey].data.data;
      for (let cellKey in data) {
        const cell = data[cellKey];
        const hashedVector = hash.MD5(cell.vector);
        cache[hashedVector] = cell.base64;
      }
    }

    this.imageCache = cache;
  }

  init(loadedCallback) { // executed by ModelLoader. This loads the checkpoint and model parameters
    loadedCallback(this);
  }
  drawFn(ctx, decodedData) { // logic to draw decoded vectors onto HTML canvas element.
    const [ r, g, b ] = decodedData;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);
  }
  decodeFn(vector) {
    /*
      check if vector has been decoded before
        if yes {
          return image within cache
        } else {
          store in cache, and decode from server
        }
    */

    // turn vector into image



    vector = vector.map(val => {
      return parseInt(val * 255);
    });
    return vector;
  }
  randVectorFn(params) {
    let randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);
    const r = randomInt(0, 100, randomSeed) / 100;
    const g = randomInt(0, 100, randomSeed + 1) / 100;
    const b = randomInt(0, 100, randomSeed + 2) / 100;
    return [ r, g, b ];
  }
}
