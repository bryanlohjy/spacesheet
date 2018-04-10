export default class CellType {
  constructor(opts) {
    this.drawFn = opts.drawFn;
    this.outputWidth = opts.outputWidth;
    this.outputHeight = opts.outputHeight;

    this.renderer = this.renderer.bind(this);
    // this.drawFn
    // this.decodeFn
  };
  // let editor = HandsOnTable.editors.TextEditor.prototype.extend();
  // editor.prototype.prepare = function(row, col, prop, td, originalValue, cellProperties){
  //   HandsOnTable.editors.TextEditor.prototype.prepare.apply(this, arguments);
  //   this.beginEditing = () => {
  //     HandsOnTable.editors.TextEditor.prototype.beginEditing.apply(this, arguments);
  //     this.textareaStyle.color = 'black';
  //     if (td.style.backgroundColor && td.style.backgroundColor.length > 0) {
  //       const brightness = chroma(td.style.backgroundColor).luminance();
  //       this.textareaStyle.color = brightness < 0.2 ? 'white' : 'black';
  //     }
  //   }
  // };
  // return {
  renderer(hotInstance, td, row, col, prop, value, cellProperties) {
    if (value) {
      if (value.image && value.image.length > 0) {
        td.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.width = this.outputWidth - 1;
        canvas.height = this.outputHeight - 1;
        canvas.classList.add('cell-type', 'canvas');
        const ctx = canvas.getContext('2d');
        this.drawFn(ctx, value.image);
        td.appendChild(canvas);
      }
    } else {
    }
  };
};
