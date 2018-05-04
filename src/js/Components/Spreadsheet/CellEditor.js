import HandsOnTable from 'handsontable';
import { CellLabelToCoords } from './CellHelpers.js';
import { getAllRegexMatches } from '../../lib/helpers.js';
import Regex from '../../lib/Regex.js';

export default opts => {
  let CustomTextEditor =  HandsOnTable.editors.TextEditor.prototype.extend();
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
  return CustomTextEditor;
};
