import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import { CellTypes } from './CellTypes.js';
import { getCellType, isFormula, cellCoordsToLabel } from './CellHelpers.js';
import { DemoSheet } from './SpreadsheetData.js';
import { FormulaParser } from './FormulaParser.js';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);
    this.initHotTable = this.initHotTable.bind(this);

    this.state = {
      inputBarIsMounted: false,
    };

    this.maxCols = Math.ceil(this.props.width / this.props.outputWidth);
    this.maxRows = Math.ceil(this.props.height / this.props.outputHeight);
    this.demoSheet = DemoSheet(this.maxRows, this.maxCols);
  };
  initHotTable() {
    const hotInstance = this.hotInstance;

    const cellTypes = new CellTypes({
      drawFn: this.props.drawFn,
      decodeFn: this.props.decodeFn,
      outputWidth: this.props.outputWidth,
      outputHeight: this.props.outputHeight,
      getCellFromDataPicker: this.props.getCellFromDataPicker,
      formulaParser: new FormulaParser(this.hotInstance, {
        getCellFromDataPicker: this.props.getCellFromDataPicker,
        model: this.props.model,
      }),
      inputBar: this.inputBar,
    });

    hotInstance.updateSettings({
      cells: (row, col, prop) => {
        let cellProperties = {};
        const cellData = hotInstance.getDataAtRowProp(row, prop);
        switch (getCellType(cellData)) {
          case 'FORMULA':
            cellProperties.renderer = cellTypes.Formula.renderer;
            cellProperties.editor = cellTypes.Formula.editor;
            break;
          case 'SLIDER':
            cellProperties.renderer = cellTypes.Slider.renderer;
            cellProperties.editor = cellTypes.Slider.editor;
            break;
          case 'RANDFONT':
            cellProperties.renderer = cellTypes.RandFont.renderer;
            cellProperties.editor = cellTypes.RandFont.editor;
            break;
          default:
            cellProperties.renderer = cellTypes.Text.renderer;
            cellProperties.editor = cellTypes.Text.editor;
        }
        return cellProperties;
      },
      data: this.demoSheet.data,
    });
    hotInstance.selectCell(0, 0);
  };
  render() {
    const inputBarHeight = 21;
    return (
      <div className="spreadsheet-container">
        <input className="input-bar" type="text"
          disabled
          ref={ el => {
            if (!this.state.inputBarIsMounted) {
              this.inputBar = el;
              this.setState({ inputBarIsMounted : true });
            }
          }}
          style={{
            height: inputBarHeight || 21,
          }}
        />
        {
          this.state.inputBarIsMounted ? (
            <div className="table-container" ref="tableContainer">
              <HotTable
                className="table"
                ref={ ref => {
                  this.props.setTableRef(ref);
                  this.hotInstance = ref.hotInstance;
                  this.initHotTable();
                }}
                root='hot'

                mergeCells={ this.demoSheet.mergeCells }

                rowHeaderWidth={32}
                colHeaderHeight={32}

                colHeaders={true}
                rowHeaders={true}
                preventOverflow="horizontal"
                rowHeights={this.props.outputHeight}
                colWidths={this.props.outputWidth}

                width={ this.props.width }
                height={ this.props.height - inputBarHeight }

                maxCols={ this.maxCols }
                maxRows={ this.maxRows }

                viewportColumnRenderingOffset={26}
                viewportRowRenderingOffset={26}

                outsideClickDeselects={false}

                beforeOnCellMouseDown={ e => {
                  const activeEditor = this.hotInstance.getActiveEditor();
                  if (activeEditor.isOpened()) { // reference cells by clicking in editing mode
                    const editorData = activeEditor.TEXTAREA.value;
                    if (editorData && isFormula(editorData)) {
                      let caretPosition = HandsOnTable.dom.getCaretPosition(activeEditor.TEXTAREA);
                      let preCaretString = editorData.substring(0, caretPosition);

                      let prevChar = preCaretString.trim();
                      prevChar = prevChar[prevChar.length - 1];
                      const populateWithReference = new RegExp(/[\(=,:]/gi).test(prevChar);

                      // replace ref if caret is after cell reference
                      const afterReference = new RegExp(/[a-z]\d+$/gi).test(preCaretString);

                      let postCaretString = editorData.substring(caretPosition, editorData.length);
                      const betweenReference = new RegExp(/[a-z]\d?$/gi).test(preCaretString) && new RegExp(/^[0-9]?[^a-z]/gi).test(postCaretString);
                      
                      if (populateWithReference || afterReference || betweenReference) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();

                        const cellCoords = this.hotInstance.getCoords(e.target);
                        const cellLabel = cellCoordsToLabel(cellCoords);

                        let newString;
                        if (populateWithReference) {
                          newString = `${preCaretString}${cellLabel}${postCaretString}`;
                          caretPosition = Number(caretPosition) + Number(cellLabel.length);
                        } else if (afterReference) {
                          preCaretString = preCaretString.trim();
                          const referenceToReplace = (preCaretString).match(new RegExp(/[a-z]\d+$/gi))[0];
                          preCaretString = preCaretString.substring(0, preCaretString.length - referenceToReplace.length);
                          newString = `${preCaretString}${cellLabel}${postCaretString}`;
                        } else {
                          preCaretString = preCaretString.replace(/[a-z]\d?$/gi, '');
                          postCaretString = postCaretString.replace(/^[0-9]+/gi, '');
                          newString = `${preCaretString}${cellLabel}${postCaretString}`;
                        }
                        activeEditor.TEXTAREA.value = newString;
                        if (activeEditor.highlightReferences && activeEditor.inputBar) {
                          activeEditor.clearHighlightedReferences();
                          activeEditor.highlightReferences(this.hotInstance, newString);
                          activeEditor.inputBar.value = newString;
                        }
                        HandsOnTable.dom.setCaretPosition(activeEditor.TEXTAREA, caretPosition);
                      }
                    }
                  }
                }}

                contextMenu
                // make sure input bar is in sync
                afterUndo={ changes => {
                  const selection = this.hotInstance.getSelected();
                  const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
                  if (this.inputBar.innerText !== data) {
                    this.inputBar.value = data;
                  }
                }}
                afterRedo={ changes => {
                  const selection = this.hotInstance.getSelected();
                  const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
                  if (this.inputBar.innerText !== data) {
                    this.inputBar.value = data;
                  }
                }}
                undo
                redo
              />
            </div>) : ''
        }
      </div>
    )
  }
}
Spreadsheet.propTypes = {
  outputWidth: PropTypes.number,
  outputHeight: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  drawFn: PropTypes.func,
  decodeFn: PropTypes.func,

  setTableRef: PropTypes.func,
  dataPickerCellData: PropTypes.object,
  getCellFromDataPicker: PropTypes.func,
  model: PropTypes.object,
  // beforeChange: PropTypes.func,
  // setCurrentColor: PropTypes.func,
};
