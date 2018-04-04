import * as tfc from '@tensorflow/tfjs-core';
import { randomInt, randomPick } from '../lib/helpers.js';
import { inputTimesWeightAddBias } from '../lib/tensorUtils.js';

const math = tfc.ENV.math;

export default class FontModel {
  constructor(args) {
    this.init();
    this.modelVars = {};
  };
  init(loadedCallback) {
    const varLoader = new tfc.CheckpointLoader(`./dist/data/fonts`);
    varLoader.getAllVariables().then(vars => {
      this.modelVars = {
        input: { biases: '', weights: vars['input_font_bottleneck_W'] }, // W: 56443, 40 - input vectors for dataset
        dense_0: { biases: vars['dense_0_b'], weights: vars['dense_0_W'] }, // B: 102, W: 1024
        dense_1: { biases: vars['dense_1_b'], weights: vars['dense_1_W'] }, // B: 1024, W: 1024
        dense_2: { biases: vars['dense_2_b'], weights: vars['dense_2_W'] }, // B: 1024, W: 1024
        dense_3: { biases: vars['dense_3_b'], weights: vars['dense_3_W'] }, // B: 1024, W: 1024
        output: { biases: vars['output_sigmoid_b'], weights: vars['output_sigmoid_W'] }, // B: 1024, W: 4096
      }
      if (loadedCallback) {
        loadedCallback(this);
      }
    })
  };
  randomFontEmbedding(characterIndex) {
    return tfc.tidy(() => {
      const fontEmbeddings = this.modelVars.input.weights.getValues();
      const startIndex = randomInt(0, fontEmbeddings.length/40) * 40;
      const randomEmbedding = tfc.tensor1d(fontEmbeddings.slice(startIndex, startIndex + 40));
      return randomEmbedding;
    });
  };
  formatFontTensor(fontVector, characterIndex) {
    // Input Vector: 40 long font noise vector, with 62 one hot character vector at end
    return tfc.tidy(() => {
      const oneHot = tfc.oneHot(tfc.tensor1d([characterIndex]), 62).reshape([62]);
      return fontVector.concat(oneHot);
    });
  };
  encode(imageTensor) {
    // encodes an image to a vector in the model's space
  };
  decode(fontVector, characterIndex) { // vector to image
    // console.log(tfc.memory().numTensors)
    return tfc.tidy(() => {
      const inputVector = this.formatFontTensor(fontVector, characterIndex);
      const inputTensor = tfc.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: inputVector,
            weights: this.modelVars.dense_0.weights,
            biases: this.modelVars.dense_0.biases,
          }),
        0.01);
      });

      const hidden1 = tfc.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: inputTensor,
            weights: this.modelVars.dense_1.weights,
            biases: this.modelVars.dense_1.biases,
          }),
        0.01);
      });

      const hidden2 = tfc.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: hidden1,
            weights: this.modelVars.dense_2.weights,
            biases: this.modelVars.dense_2.biases,
          }),
        0.01);
      });

      const hidden3 = tfc.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: hidden2,
            weights: this.modelVars.dense_3.weights,
            biases: this.modelVars.dense_3.biases,
          }),
        0.01);
      });

      const output = tfc.tidy(() => {
        return math.sigmoid(
          inputTimesWeightAddBias({
            input: hidden3,
            weights: this.modelVars.output.weights,
            biases: this.modelVars.output.biases,
          }),
        0.01);
      });
      return output.getValues();
    });
  }
}
