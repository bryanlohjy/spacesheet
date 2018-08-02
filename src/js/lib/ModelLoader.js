export default class ModelLoader {
  // use this to parse and check model definitions
  // provide defaults + spit out warnings for undefined fields
  constructor(app, modelConstructor) {
    const ModelTypes = {
      LEARNT: 'LEARNT',
      CONSTRUCTED: 'CONSTRUCTED'
    };

    this.app = app;
    this.modelConstructor = modelConstructor;
    this.defaults = {
      modelType: ModelTypes.LEARNT,
      drawFn: () => {},
      decodeFn: () => {},
      encodeFn: () => {},
      vectorSchema: [ // used to generate random values + eventually to be used by TSNE
        {
          get length() { return 10 },
          createRandom: () => { return [] },
        }
      ],
      randomVectorFn: null,
      outputWidth: 64,
      outputHeight: 64,
    }
  };
  load(modelLoadedCallback) {
    if (!this.modelConstructor) {
      console.error('No model constructor was provided in the ModelLoader');
      return;
    }
    const model = new this.modelConstructor();
    const self = this;
    model.init(loadedModel => {
      let errors = null;
      if (loadedModel.modelType === 'LEARNT') {
        // augment drawFN so it draws onto a memory ctx, and then onto the argument ctx - to simplify translation on DataPicker Canvas
        const clonedDrawFn = loadedModel.drawFn.bind({});
        const augmentedFn = (ctx, decodedData) => {
          clonedDrawFn(self.app.memoryCtx, decodedData);
          const memoryCtxData = self.app.memoryCtx.getImageData(0, 0, loadedModel.outputWidth, loadedModel.outputHeight);
          self.app.memoryCtx.putImageData(memoryCtxData, 0, 0);
          ctx.drawImage(self.app.memoryCtx.canvas, 0, 0);
        }
        loadedModel.drawFn = augmentedFn;
      }
      if (modelLoadedCallback && typeof modelLoadedCallback === 'function') {
        modelLoadedCallback(errors, loadedModel);
      }
    });
  };
}
