import HandsOnTable from 'handsontable';
// takes in params from component and spits out an object of spreadsheet CellTypes
const CellTypes = opts => {

  // Formula ==============
  // A non editable cell which renders references from the Formula
  const Formula = {
    renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
      if (data && data.trim().length) {
        td.innerHTML = '';
        try {
          const compiled = opts.formulaParser.parse(data.replace('=', ''));
          const { result } = compiled;
          if (result) {
            if (typeof result === 'object') { // it is a vector or image
              const canvas = document.createElement('canvas');
              canvas.width = opts.outputWidth - 1;
              canvas.height = opts.outputHeight - 1;
              canvas.classList.add('cell-type', 'canvas');
              const ctx = canvas.getContext('2d');

              let image = result.image;
              if (image) {
                const imageData = opts.decodeFn(result.vector);
                // console.log(this.deoced)
                opts.drawFn(ctx, imageData);
              } else {
                console.warn(`No image for Row: ${row}, Col: ${col}. Decode vector`)
              }
              td.appendChild(canvas);
            } else {
              td.innerText = result;
            }
          } else {
            td.innerText = compiled.error;
          }
        } catch (e) {
          console.error(`Could not calculate. Row: ${row}, Col: ${col}`);
        }
      }
    },
    editor: 'text',
  };

  // Text ==============
  // Editable cell which renders the cell value
  let CustomTextEditor = HandsOnTable.editors.TextEditor.prototype.extend();
  CustomTextEditor.prototype.prepare = function() { // runs when a cell is clicked
    // store display data to manage in object
    this.data = this.originalValue;
    HandsOnTable.editors.TextEditor.prototype.prepare.apply(this, arguments);
  };
  CustomTextEditor.prototype.open = function() {
    HandsOnTable.editors.TextEditor.prototype.open.apply(this, arguments);
    console.log(this.data)
    this.TEXTAREA.value = this.data.value;
  };
  // CustomTextEditor.prototype.setValue = function(val) {
  //   HandsOnTable.editors.TextEditor.prototype.setValue.apply(this, arguments);
  //
  //   console.log('setval', this, val)
  // }

  const Text = {
    renderer: 'text',
    // renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
    //   td.innerHTML = Object.keys(data).value || '';
    // },
    editor: 'text' || CustomTextEditor,
  };
  return {
    Formula,
    Text,
  };
}

module.exports = { CellTypes };
