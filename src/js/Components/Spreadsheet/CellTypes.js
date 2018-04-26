import HandsOnTable from 'handsontable';
// takes in params from component and spits out an object of spreadsheet CellTypes
const CellTypes = opts => {
  let CustomTextEditor = HandsOnTable.editors.TextEditor.prototype.extend();

  const onKeyDown = function(e) { // update input bar as cell is edited
    if (e.key.trim().length === 1 || e.keyCode === 8 || e.keyCode === 46) {
      setTimeout(() => {
        opts.updateInputBarValue(e.target.value);
      }, 0);
    } else if (e.keyCode === 27) { // if escape, then set to originalValue
      setTimeout(() => {
        opts.updateInputBarValue(this.originalValue);
      }, 0);
    }
  };
  CustomTextEditor.prototype.prepare = function() {
    HandsOnTable.editors.TextEditor.prototype.prepare.apply(this, arguments);
    opts.updateInputBarValue(this.originalValue || '');
  };
  CustomTextEditor.prototype.open = function() {
    HandsOnTable.editors.TextEditor.prototype.open.apply(this, arguments);
    setTimeout(() => {
      opts.updateInputBarValue(this.TEXTAREA.value || '');
    }, 0);
    this.eventManager.addEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
  };
  CustomTextEditor.prototype.close = function() {
    HandsOnTable.editors.TextEditor.prototype.close.apply(this, arguments);
    this.eventManager.removeEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
  }
  // Formula ==============
  // A non editable cell which renders references from the Formula
  const Formula = {
    renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
      if (data && data.trim().length) {
        td.innerHTML = '';
        try {
          const compiled = opts.formulaParser.parse(data.replace('=', ''));
          console.log('COMPILED', compiled, data)
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

  const Slider = {
    renderer:  (hotInstance, td, row, col, prop, data, cellProperties) => {
      const compiled = opts.formulaParser.parse(data.replace('=', ''))
      console.log('SLIDER RENDERER', compiled)
      const { result, error } = compiled;
      td.innerHTML = '';
      if (result) {
        const { min, max, step } = result;
        const sliderContainer = document.createElement('div');
        sliderContainer.classList.add('slider-container');

        const slider = document.createElement('input');
        slider.setAttribute('type', 'range');
        slider.setAttribute('min', min);
        slider.setAttribute('max', max);
        slider.setAttribute('step', step || 0.1);
        // slider.setAttribute('title', sliderValue)
        // slider.setAttribute('value', sliderValue);
        sliderContainer.appendChild(slider);
        td.appendChild(sliderContainer);
        // HandsOnTable.dom.addEvent(sliderContainer, 'mousedown', function(e) {
        //   e.preventDefault();
        // });
        // HandsOnTable.dom.addEvent(slider, 'mousedown', function(e) {
        //   e.stopPropagation();
        // });
      } else {
        td.innerText = error;
      }
      // try {
      //   const compiled = opts.formulaParser.parse(data.replace('=', ''));
      //   if (result) {
      //     if (typeof result === 'object') { // it is a vector
      //       const canvas = document.createElement('canvas');
      //       canvas.width = opts.outputWidth - 1;
      //       canvas.height = opts.outputHeight - 1;
      //       canvas.classList.add('cell-type', 'canvas');
      //
      //       const ctx = canvas.getContext('2d');
      //       const imageData = opts.decodeFn(result);
      //       opts.drawFn(ctx, imageData);
      //
      //       let image = result.image;
      //       td.appendChild(canvas);
      //     } else {
      //       td.innerText = result;
      //     }
      //   } else {
      //     td.innerText = error || "#ERROR!";
      //   }
      // } catch (e) {
      //   console.error(`Could not calculate. Row: ${row}, Col: ${col}`);
      // }
      // td.innerText = 'Slider renderer';
    },
    editor: CustomTextEditor,
  };

  return {
    Formula,
    Text,
    Slider
  };
}

module.exports = { CellTypes };
