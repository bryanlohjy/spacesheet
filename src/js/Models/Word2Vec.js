import { randomInt, getData } from '../lib/helpers.js';
import Word2VecUtils from './word2vecutils.js'

// ported from https://github.com/turbomaze/word2vecjson
export default class Model {
  constructor() {
    this.outputWidth = 82;
    this.outputHeight = 82;
    try {
      this.init = this.init.bind(this);
      this.drawFn = this.drawFn.bind(this);
      this.decodeFn = this.decodeFn.bind(this);
      this.randVectorFn = this.randVectorFn.bind(this);
    } catch (e) {
      console.error(e);
    }
    this.latentDims = 300;
  }
  init(loadedCallback) { // executed by ModelLoader. This loads the checkpoint and model parameters
    const MODEL_URL = './dist/data/Word2Vec/wordvecs-curated.json';
    getData(MODEL_URL).then(data => {
      const vectors = JSON.parse(data);
      this.vectors = vectors;
      this.utils = new Word2VecUtils(vectors);
      loadedCallback(this);
    });
  }
  drawFn(ctx, matches) {
    ctx.fillStyle = 'rgb(10, 10, 10)';
    ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);

    ctx.textAlign = 'center';
    if (matches[0][1] >= 0.99) { // if full confidence, render single word
      ctx.font  = `normal normal normal 12px Rubik`
      ctx.fillStyle = `rgb(225, 225, 225)`;
      ctx.fillText(matches[0][0], this.outputWidth/2, this.outputHeight/2);
    } else {
      const ySpacing = this.outputHeight / (matches.length + 1);
      // sort so greatest confidence is at the center
      const asc = matches.sort((a, b) => { return a[1] - b[1] });
      const sorted = [asc[0], asc[2], asc[4], asc[3], asc[1]];
      sorted.forEach((match, i) => {
        const [word, confidence] = match;
        const fontWeight = i == 2 ? 'normal' : 'normal';
        const fontSize = Math.max(12 * confidence, 8);
        ctx.font  = `normal normal ${fontWeight} ${fontSize}px Rubik`;
        ctx.fillStyle = `rgb(225, 225, 225, ${confidence})`;
        ctx.fillText(word, this.outputWidth/2, (ySpacing * i) + ySpacing);
      });
    }

    let borderOffset = 0;
    ctx.strokeStyle = 'rgb(40, 40, 40)';
    ctx.strokeRect(borderOffset, borderOffset, this.outputWidth-borderOffset*2, this.outputHeight-borderOffset*2);
  }
  decodeFn(inputVector) { // vector to word
    let matches = this.utils.getNClosestMatches(5, inputVector);
    return matches;
  }
  randVectorFn(params) {
    const randomSeed = !isNaN(parseInt(params)) ? params : randomInt(0, 99999);

    const words = Object.keys(this.vectors);

    const randomWord = words[randomSeed % words.length];

    return this.vectors[randomWord];
  }
}
