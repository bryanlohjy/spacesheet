export default class ModelLoader {
  // use this to parse and check model definitions
  // spit out warnings for undefined fields
  constructor(app, modelConstructor) {
    this.app = app;
    this.modelConstructor = modelConstructor;
  };
  load(modelLoadedCallback) {
    let res = { errors: null, model: null };

    let errors = [];
    if (!this.modelConstructor) {
      errors.push('The model constructor was not passed into the ModelLoader correctly. Check the ModelLoader object in Application.jsx');
      res.errors = errors;
      modelLoadedCallback(res);
      return;
    }

    const model = new this.modelConstructor();
    if (!model.init) {
      errors.push('The model constructor does not have an init function.');
      res.errors = errors;
      modelLoadedCallback(res);
      return;
    }

    const errorMessages = {
      outputWidth: 'outputWidth not defined in model.',
      outputHeight: 'outputHeight not defined in model.',
      drawFn: 'drawFn not defined in model.',
      decodeFn: 'decodeFn not defined in model.',
      randVectorFn: 'randVectorFn not defined in model.',
    };

    for (let paramKey in errorMessages) {
      if (!model[paramKey]) {
        errors.push(errorMessages[paramKey]);
      }
    }

    if (errors.length > 0) {
      res.errors = errors;
      modelLoadedCallback(res);
      return;
    }

    // all is well, load model
    setTimeout(() => {
      model.init(loadedModel => {
        // augment drawFN so it draws onto a memory ctx, and then onto the argument ctx - to simplify translation on DataPicker Canvas
        const clonedDrawFn = loadedModel.drawFn.bind({});
        const augmentedFn = (ctx, decodedData) => {
          ctx.clearRect(0, 0, loadedModel.outputWidth, loadedModel.outputHeight);
          clonedDrawFn(this.app.memoryCtx, decodedData);
          const memoryCtxData = this.app.memoryCtx.getImageData(0, 0, loadedModel.outputWidth, loadedModel.outputHeight);
          this.app.memoryCtx.putImageData(memoryCtxData, 0, 0);
          ctx.drawImage(this.app.memoryCtx.canvas, 0, 0);
        }
        loadedModel.drawFn = augmentedFn;
        res.model = loadedModel;
        res.errors = null;
        modelLoadedCallback(res);
      });
    })
  };
}
