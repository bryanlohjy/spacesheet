import HandsOnTable from 'handsontable';
import { cellLabelToCoords, cellCoordsToLabel, isFormula, getCellFromLabel } from './CellHelpers.js';
import { getAllRegexMatches, removeInstancesOfClassName } from '../../lib/helpers.js';
import Regex from '../../lib/Regex.js';
import { getArgumentsFromFunction } from './FormulaParser.js';

export default opts => {
  let CustomTextEditor =  HandsOnTable.editors.TextEditor.prototype.extend();

  CustomTextEditor.prototype.clearHighlightedReferences = function() {
    removeInstancesOfClassName('highlighted-reference');
  };
  CustomTextEditor.prototype.highlightReferences = function(hotInstance, data) {
    if (!data) {
      data = this.originalValue
    }

    if (!isFormula(data)) {
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
      const numRows = hotInstance.countRows();
      const numCols = hotInstance.countCols();
      for (let row = startRowIndex; row <= endRowIndex; row++) {
        for (let col = startColIndex; col <= endColIndex; col++) {
          if (row < numRows && col < numCols) {
            const reference = hotInstance.getCell(row, col);
            if (reference) {
              reference.classList.add('highlighted-reference');
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
          reference.classList.add('highlighted-reference');
        }
      }
    }
  };

  CustomTextEditor.prototype.prepare = function() {
    HandsOnTable.editors.TextEditor.prototype.prepare.apply(this, arguments);
    this.clearHighlightedReferences();
    this.highlightReferences(this.instance, this.originalValue);
    opts.setInputBarValue(this.originalValue || '');
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
      if (new RegExp(/[a-z]\d?$/gi).test(preCaret)) {
        return "BETWEEN";
      } else if (new RegExp(/[a-z]?\d+$/gi).test(preCaret)) {
        return "AFTER";
      }
    }
    return false;
  };

  CustomTextEditor.prototype.shouldCloseOff = function(str) {
    if (!str) {
      str = this.TEXTAREA.value;
    }

    if ((new RegExp(/^\s*=\s*average\s*\(/gi)).test(str) || (new RegExp(/^\s*=\s*sum\s*\(/gi)).test(str) || (new RegExp(/^\s*=\s*add\s*\(/gi)).test(str)) {
      return false;
    }

    if (str.trim()[str.trim().length - 1] !== ')') { // close of string if not
      const lastCommaIndex = str.lastIndexOf(',');
      const preLastComma = str.substring(0, lastCommaIndex);
      str = preLastComma + ')';
    }
    // check if operation should be closed off
    const args = getArgumentsFromFunction(str);
    if (args && args.length) {
      // if lerp, return true if it has 3 args
      const isLerpOperation = (new RegExp(/^\s*=\s*lerp\s*\(/gi)).test(str);
      // if mode, return true if it has 1 argument
      const isModOperation = (new RegExp(/^\s*=\s*mod\s*\(/gi)).test(str);
      if ((isLerpOperation && args.length >= 3) || (isModOperation && args.length == 1) || (!isLerpOperation && args.length >= 2)) {
        return str;
      }
    }
    return false;
  };

  CustomTextEditor.prototype.captureCellClick = function(e) { // reference cells by clicking in editing mode
    const capturePos = this.cellCapturePosition();
    if (capturePos) {
      const cellCoords = this.instance.getCoords(e.target);
      if (cellCoords.row < 0 || cellCoords.col < 0) { return; }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // split string on either side of caret
      const editorVal = this.TEXTAREA.value;
      let caretPosition = HandsOnTable.dom.getCaretPosition(this.TEXTAREA);
      let preCaret = editorVal.substring(0, caretPosition);
      let postCaret = editorVal.substring(caretPosition, editorVal.length);

      const cellLabel = cellCoordsToLabel(cellCoords);

      let newString;

      switch (capturePos) {
        case 'BEFORE':
          const replace = this.shouldCloseOff();
          if (replace) {
            postCaret = postCaret.trim();
            const referenceToReplace = (postCaret).match(new RegExp(/^[a-z]?\d+/gi))[0];
            postCaret = postCaret.substring(referenceToReplace.length, postCaret.length);
            newString = `${preCaret}${cellLabel}${postCaret}`;
          } else { // add to string
            newString = `${preCaret}${cellLabel}, ${postCaret}`;
            if (this.shouldCloseOff(newString)) {
              const endsWithBracket = postCaret.trim()[postCaret.trim().length - 1] === ")";
              newString = `${preCaret}${cellLabel}${postCaret}${!endsWithBracket ? ')' : ''}`;
              caretPosition = Number(caretPosition) + Number(cellLabel.length);
            } else {
              caretPosition = Number(caretPosition) + Number(cellLabel.length) + 2;
            }
          }
          break;
        case 'BETWEEN':
          preCaret = preCaret.replace(/[a-z]\d?$/gi, '');
          postCaret = postCaret.replace(/^[0-9]+/gi, '');
          newString = `${preCaret}${cellLabel}${postCaret}`;
          break;
        case 'AFTER':
          preCaret = preCaret.trim();
          const referenceToReplace = (preCaret).match(new RegExp(/[a-z]?\d+$/gi))[0];
          preCaret = preCaret.substring(0, preCaret.length - referenceToReplace.length);
          newString = `${preCaret}${cellLabel}, ${postCaret}`;
          caretPosition += 2;
      }

      // if not the average function, check if enough args are specified - close off if so
      if (!(new RegExp(/^\s*=\s*average\s*\(/gi)).test(newString)) {
        const shouldClose = this.shouldCloseOff(newString);
        if (shouldClose) {
          newString = shouldClose;
        }
      }
      opts.setInputBarValue(newString);
      this.TEXTAREA.value = newString;
      HandsOnTable.dom.setCaretPosition(this.TEXTAREA, caretPosition);

      this.clearHighlightedReferences();
      this.highlightReferences(this.instance, newString);
    }
  };

  CustomTextEditor.prototype.updateTableCellCaptureClass = function(override) {
    if (this.cellCapturePosition()) {
      this.instance.table.classList.add('capture-cells');
      this.TEXTAREA.classList.add('capture-cells');
    } else {
      this.instance.table.classList.remove('capture-cells');
      this.TEXTAREA.classList.remove('capture-cells');
    }
  };

  const onKeyDown = function(e) { // update input bar as cell is edited
    if (!e.key) { return; }
    if (e.key.trim().length === 1 || e.keyCode === 8 || e.keyCode === 46) {
      setTimeout(() => {
        opts.setInputBarValue(e.target.value);
        this.clearHighlightedReferences();
        this.highlightReferences(this.instance, e.target.value);
      }, 0);
    } else if (e.keyCode === 27) { // if escape, then set to originalValue
      setTimeout(() => {
        opts.setInputBarValue(this.originalValue);
      }, 0);
    }
  };
  const onKeyUp = function(e) {
    this.updateTableCellCaptureClass();
  };
  const onTextAreaClick = function() {
    this.updateTableCellCaptureClass();
  };
  const beforeOnCellMouseDown = function(e) {
    this.captureCellClick(e);
    this.updateTableCellCaptureClass();
  };

  CustomTextEditor.prototype.open = function() {
    this._fullEditMode = true;
    HandsOnTable.editors.TextEditor.prototype.open.apply(this, arguments);
    this.TEXTAREA.setAttribute('spellcheck', 'false');
    setTimeout(() => {
      opts.setInputBarValue(this.TEXTAREA.value || '');
    }, 0);
    this.highlightReferences(this.instance, this.originalValue);
    this.updateTableCellCaptureClass();

    // Add event listeners
    this.onKeyDown = onKeyDown.bind(this);
    this.eventManager.addEventListener(this.TEXTAREA, 'keydown',this.onKeyDown);

    this.onKeyUp = onKeyUp.bind(this);
    this.eventManager.addEventListener(this.TEXTAREA, 'keyup',this.onKeyUp);

    this.onTextAreaClick = onTextAreaClick.bind(this);
    this.eventManager.addEventListener(this.TEXTAREA, 'click',this.onTextAreaClick);

    this.beforeOnCellMouseDown = beforeOnCellMouseDown.bind(this);
    this.instance.addHook('beforeOnCellMouseDown', this.beforeOnCellMouseDown);
  };
  CustomTextEditor.prototype.close = function() {
    HandsOnTable.editors.TextEditor.prototype.close.apply(this, arguments);
    this.clearHighlightedReferences('highlighted-reference');

    this.instance.table.classList.remove('capture-cells');
    this.TEXTAREA.classList.remove('capture-cells');

    // Remove event listeners
    this.eventManager.removeEventListener(this.TEXTAREA, 'keydown', this.onKeyDown);
    delete this.onKeyDown;
    this.eventManager.removeEventListener(this.TEXTAREA, 'keyup', this.onKeyUp);
    delete this.onKeyUp;
    this.eventManager.removeEventListener(this.TEXTAREA, 'click', this.onTextAreaClick);
    delete this.onTextAreaClick;
    this.instance.removeHook('beforeOnCellMouseDown', this.beforeOnCellMouseDown);
    delete this.beforeOnCellMouseDown;
  }
  return CustomTextEditor;
};
