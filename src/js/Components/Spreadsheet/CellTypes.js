import HandsOnTable from 'handsontable';
// takes in params from component and spits out an object of spreadsheet CellTypes
const CellTypes = opts => {
  let CustomTextEditor = HandsOnTable.editors.TextEditor.prototype.extend();

  const onKeyDown = function(e) { // update input bar as cell is edited
    if (e.key.trim().length === 1 || e.keyCode === 8 || e.keyCode === 46) {
      setTimeout(() => {
        opts.inputBar.value = e.target.value || '';
      }, 0);
    } else if (e.keyCode === 27) { // if escape, then set to originalValue
      setTimeout(() => {
        opts.inputBar.value = this.originalValue || '';
      }, 0);
    }
    if (this.editingFromInputBar && isSubmitKey(e)) {
      this.finishEditing(e.keyCode === 27);
      updateCellSelectionOnSubmit(this.instance, e);
    }
  };

  const onInputBarUpdate = function(e) { // update cell with input bar value
    console.log("Input bar is updated, render changes in cell")
    // dispatch a keyboard event to update the editor style
    let keyboardEvent = document.createEvent("KeyboardEvent");
    let initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
    keyboardEvent[initMethod](
      "keydown", // event type : keydown, keyup, keypress
      true,     // bubbles
      true,     // cancelable
      window,   // viewArg: should be window
      false,    // ctrlKeyArg
      false,    // altKeyArg
      false,    // shiftKeyArg
      false,    // metaKeyArg
      40,       // keyCodeArg : unsigned long the virtual key code, else 0
      0         // charCodeArgs : unsigned long the Unicode character associated with the depressed key, else 0
    );
    this.TEXTAREA.value = e.target.value;
    this.TEXTAREA.dispatchEvent(keyboardEvent);
  }

  CustomTextEditor.prototype.prepare = function() {
    HandsOnTable.editors.TextEditor.prototype.prepare.apply(this, arguments);
    opts.inputBar.value = this.originalValue || '';
  };

  CustomTextEditor.prototype.open = function() {
    console.log('Editor: open');
    setTimeout(() => {
      opts.inputBar.value = this.TEXTAREA.value || '';
    }, 0);
    this.onKeyDown = onKeyDown.bind(this);
    this.eventManager.addEventListener(this.TEXTAREA, 'keydown', this.onKeyDown);

    if (this.editingFromInputBar) {
      console.log("Listening for changes in input bar");
      this.onInputBarUpdate = onInputBarUpdate.bind(this);
      this.eventManager.addEventListener(opts.inputBar, 'update', this.onInputBarUpdate);
    }
    HandsOnTable.editors.TextEditor.prototype.open.apply(this, arguments);
  };
  CustomTextEditor.prototype.beginEditing = function(initialValue, event) {
    this.editingFromInputBar = false;
    if (event === "FROMINPUTBAR") { this.editingFromInputBar = true };
    HandsOnTable.editors.TextEditor.prototype.beginEditing.apply(this, arguments);
  };
  CustomTextEditor.prototype.finishEditing = function(initialValue, event) {
    // console.log('Finish editing')
    HandsOnTable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
  };
  CustomTextEditor.prototype.focus = function() {
    if (this.editingFromInputBar) {
      return;
    }
    HandsOnTable.editors.TextEditor.prototype.focus.apply(this, arguments);
  };
  CustomTextEditor.prototype.close = function() {
    console.log('Editor: close');
    this.eventManager.removeEventListener(this.TEXTAREA, 'keydown', this.onKeyDown);

    if (this.editingFromInputBar) {
      console.log("Closing editor from input bar, remove listener");
      this.eventManager.removeEventListener(opts.inputBar, 'update', this.onInputBarUpdate);
      this.onInputBarUpdate = null;
    }
    HandsOnTable.editors.TextEditor.prototype.close.apply(this, arguments);
  }

  // Formula ==============
  // A non editable cell which renders references from the Formula
  const Formula = {
    renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
      if (data && data.trim().length) {
        td.innerHTML = '';
        try {
          const compiled = opts.formulaParser.parse(data.replace('=', ''));
          const { result, error } = compiled;
          if (result) {
            if (typeof result === 'object') { // it is a vector
              const canvas = document.createElement('canvas');
              canvas.width = opts.outputWidth - 1;
              canvas.height = opts.outputHeight - 1;
              canvas.classList.add('cell-type', 'canvas');

              const ctx = canvas.getContext('2d');
              const imageData = opts.decodeFn(result);
              opts.drawFn(ctx, imageData);

              let image = result.image;
              td.appendChild(canvas);
            } else {
              td.innerText = result;
            }
          } else {
            td.innerText = error || "#ERROR!";
          }
        } catch (e) {
          console.error(`Could not calculate. Row: ${row}, Col: ${col}`);
        }
      }
    },
    editor: CustomTextEditor,
  };
  // Text ==============
  // Editable cell which renders the cell value
  const Text = {
    renderer: 'text',
    editor: CustomTextEditor,
  };
  return {
    Formula,
    Text,
  };
};

const isSubmitKey = e => {
  if (e.keyCode === 13 || e.keyCode === 33 || e.keyCode === 34 || e.keyCode === 9 || e.keyCode === 27) {
    return true;
  }
  return false;
};

const updateCellSelectionOnSubmit = (hotInstance, e) => {
  console.log('updateCellSelectionOnSubmit')
  const selection = hotInstance.getSelected();
  if (e.keyCode === 13) { // if enter, move to row below
    hotInstance.selectCell(selection[0] + 1, selection[1]);
  } else if (e.keyCode === 33) { // pageup, select top row
    this.hotInstance.selectCell(0, selection[1]);
  } else if (e.keyCode === 34) { // pagedown, select last row
    const numRows = hotInstance.countRows();
    hotInstance.selectCell(numRows - 1, selection[1]);
  } else if (e.keyCode === 9) { // if tab, move to col across
    hotInstance.selectCell(selection[0], selection[1] + 1);
  }
  return;
};

module.exports = { CellTypes, isSubmitKey, updateCellSelectionOnSubmit };
