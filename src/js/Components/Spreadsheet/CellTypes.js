export default class CellType {
  constructor(outputWidth) {
    console.log('constr', outputWidth)
    this.outputWidth = outputWidth;
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
    console.log(this.outputWidth)
    if (value) {
      if (value.image && value.image.length > 0) {
        // const canvas =
        // td.innerHTML = this.outputWidth
        // td.appendChild()
      }
    } else {
      // td.innerHTML = this.outputWidth

      // console.log(value)
      // td.innerHTML = value;
    }
  };
  //   editor: () => {},
  //   validator: (value, callback) => {},
  // }
};
