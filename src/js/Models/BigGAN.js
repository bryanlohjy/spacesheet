  // define model here
import * as dl from 'deeplearn';
import { randomInt } from '../lib/helpers.js';
import { inputTimesWeightAddBias } from '../lib/tensorUtils.js';
import hash from 'object-hash';

// https://www.npmjs.com/package/object-hash
const math = dl.ENV.math;

// const modelUrl = "http://deeptom.staff.vuw.ac.nz:5000";
const modelUrl = "http://localhost:5000";
const decodeUrl = `${modelUrl}/decode`;
const getLabelExamplesUrl = `${modelUrl}/label_examples`;
const createDataPickerUrl = `${modelUrl}/create_datapicker`;

const loadImg = (base64, imgElCallback) => {
  const imgPromise = new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      if (imgElCallback) {
        imgElCallback(img);
      }
      res(img);
    }
    img.src = base64;
  });

  return imgPromise;
};

// init
// outputWidth
// outputHeight
// drawFn
// decodeFn
// randVectorFn
export default class BigGANModel {
  constructor(opts) {
    this.outputWidth = 128;
    this.outputHeight = 128;

    this.latentDim = 140;

    try {
      this.init = this.init.bind(this);
      this.drawFn = this.drawFn.bind(this);
      this.decodeFn = this.decodeFn.bind(this);
      this.randVectorFn = this.randVectorFn.bind(this);
      this.cacheDatapicker = this.cacheDatapicker.bind(this);

      if (opts.afterDecode) {
        this.afterDecode = opts.afterDecode.bind(this);
      }

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

        const imgPromise = loadImg(cell.base64, imgEl => {
          cache[hashedVector] = imgEl;
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

  decoupleVectorLabel(vec) {
    const vector = vec.slice(0, this.latentDim);
    const label = vec.slice(this.latentDim);

    return {
      vector,
      label
    };
  }

  decodeVector(vec, label) {
    return fetch(decodeUrl, {
      method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `vector=${JSON.stringify(vec)}&label=${JSON.stringify(label)}`
    });
  }

  decodeFn(vec) {
    /*
      check if vector has been decoded before
        if yes {
          return image within cache
        } else {
          store in cache, and decode from server
        }
    */
    const hashedVector = hash.MD5(vec);
    let image = this.imageCache[hashedVector];

    if (image) {
      return image;
    }

    const { vector, label } = this.decoupleVectorLabel(Array.from(vec));

    this.decodeVector(vector, label).then(async res => {
      const base64 = await res.json();
      // TODO: logic from being redecoded if it is waiting for a response
      await loadImg(base64, imgEl => {
        this.imageCache[hashedVector] = imgEl;
        if (this.afterDecode) { this.afterDecode(imgEl); }
        return imgEl;
      });
    });

    // turn vector into image
    // intermediate image
    vec = vec.map(val => {
      return parseInt(val * 255);
    });
    return vec;
  }

  randVectorFn(params) {
    let randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);
    const r = randomInt(0, 100, randomSeed) / 100;
    const g = randomInt(0, 100, randomSeed + 1) / 100;
    const b = randomInt(0, 100, randomSeed + 2) / 100;
    return [ r, g, b ];
  }

  getLabelExamples(label) {
    console.log('getLabelExamples');
    return fetch(getLabelExamplesUrl, {
      method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: ``
    });
  }

  createDataPicker(label, name) {
    console.log('createDataPicker');
    return fetch(createDataPickerUrl, {
      method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: ``
    });
  }

}
