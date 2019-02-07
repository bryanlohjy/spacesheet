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
    this.outputWidth = 128;
    this.outputHeight = 128;
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
      iterates through datapicker and preloads and caches images by checksum hashes of tensors
    */
    const cache = {};
    let promises = [];

    for (let dpKey in dp) {
      const data = dp[dpKey].data.data;
      for (let cellKey in data) {
        const cell = data[cellKey];
        const hashedVector = hash.MD5(cell.vector);
        cache[hashedVector] = cell.base64;

        const imgPromise = new Promise((res, rej) => {
          const img = new Image();
          img.onload = () => {
            cache[hashedVector] = img;
            res();
          }
          img.src = cell.base64;
        });
        promises.push(imgPromise);
      }
    }

    this.imageCache = cache;

    return Promise.all(promises);
  }

  init(loadedCallback) { // executed by ModelLoader. This loads the checkpoint and model parameters
    loadedCallback(this);
  }
  drawFn(ctx, decodedData) { // logic to draw decoded vectors onto HTML canvas element
    if (decodedData instanceof HTMLImageElement) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(decodedData, 0, 0, this.outputWidth, this.outputHeight);
    } else {
      const [ r, g, b ] = decodedData;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);
    }
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
    const hashedVector = hash.MD5(vector);
    let image = this.imageCache[hashedVector];

    if (image) {
      console.log('image exists');
      return image;
    }

    // turn vector into image
    console.log('ímage does not exist, load from server');
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
