// define model here
import * as dl from 'deeplearn';
import { randomInt, randomPick } from '../lib/helpers.js';
import { inputTimesWeightAddBias } from '../lib/tensorUtils.js';

const math = dl.ENV.math;

export default class FontModel {
  constructor(app, weightsLoadedCallback) {
    this.checkpointPath = './dist/data/FontModel'; // path to model checkpoint;
    this.init(weightsLoadedCallback);
    this.outputWidth = 64;
    this.outputHeight = 64;
    this.modelType = 'LEARNT';

    this.drawFn = this.drawFn.bind(this);
    this.decodeFn = this.decodeFn.bind(this);
    this.randVectorFn = this.randVectorFn.bind(this);
  }
  init(weightsLoadedCallback) { // executed by ModelLoader. This loads the checkpoint and model parameters
    const varLoader = new dl.CheckpointLoader(this.checkpointPath);
    varLoader.getAllVariables().then(vars => {
      this.modelVars = {
        input: { biases: '', weights: vars['input_font_bottleneck_W'] }, // W: 56443, 40 - input vectors for dataset
        dense_0: { biases: vars['dense_0_b'], weights: vars['dense_0_W'] }, // B: 102, W: 1024
        dense_1: { biases: vars['dense_1_b'], weights: vars['dense_1_W'] }, // B: 1024, W: 1024
        dense_2: { biases: vars['dense_2_b'], weights: vars['dense_2_W'] }, // B: 1024, W: 1024
        dense_3: { biases: vars['dense_3_b'], weights: vars['dense_3_W'] }, // B: 1024, W: 1024
        output: { biases: vars['output_sigmoid_b'], weights: vars['output_sigmoid_W'] }, // B: 1024, W: 4096
      }
      if (weightsLoadedCallback && typeof weightsLoadedCallback === 'function') {
        weightsLoadedCallback(this);
      }
    });
  }
  drawFn(ctx, decodedData) { // logic to draw decoded vectors onto HTML canvas element.
    const ctxData = ctx.getImageData(0, 0, this.outputWidth, this.outputHeight);
    const ctxDataLength = ctxData.data.length;
    for (let i = 0; i < ctxDataLength/4; i++) {
      const val = (1 - decodedData[i]) * 255;
      ctxData.data[4*i] = val;    // RED (0-255)
      ctxData.data[4*i+1] = val;    // GREEN (0-255)
      ctxData.data[4*i+2] = val;    // BLUE (0-255)
      ctxData.data[4*i+3] = decodedData[i] <= 0.05 ? 0 : 255;  // ALPHA (0-255)
    }
    ctx.putImageData(ctxData, 0, 0);
  }
  decodeFn(fontVector, characterIndex) { // vector to image
    const formatFontTensor = (fontVector, characterIndex) =>  {
      // Input Vector: 40 long font noise vector, with 62 one hot character vector at end
      return dl.tidy(() => {
        if (fontVector.constructor.name.toLowerCase() !== 'tensor') {
          fontVector = dl.tensor1d(fontVector);
        }
        const oneHot = dl.oneHot(dl.tensor1d([characterIndex]), 62).reshape([62]);
        return fontVector.concat(oneHot);
      });
    };
    return dl.tidy(() => {
      const inputVector = formatFontTensor(fontVector, characterIndex);
      const inputTensor = dl.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: inputVector,
            weights: this.modelVars.dense_0.weights,
            biases: this.modelVars.dense_0.biases,
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

      const hidden2 = dl.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: hidden1,
            weights: this.modelVars.dense_2.weights,
            biases: this.modelVars.dense_2.biases,
          }),
        0.01);
      });

      const hidden3 = dl.tidy(() => {
        return math.leakyRelu(
          inputTimesWeightAddBias({
            input: hidden2,
            weights: this.modelVars.dense_3.weights,
            biases: this.modelVars.dense_3.biases,
          }),
        0.01);
      });

      const output = dl.tidy(() => {
        return math.sigmoid(
          inputTimesWeightAddBias({
            input: hidden3,
            weights: this.modelVars.output.weights,
            biases: this.modelVars.output.biases,
          }),
        );
      });
      return output.getValues();
    });
  }
  randVectorFn(params) {
    let randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);
    return dl.tidy(() => {
      const fontEmbeddings = this.modelVars.input.weights.getValues();
      const numberOfFonts = fontEmbeddings.length/40;
      const startIndex = randomInt(0, numberOfFonts, randomSeed) * 40;
      const randomEmbedding = dl.tensor1d(fontEmbeddings.slice(startIndex, startIndex + 40));
      return randomEmbedding;
    }).getValues();
  }
}


// export default class FontModel {
//   constructor(loadedCallback) {
//     this.init(loadedCallback);
//     this.modelVars = {};
//     // Output dimensions in pixels
//     this.outputWidth = 64;
//     this.outputHeight = 64;
//
//     // type: ModelTypes.LEARNT,
//     // drawFn: () => {},
//     // decodeFn: () => {},
//     // encodeFn: () => {},
//     // randomVector: null,
//     // vectorSchema: [ // used to generate random values + eventually to be used by TSNE
//     //   {
//     //     get length() { return 10 },
//     //     createRandom: () => { return [] },
//     //   }
//     // ],
//     // outputWidth: 64,
//     // outputHeight: 64,
//   };
//   init(loadedCallback) {
//     const varLoader = new dl.CheckpointLoader(`./dist/data/Model`);
//     varLoader.getAllVariables().then(vars => {
//       this.modelVars = {
//         input: { biases: '', weights: vars['input_font_bottleneck_W'] }, // W: 56443, 40 - input vectors for dataset
//         dense_0: { biases: vars['dense_0_b'], weights: vars['dense_0_W'] }, // B: 102, W: 1024
//         dense_1: { biases: vars['dense_1_b'], weights: vars['dense_1_W'] }, // B: 1024, W: 1024
//         dense_2: { biases: vars['dense_2_b'], weights: vars['dense_2_W'] }, // B: 1024, W: 1024
//         dense_3: { biases: vars['dense_3_b'], weights: vars['dense_3_W'] }, // B: 1024, W: 1024
//         output: { biases: vars['output_sigmoid_b'], weights: vars['output_sigmoid_W'] }, // B: 1024, W: 4096
//       }
//       if (loadedCallback) {
//         loadedCallback(this);
//       }
//     })
//   };
//   randomFontEmbedding(characterIndex, randomSeed) {
//     return dl.tidy(() => {
//       const fontEmbeddings = this.modelVars.input.weights.getValues();
//       const numberOfFonts = fontEmbeddings.length/40;
//       const startIndex = randomInt(0, numberOfFonts, randomSeed) * 40;
//       const randomEmbedding = dl.tensor1d(fontEmbeddings.slice(startIndex, startIndex + 40));
//       return randomEmbedding;
//     });
//   };
//   decode(fontVector, characterIndex) { // vector to image
//     const formatFontTensor = (fontVector, characterIndex) =>  {
//       // Input Vector: 40 long font noise vector, with 62 one hot character vector at end
//       return dl.tidy(() => {
//         if (fontVector.constructor.name.toLowerCase() !== 'tensor') {
//           fontVector = dl.tensor1d(fontVector);
//         }
//         const oneHot = dl.oneHot(dl.tensor1d([characterIndex]), 62).reshape([62]);
//         return fontVector.concat(oneHot);
//       });
//     };
//
//     // console.log(dl.memory().numTensors)
//     return dl.tidy(() => {
//       const inputVector = formatFontTensor(fontVector, characterIndex);
//       const inputTensor = dl.tidy(() => {
//         return math.leakyRelu(
//           inputTimesWeightAddBias({
//             input: inputVector,
//             weights: this.modelVars.dense_0.weights,
//             biases: this.modelVars.dense_0.biases,
//           }),
//         0.01);
//       });
//
//       const hidden1 = dl.tidy(() => {
//         return math.leakyRelu(
//           inputTimesWeightAddBias({
//             input: inputTensor,
//             weights: this.modelVars.dense_1.weights,
//             biases: this.modelVars.dense_1.biases,
//           }),
//         0.01);
//       });
//
//       const hidden2 = dl.tidy(() => {
//         return math.leakyRelu(
//           inputTimesWeightAddBias({
//             input: hidden1,
//             weights: this.modelVars.dense_2.weights,
//             biases: this.modelVars.dense_2.biases,
//           }),
//         0.01);
//       });
//
//       const hidden3 = dl.tidy(() => {
//         return math.leakyRelu(
//           inputTimesWeightAddBias({
//             input: hidden2,
//             weights: this.modelVars.dense_3.weights,
//             biases: this.modelVars.dense_3.biases,
//           }),
//         0.01);
//       });
//
//       const output = dl.tidy(() => {
//         return math.sigmoid(
//           inputTimesWeightAddBias({
//             input: hidden3,
//             weights: this.modelVars.output.weights,
//             biases: this.modelVars.output.biases,
//           }),
//         );
//       });
//       return output.getValues();
//     });
//   }
// }
