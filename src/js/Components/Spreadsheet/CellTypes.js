import HandsOnTable from 'handsontable';
// takes in params from component and spits out an object of spreadsheet CellTypes
const CellTypes = opts => {

  // DataPicker ==============
  // A non editable cell which renders references from the DataPicker
  const Formula = {
    renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
      td.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.width = opts.outputWidth - 1;
      canvas.height = opts.outputHeight - 1;
      canvas.classList.add('cell-type', 'canvas');
      const ctx = canvas.getContext('2d');

      if (data) {
        const dataKey = data.match(/\(([^)]+)\)/)[1];
        let dataPickerCell;
        try {
          dataPickerCell = opts.getCellFromDataPicker(dataKey);
          opts.drawFn(ctx, dataPickerCell.image);
        } catch (e) {
          console.error(`Cell ${dataKey} hasn't been loaded.`)
        }
        td.appendChild(canvas);
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
