import HandsOnTable from 'handsontable';
// takes in params from component and spits out an object of spreadsheet CellTypes
const CellTypes = opts => {
  let CustomTextEditor = HandsOnTable.editors.TextEditor.prototype.extend();

  // Listen to updates from input bar, and update cell
  // opts.inputBar.addEventListener('update', e => {
  //   console.log("Input bar updated", e);
  // });

  const onKeyDown = function(e) { // update input bar as cell is edited
    console.log(e)
    if (e.key.trim().length === 1 || e.keyCode === 8 || e.keyCode === 46) {
      // const updateEvent = new CustomEvent("update", { "detail": "cell" });
      // e.target.dispatchEvent(updateEvent)
      setTimeout(() => {
        opts.updateInputBarValue(e.target.value);
      }, 0);
    } else if (e.keyCode === 27) { // if escape, then set to originalValue
      setTimeout(() => {
        opts.updateInputBarValue(this.originalValue);
      }, 0);
    }

    if (this.editingFromInputBar) {
      if (e.keyCode === 13) {
        console.log('submite')
      }
    }
  };

  const onCellUpdate = function(e) {
    console.log('Cell Update')
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
      opts.updateInputBarValue(this.TEXTAREA.value || '');
    }, 0);
    this.eventManager.addEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
    if (this.editingFromInputBar) {
      console.log("Editing from input bar, listen for changes in input bar");
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
  CustomTextEditor.prototype.focus = function() {
    if (this.editingFromInputBar) {
      return;
    }
    HandsOnTable.editors.TextEditor.prototype.focus.apply(this, arguments);
  };

  CustomTextEditor.prototype.close = function() {
    console.log('Editor: close');
    this.eventManager.removeEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
    if (this.editingFromInputBar) {
      console.log("Closing editor from input bar, remove listener");
      this.eventManager.removeEventListener(opts.inputBar, 'update', this.onInputBarUpdate);
      this.onInputBarUpdate = null;
    }
    HandsOnTable.editors.TextEditor.prototype.close.apply(this, arguments);
    // this.eventManager.removeEventListener(this.TEXTAREA, 'update', onCellUpdate.bind(this));
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
}

module.exports = { CellTypes };
