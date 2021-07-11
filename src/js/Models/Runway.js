// define model here
// import * as dl from 'deeplearn';
import * as tf from '@tensorflow/tfjs';
import { randomInt } from '../lib/helpers.js';
import { inputTimesWeightAddBias } from '../lib/tensorUtils.js';
import hash from 'object-hash';
import { HostedModel } from '@runwayml/hosted-models';

const model = new HostedModel({
  url:
    'https://stylegan2-pbaylies-fork-426b5d64.hosted-models.runwayml.cloud/v1/',
  token: 'iKk1wqSdafjb7vZMhC7sMA==',
});
// const model = new HostedModel({
//   url:
//     'https://kids-self-portrait-gan-64651be8.hosted-models.runwayml.cloud/v1/',
//   token: 'nuHyIQJVpxmGhQcW1uraxQ==',
// });

// const model = new HostedModel({
//   url: 'https://footweargan-f58dab01.hosted-models.runwayml.cloud/v1/',
//   token: 'uWSUFcxmCiFR0i8rddLUBg==',
// });

const loadImg = (base64, imgElCallback) => {
  const imgPromise = new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      if (imgElCallback) {
        imgElCallback(img);
      }
      res(img);
    };
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
export default class RunwayModel {
  constructor(opts) {
    this.outputWidth = 10;
    this.outputHeight = 10;

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
      creates images from initial set of vectors
    */
    const cache = {};
    let promises = [];

    for (let dpKey in dp) {
      const data = dp[dpKey].data.data;
      for (let cellKey in data) {
        const cell = data[cellKey];
        const vector = this.randVectorFn();
        const decodePromise = this.decodeFn(vector);
        promises.push(decodePromise);
      }
    }
    this.imageCache = cache;
    return Promise.all(promises);
  }

  async init(loadedCallback) {
    // executed by ModelLoader. This loads the checkpoint and model parameters
    await model.waitUntilAwake(5000);
    const info = await model.info();
    const { description, name, inputs, outputs } = info;

    this.modelSpecs = info;

    const vectorSpec = inputs.find((input) => input.type === 'vector');
    this.vectorSpec = vectorSpec;

    const imageSpec = outputs.find((output) => output.type === 'image');
    this.imageSpec = imageSpec;

    const { width, height } = await this.getImageOutputSize();
    this.outputWidth = width;
    this.outputHeight = height;

    loadedCallback(this);
  }

  async getImageOutputSize() {
    const vector = this.randVectorFn();

    const inputs = this.createInputObject(vector);
    const outputs = await model.query(inputs);
    const base64 = outputs[this.imageSpec.name];
    const imageEl = await loadImg(base64);

    return {
      width: imageEl.naturalWidth,
      height: imageEl.naturalHeight,
    };
  }

  async drawFn(ctx, decodedData) {
    decodedData = await decodedData;
    // logic to draw decoded vectors onto HTML canvas element
    if (decodedData instanceof HTMLImageElement) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(decodedData, 0, 0, this.outputWidth, this.outputHeight);
    } else {
      // loading state
      // const [r, g, b] = decodedData;
      ctx.fillStyle = `rgb(200, 200, 200)`;
      ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);
    }
  }

  createInputObject(vector) {
    const inputs = this.modelSpecs.inputs;
    let inputObject = {};
    inputs.forEach((input) => {
      const inputName = input.name;
      if (inputName === this.vectorSpec.name) {
        inputObject[inputName] = Array.from(vector);
      } else {
        inputObject[inputName] = input.default;
      }
    });
    return inputObject;
  }

  async decodeFn(vector) {
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
      return image;
    }

    const inputs = this.createInputObject(vector);
    const outputs = await model.query(inputs);
    const base64 = outputs[this.imageSpec.name];
    const imageEl = await loadImg(base64);
    this.imageCache[hashedVector] = imageEl;

    if (this.afterDecode) {
      this.afterDecode(imageEl);
    }
    return imageEl;
  }

  randVectorFn(params) {
    const randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);
    const { length, samplingMean, samplingStd } = this.vectorSpec;

    let array = tf
      .tidy(() => {
        return tf.randomNormal(
          [1, length],
          samplingMean,
          samplingStd,
          null,
          randomSeed
        );
      })
      .dataSync();
    return array;
  }
}
