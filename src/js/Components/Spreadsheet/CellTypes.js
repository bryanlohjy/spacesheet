export default (() => {
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
  return {
    renderer: (hotInstance, td, row, col, prop, value, cellProperties) => {
      // td.style.background = 'whitesmoke';
      td.innerHTML = value;
      if (value) {
        console.log(value, col, row)
      }
    },
    editor: () => {},
    validator: (value, callback) => {},
  }
})();
