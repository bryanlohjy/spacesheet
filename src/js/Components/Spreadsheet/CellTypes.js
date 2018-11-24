import HandsOnTable from 'handsontable';
import { countDecimalPlaces, randomInt, random } from '../../lib/helpers.js';
import CellEditor from './CellEditor';
import { getArgumentsFromFunction } from './FormulaParser.js';
import { cellCoordsToLabel } from './CellHelpers.js';
import { ModJoystick, randDist } from './ModJoystick.js';
// takes in params from component and spits out an object of spreadsheet CellTypes
const CellTypes = opts => {
  const CustomTextEditor = CellEditor(opts);
  // Formula ==============
  // A non editable cell which renders references from the Formula
  const cellWidth = Math.max(opts.outputWidth, opts.minCellSize || 0);
  const cellHeight = Math.max(opts.outputHeight, opts.minCellSize || 0);

  const Formula = {
    renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
      if (data && data.trim().length) {
        td.innerHTML = '';
        try {
          const cellLabel = cellCoordsToLabel({row, col});

          const compiled = opts.formulaParser.parse(data.replace('=', ''), cellLabel);

          const { result, error } = compiled;
          if (result || result === 0) {
            if (typeof result === 'object') { // it is a vector
              const canvasContainer = document.createElement('div');
              canvasContainer.classList.add('canvas-container');
              canvasContainer.style.width = `${cellWidth - 1}px`;
              canvasContainer.style.height = `${cellHeight - 1}px`;

              const canvas = document.createElement('canvas');
              canvas.width = opts.outputWidth - 1;
              canvas.height = opts.outputHeight - 1;

              canvasContainer.appendChild(canvas);
              td.appendChild(canvasContainer);

              const ctx = canvas.getContext('2d');
              const decodedVector = opts.decodeFn(result);
              opts.drawFn(ctx, decodedVector);
            } else {
              td.innerText = result;
            }
          } else {
            td.innerText = error || "#ERROR!";
          }
        } catch (e) {
          console.error(`Could not calculate. Row: ${row}, Col: ${col}`, e);
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
      const initialArgs = getArgumentsFromFunction(data);
      if (initialArgs.length === 0) { // if there are no arguments, use a smart default
        data = `=SLIDER(0, 1, 0.05)`;
        hotInstance.setDataAtCell(row, col, data);
      }

      const cellLabel = cellCoordsToLabel({row, col});

      const compiled = opts.formulaParser.parse(data.replace('=', ''), cellLabel);
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

          sliderContainer.style.width = `${cellWidth - 1}px`;
          sliderContainer.style.height = `${cellHeight - 1}px`;

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
          // set value to halfway by default
          slider.setAttribute('value', (min + max)/2);
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

  const RandVar = {
    renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
      if (data && data.trim().length) {
        const randArgs = getArgumentsFromFunction(data);
        if (randArgs.length === 0) { // if there are no arguments, create a random seed
          data = `=RANDVAR(${ randomInt(0, 99999) })`;
          hotInstance.setDataAtCell(row, col, data);
        }

        const cellLabel = cellCoordsToLabel({row, col});

        const compiled = opts.formulaParser.parse(data.replace('=', ''), cellLabel);

        let { result, error } = compiled;
        if (result) {
          let randomiseButton = td.querySelector('.randomise-button');
          let canvasElement = td.querySelector('canvas');
          if (!randomiseButton) {
            td.innerHTML = '';

            const canvasContainer = document.createElement('div');
            canvasContainer.classList.add('canvas-container');
            canvasContainer.style.width = `${cellWidth - 1}px`;
            canvasContainer.style.height = `${cellHeight - 1}px`;

            canvasElement = document.createElement('canvas');
            canvasElement.width = opts.outputWidth - 1;
            canvasElement.height = opts.outputHeight - 1;

            randomiseButton = document.createElement('div');
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
              const newValue = `=RANDVAR(${ randomInt(0, 99999) })`;
              opts.setInputBarValue(newValue);
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

  const Mod = {
    renderer: (hotInstance, td, row, col, prop, data, cellProperties) => {
      if (data && data.trim().length) {
        const args = getArgumentsFromFunction(data);

        const modSegmentCount = opts.modSegmentCount || 2;

        if (args.length < 3) { // if there are no arguments, create a random seed
          const segment = parseInt(random(1, modSegmentCount+1));
          data = `=MOD(${args[0]}, ${args[1] || segment}, ${args[2] || randDist()})`;
          hotInstance.setDataAtCell(row, col, data);
        }

        const cellLabel = cellCoordsToLabel({row, col});

        const compiled = opts.formulaParser.parse(data.replace('=', ''), cellLabel);
        let { result, error } = compiled;

        if (result && typeof result !== 'string') {
          let ctx;
          let canvas;

          const onJoystickChange = (() => {
            return (segment, dist) => {
              const args = getArgumentsFromFunction(data);
              const newFormula = `=MOD(${args[0]}, ${segment}, ${dist})`;
              opts.setInputBarValue(newFormula);
              const compiledScrub = opts.formulaParser.parse(newFormula.substring(1), cellLabel);

              if (compiledScrub.result) {
                const decodedScrub = opts.decodeFn(compiledScrub.result);
                opts.drawFn(ctx, decodedScrub);
              } else {
                td.innerHTML = compiledScrub.error;
              }
            }
          })();

          const onJoystickLeave = (() => {
            return (segment, dist) => { // reset
              const args = getArgumentsFromFunction(data);
              const newFormula = `=MOD(${args[0]}, ${segment}, ${dist})`;
              hotInstance.setDataAtCell(row, col, newFormula);
            }
          })();

          const onJoystickSet = (() => {
            return (segment, dist) => { // set data at cell
              const args = getArgumentsFromFunction(data);
              const newFormula = `=MOD(${args[0]}, ${segment}, ${dist})`;
              hotInstance.setDataAtCell(row, col, newFormula);
            }
          })();

          const hasModCanvas = td.querySelector('.mod-container');
          const args = getArgumentsFromFunction(data);

          if (!hasModCanvas) {
            td.innerHTML = '';
            const canvasContainer = document.createElement('div');
            canvasContainer.classList.add('canvas-container');
            canvasContainer.style.width = `${cellWidth - 1}px`;
            canvasContainer.style.height = `${cellHeight - 1}px`;

            canvas = document.createElement('canvas');
            canvas.width = opts.outputWidth - 1;
            canvas.height = opts.outputHeight - 1;

            ctx = canvas.getContext('2d');

            // set initial location of joystick if there are args
            const modJoystick = new ModJoystick({
              segment: Number(args[1]),
              dist: Number(args[2]),
              cellWidth,
              cellHeight,
              onChange: onJoystickChange,
              onLeave: onJoystickLeave,
              onSet: onJoystickSet,
              segments: modSegmentCount
            });

            canvasContainer.appendChild(canvas);
            canvasContainer.appendChild(modJoystick.element);

            td.appendChild(canvasContainer);

            td.modJoystick = modJoystick;
          } else {
            canvas = td.querySelector('canvas');
            ctx = canvas.getContext('2d');

            if (args[1] && Boolean(String(args[2]))) {
              td.modJoystick.updateElFromParams(args[1], args[2]);
            }

            td.modJoystick.onChange = onJoystickChange;
            td.modJoystick.onLeave = onJoystickLeave;
            td.modJoystick.onSet = onJoystickSet;
          }

          const decodedVector = opts.decodeFn(result);
          opts.drawFn(ctx, decodedVector);
        } else {
          td.innerHTML = '';
          td.innerText = error || result;
        }
      }
    },
    editor: CustomTextEditor,
  };


  return {
    Formula,
    Text,
    Slider,
    RandVar,
    Mod,
  };
}

module.exports = { CellTypes };
