import HandsOnTable from 'handsontable';
// takes in params from component and spits out an object of spreadsheet CellTypes
class CellTypes {
  constructor(opts) { // text cell, and formula cell
    this.drawFn = opts.drawFn;
    this.outputWidth = opts.outputWidth;
    this.outputHeight = opts.outputHeight;

    this.initDataPickerCellType = this.initDataPickerCellType.bind(this);
    this.initTextCellType = this.initTextCellType.bind(this);

    this.DataPicker = this.initDataPickerCellType();
    this.Text = this.initTextCellType();
    console.log(HandsOnTable.editors.TextEditor.prototype)
  };
  initDataPickerCellType() { // A non editable cell which renders references from the DataPicker
    return {
      renderer: (hotInstance, td, row, col, prop, value, cellProperties) => {
        td.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.width = this.outputWidth - 1;
        canvas.height = this.outputHeight - 1;
        canvas.classList.add('cell-type', 'canvas');
        const ctx = canvas.getContext('2d');
        this.drawFn(ctx, value.image);
        td.appendChild(canvas);
      },
      editor: false,
    };
  };
  initTextCellType() { // Editable cell which renders the cell valye
    return {
      renderer: 'text',
      editor: 'text',
    };
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
};

const GetCellType = cellData => {
  if (!cellData) { return; }

  const hasImage = cellData.image && cellData.image.length;
  const hasValue = cellData.value && cellData.value.length;

  if (hasImage && hasValue) {
    return 'DATAPICKER';
  } else {
    return 'TEXT';
  }
  // if there is a value, but no image - Text
  // if there is a value which starts with '=' - formula
}

module.exports = { CellTypes, GetCellType };
