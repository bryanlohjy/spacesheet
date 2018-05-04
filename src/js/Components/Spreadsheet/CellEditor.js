import HandsOnTable from 'handsontable';
import { cellLabelToCoords, isFormula, getCellFromLabel } from './CellHelpers.js';
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
    if (this.originalValue && isFormula(this.originalValue)) {
      // deal with cell ranges first
      const rangeMatches = getAllRegexMatches(Regex.CELL_RANGE, this.originalValue);

      for (let rangeCount = 0; rangeCount < rangeMatches.length; rangeCount++) {
        const match = rangeMatches[rangeCount];
        const references = getAllRegexMatches(Regex.CELL_REFERENCE, match[0]);
        const from = cellLabelToCoords(references[0][0]);
        const to = cellLabelToCoords(references[1][0]);
        const startRowIndex = Math.min(from.row, to.row);
        const endRowIndex = Math.max(from.row, to.row);
        const startColIndex = Math.min(from.col, to.col);
        const endColIndex = Math.max(from.col, to.col);
        // highlight all cells within range, excluding the references themselves
        for (let row = startRowIndex; row <= endRowIndex; row++) {
          for (let col = startColIndex; col <= endColIndex; col++) {
            if (!(row == startRowIndex && col == startColIndex) && !(row == endRowIndex && col == endColIndex)) {
              const reference = this.instance.getCell(row, col);
              reference.classList.add('reference');
            }
          }
        }
      }
      // deal with single cell references
      const singleMatches = getAllRegexMatches(Regex.CELL_REFERENCE, this.originalValue);
      for (let singleCount = 0; singleCount < singleMatches.length; singleCount++) {
        const match = singleMatches[singleCount];
        const coords = cellLabelToCoords(match[0]);
        const reference = this.instance.getCell(coords.row, coords.col);
        reference.classList.add('reference');
      }
    }

    HandsOnTable.editors.TextEditor.prototype.open.apply(this, arguments);
    setTimeout(() => {
      opts.inputBar.value = this.TEXTAREA.value || '';
    }, 0);
    this.eventManager.addEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
  };
  CustomTextEditor.prototype.close = function() {
    HandsOnTable.editors.TextEditor.prototype.close.apply(this, arguments);
    this.eventManager.removeEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
  }
  return CustomTextEditor;
};
