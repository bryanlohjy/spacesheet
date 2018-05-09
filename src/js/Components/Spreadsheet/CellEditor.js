import HandsOnTable from 'handsontable';
import { cellLabelToCoords, isFormula, getCellFromLabel } from './CellHelpers.js';
import { getAllRegexMatches, removeInstancesOfClassName } from '../../lib/helpers.js';
import Regex from '../../lib/Regex.js';

export default opts => {
  let CustomTextEditor =  HandsOnTable.editors.TextEditor.prototype.extend();

  CustomTextEditor.prototype.inputBar = opts.inputBar;

  // CustomTextEditor.prototype.removeHighlightedClasses = function() {
  //   removeInstancesOfClassName('highlighted-reference');
  //   for (let i = 0; i < 5; i++) { // colour class
  //     removeInstancesOfClassName(`_${i.toString()}`);
  //   }
  // };
  CustomTextEditor.prototype.highlightReferences = function(hotInstance, data) {
    if (!data || !isFormula(data)) {
      return;
    }
    // deal with cell ranges first
    const rangeMatches = getAllRegexMatches(Regex.CELL_RANGE, data);
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
            if (row < hotInstance.countRows() && col < hotInstance.countCols()) {
              const reference = hotInstance.getCell(row, col);
              if (reference) {
                reference.classList.add('highlighted-reference', `_${ (rangeCount % 5) }`);
              }
            }
          }
        }
      }
    }
    // deal with single cell references
    const singleMatches = getAllRegexMatches(Regex.CELL_REFERENCE, data);
    for (let singleCount = 0; singleCount < singleMatches.length; singleCount++) {
      const match = singleMatches[singleCount];
      const coords = cellLabelToCoords(match[0]);
      if (coords.row < hotInstance.countRows() && coords.col < hotInstance.countCols()) {
        const reference = hotInstance.getCell(coords.row, coords.col);
        if (reference) {
          reference.classList.add('highlighted-reference', `_${ (singleCount % 5) }`);
        }
      }
    }
  };

  const onKeyDown = function(e) { // update input bar as cell is edited
    if (e.key.trim().length === 1 || e.keyCode === 8 || e.keyCode === 46) {
      setTimeout(() => {
        opts.inputBar.value = e.target.value;
        removeInstancesOfClassName('highlighted-reference');
        this.highlightReferences(this.instance, e.target.value);
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
    this.highlightReferences(this.instance, this.originalValue);

    HandsOnTable.editors.TextEditor.prototype.open.apply(this, arguments);
    setTimeout(() => {
      opts.inputBar.value = this.TEXTAREA.value || '';
    }, 0);
    this.eventManager.addEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
  };
  CustomTextEditor.prototype.close = function() {
    HandsOnTable.editors.TextEditor.prototype.close.apply(this, arguments);
    removeInstancesOfClassName('highlighted-reference');
    this.eventManager.removeEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
  }
  return CustomTextEditor;
};
