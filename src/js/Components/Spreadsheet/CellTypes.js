import HandsOnTable from 'handsontable';
import { countDecimalPlaces, randomInt, getAllRegexMatches } from '../../lib/helpers.js';
import { CellLabelToCoords } from './CellHelpers.js';
import Regex from '../../lib/Regex.js';
// takes in params from component and spits out an object of spreadsheet CellTypes
const CellTypes = opts => {
  let CustomTextEditor = HandsOnTable.editors.TextEditor.prototype.extend();

  const onKeyDown = function(e) { // update input bar as cell is edited
    if (e.key.trim().length === 1 || e.keyCode === 8 || e.keyCode === 46) {
      setTimeout(() => {
        opts.inputBar.value = e.target.value;
      }, 0);
    } else if (e.keyCode === 27) { // if escape, then set to originalValue
      setTimeout(() => {
        opts.inputBar.value = this.originalValue;
      }, 0);
    }
  };
  CustomTextEditor.prototype.prepare = function() {
    HandsOnTable.editors.TextEditor.prototype.prepare.apply(this, arguments);
    opts.inputBar.value = this.originalValue || '';
  };
  CustomTextEditor.prototype.open = function() {
    if (this.originalValue && this.originalValue.trim()[0] === '=') {
      const compiled = opts.formulaParser.parse(this.originalValue.replace('=', ''));
      if (!compiled.error) { // is a valid formula
        const matches = getAllRegexMatches(Regex.CELL_REFERENCE, this.originalValue)
        for (let matchCount = 0; matchCount < matches.length; matchCount++) {
          const match = matches[matchCount];
          const coords = CellLabelToCoords(match[0]);
          if (coords) {
            const ref = this.instance.getCell(coords.row, coords.col);
            console.log(ref, ref.classList)
            ref.classList.add('reference');
          }
        }
      }
    }

    HandsOnTable.editors.TextEditor.prototype.open.apply(this, arguments);
    setTimeout(() => {
      opts.inputBar.value = this.TEXTAREA.value || '';
    }, 0);
    this.eventManager.addEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
  };
  CustomTextEditor.prototype.close = function() {
    console.log('STOP HIGHLIGHTING')
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
          const { result, error } = compiled;
          if (result || result === 0) {
            if (typeof result === 'object') { // it is a vector
              const canvas = document.createElement('canvas');
              canvas.width = opts.outputWidth - 1;
              canvas.height = opts.outputHeight - 1;
              canvas.classList.add('canvas-container');

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
      const { result, error } = compiled;

      let prevSliderValue;
      const prevSlider = td.querySelector('input');

      if (result && typeof result !== 'string') {
        let min = result.min;
        let max = result.max;
        let step = result.step;

        let slider;
        let valueSpan;
        let sliderContainer;
        if (prevSlider) {
          slider = prevSlider;
          valueSpan = td.querySelector('span');
        } else {
          td.innerHTML = '';
          sliderContainer = document.createElement('div');
          sliderContainer.classList.add('slider-container');

          slider = document.createElement('input');
          slider.setAttribute('type', 'range');
          slider.setAttribute('tabindex', '-1');

          HandsOnTable.dom.addEvent(slider, 'input', function(e) {
            hotInstance.render();
          });
          HandsOnTable.dom.addEvent(sliderContainer, 'mousedown', function(e) {
            e.preventDefault();
          });
          HandsOnTable.dom.addEvent(slider, 'mousedown', function(e) {
            e.stopPropagation();
          });

          valueSpan = document.createElement('span');
        }

        if (min > max) {
          min = result.max;
          max = result.min;
          slider.classList.add('reversed');
        } else {
          slider.classList.remove('reversed');
        }

        slider.setAttribute('min', min);
        slider.setAttribute('max', max);
        slider.setAttribute('step', step);
        slider.setAttribute('title', slider.value || 0);

        const numDecimals = countDecimalPlaces(step);
        valueSpan.innerText = Number(slider.value).toFixed(numDecimals);

        if (!prevSlider) {
          sliderContainer.appendChild(valueSpan);
          sliderContainer.appendChild(slider);
          td.appendChild(sliderContainer);
          hotInstance.render()
        }
      } else {
        td.innerHTML = '';
        td.innerText = error || result;
      }
    },
    editor: CustomTextEditor,
  };

  const RandFont = {
    renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
      if (data && data.trim().length) {
        const randArgs = opts.formulaParser.getArgumentsFromFunction(data);
        if (randArgs.length === 0) { // if there are no arguments, create a random seed
          data = `=RANDFONT(${ randomInt(0, 99999) })`;
          hotInstance.setDataAtCell(row, col, data);
        }
        const compiled = opts.formulaParser.parse(data.replace('=', ''));
        let { result, error } = compiled;
        if (result) {
          let canvasElement = td.querySelector('canvas');
          if (!canvasElement) {
            td.innerHTML = '';

            const canvasContainer = document.createElement('div');
            canvasContainer.classList.add('canvas-container');

            canvasElement = document.createElement('canvas');
            canvasElement.width = opts.outputWidth - 1;
            canvasElement.height = opts.outputHeight - 1;

            const randomiseButton = document.createElement('div');
            randomiseButton.classList.add('randomise-button');

            const randomIcon = document.createElement('img');
            randomIcon.classList.add('random-icon');
            randomIcon.src = 'dist/assets/ic_autorenew_black_18px.svg';
            randomiseButton.appendChild(randomIcon);

            HandsOnTable.dom.addEvent(td, 'mousedown', function(e) {
              if (e.target === randomiseButton) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
              }
            });

            HandsOnTable.dom.addEvent(randomiseButton, 'click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              const newValue = `=RANDFONT(${ randomInt(0, 99999) })`;
              hotInstance.setDataAtCell(row, col, newValue);
            });

            canvasContainer.appendChild(randomiseButton);
            canvasContainer.appendChild(canvasElement);
            td.appendChild(canvasContainer);
          }
          const imageData = opts.decodeFn(result);
          const ctx = canvasElement.getContext('2d');
          opts.drawFn(ctx, imageData);
        } else {
          td.innerHTML = error;
        }
      }
    },
    editor: CustomTextEditor,
  };

  return {
    Formula,
    Text,
    Slider,
    RandFont,
  };
}

module.exports = { CellTypes };
