import HandsOnTable from 'handsontable';
import { cellLabelToCoords, cellCoordsToLabel, isFormula, getCellFromLabel } from './CellHelpers.js';
import { getAllRegexMatches, removeInstancesOfClassName } from '../../lib/helpers.js';
import Regex from '../../lib/Regex.js';

export default opts => {
  let CustomTextEditor =  HandsOnTable.editors.TextEditor.prototype.extend();

  CustomTextEditor.prototype.clearHighlightedReferences = function() {
    removeInstancesOfClassName('highlighted-reference');
  };
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

  CustomTextEditor.prototype.cellCapturePosition = function() { // returns caret position relative to where the captured cell should be
    const editorData = this.TEXTAREA.value;
    if (editorData && isFormula(editorData)) {
      let caretPosition = HandsOnTable.dom.getCaretPosition(this.TEXTAREA);

      let preCaret = editorData.substring(0, caretPosition);
      let prevChar = preCaret.trim();
      prevChar = prevChar.charAt(prevChar.length - 1);
      if (new RegExp(/[\(=,:]/gi).test(prevChar)) {
        return "BEFORE";
      }
      let postCaret = editorData.substring(caretPosition, editorData.length);
      if (new RegExp(/[a-z]\d+$/gi).test(preCaret)) {
        return "AFTER";
      } else if (new RegExp(/[a-z]\d?$/gi).test(preCaret) && new RegExp(/^[0-9]?[^a-z]/gi).test(postCaret)) {
        return "BETWEEN";
      }

      return false;
    }
  };

  const beforeOnCellMouseDown = function(e) { // reference cells by clicking in editing mode
    const capturePos = this.cellCapturePosition();
    if (capturePos) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const editorVal = this.TEXTAREA.value;
      let caretPosition = HandsOnTable.dom.getCaretPosition(this.TEXTAREA);
      let preCaret = editorVal.substring(0, caretPosition);
      let postCaret = editorVal.substring(caretPosition, editorVal.length);

      const cellCoords = this.instance.getCoords(e.target);
      const cellLabel = cellCoordsToLabel(cellCoords);

      let newString;
      switch (capturePos) {
        case 'BEFORE':
          newString = `${preCaret}${cellLabel}${postCaret}`;
          caretPosition = Number(caretPosition) + Number(cellLabel.length);
          break;
        case 'AFTER':
          preCaret = preCaret.trim();
          const referenceToReplace = (preCaret).match(new RegExp(/[a-z]\d+$/gi))[0];
          preCaret = preCaret.substring(0, preCaret.length - referenceToReplace.length);
          newString = `${preCaret}${cellLabel}${postCaret}`;
          break;
        case 'BETWEEN':
          preCaret = preCaret.replace(/[a-z]\d?$/gi, '');
          postCaret = postCaret.replace(/^[0-9]+/gi, '');
          newString = `${preCaret}${cellLabel}${postCaret}`;
      }

      opts.inputBar.value = newString;
      this.TEXTAREA.value = newString;
      HandsOnTable.dom.setCaretPosition(this.TEXTAREA, caretPosition);

      this.clearHighlightedReferences();
      this.highlightReferences(this.instance, newString);
    }
  };

  CustomTextEditor.prototype.open = function() {
    this.highlightReferences(this.instance, this.originalValue);
    HandsOnTable.editors.TextEditor.prototype.open.apply(this, arguments);
    setTimeout(() => {
      opts.inputBar.value = this.TEXTAREA.value || '';
    }, 0);
    this.eventManager.addEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));

    this.beforeOnCellMouseDown = beforeOnCellMouseDown.bind(this);
    this.instance.addHook('beforeOnCellMouseDown', this.beforeOnCellMouseDown);
  };
  CustomTextEditor.prototype.close = function() {
    HandsOnTable.editors.TextEditor.prototype.close.apply(this, arguments);
    removeInstancesOfClassName('highlighted-reference');
    this.eventManager.removeEventListener(this.TEXTAREA, 'keydown', onKeyDown.bind(this));
    this.instance.removeHook('beforeOnCellMouseDown', this.beforeOnCellMouseDown);
    delete this.beforeOnCellMouseDown;
  }
  return CustomTextEditor;
};
