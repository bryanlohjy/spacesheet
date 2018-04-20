import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import { CellTypes, isSubmitKey, updateCellSelectionOnSubmit } from './CellTypes.js';
import { GetCellType } from './CellHelpers.js';
import { DemoSheet } from './SpreadsheetData.js';
import { FormulaParser } from './FormulaParser.js';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);

    this.initHotTable = this.initHotTable.bind(this);
    this.updateInputBarValue = this.updateInputBarValue.bind(this);

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
      inputBar: this.inputBar,
      drawFn: this.props.drawFn,
      decodeFn: this.props.decodeFn,
      outputWidth: this.props.outputWidth,
      outputHeight: this.props.outputHeight,
      getCellFromDataPicker: this.props.getCellFromDataPicker,
      formulaParser: new FormulaParser(this.hotInstance, {
        getCellFromDataPicker: this.props.getCellFromDataPicker
      }),
      updateInputBarValue: this.updateInputBarValue,
    });

    hotInstance.updateSettings({
      cells: (row, col, prop) => {
        let cellProperties = {};
        const cellData = hotInstance.getDataAtRowProp(row, prop);
        switch (GetCellType(cellData)) {
          case 'FORMULA':
            cellProperties.renderer = cellTypes.Formula.renderer;
            cellProperties.editor = cellTypes.Formula.editor;
            break;
          default:
            cellProperties.renderer = cellTypes.Text.renderer;
            cellProperties.editor = cellTypes.Text.editor;
        }
        return cellProperties;
      },
      data: this.demoSheet.data,
    });
    this.hotInstance.selectCell(0, 0, 0, 0);
  };
  updateInputBarValue(value, emitUpdate) {
    if (this.activeEditor) {
      this.activeEditor.TEXTAREA.value = value;
      if (emitUpdate) {
        const updateEvent = new CustomEvent("update", { "detail": "inputbar" });
        this.activeEditor.TEXTAREA.dispatchEvent(updateEvent);
      }
    }
  };
  render() {
    const inputBarHeight = 21;
    return (
      <div className="spreadsheet-container">
        <input className="input-bar" type="text"
          ref={ el => {
            console.log('remder')
            if (!this.inputBar) {
              this.inputBar = el;
              this.setState({ inputBarIsMounted : true });
            }
          }}
          onChange={ e => { // update active edit cell
            // console.log('!! ONCHANGE')

            const updateEvent = new CustomEvent("update", { "detail": "inputbar" });
            e.target.dispatchEvent(updateEvent);
          }}
          onKeyDown={ e => { // check for submits + aborts
            console.log('!! KEYDOWN', e.target.value)
            if (isSubmitKey(e) && this.activeEditor && this.activeEditor.isOpened()) { // enter: stop editing
              console.log('Submit input and, close and clear activeEditor');
              this.activeEditor.finishEditing(e.keyCode === 27); // sets cell to original value if escaped is pressed
              updateCellSelectionOnSubmit(this.hotInstance, e);
              this.activeEditor = null;
              this.inputBar.focus();
            } else {
              const activeEditor = this.hotInstance.getActiveEditor();
              if (!this.activeEditor || !activeEditor.isOpened()) { // if the cell is not being edited, set edit mode
                console.log('Cell was not in edit mode, set it to edit mode');
                this.activeEditor = activeEditor;
                this.activeEditor.beginEditing(null, "FROMINPUTBAR");
              }
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

                contextMenu
                // make sure input bar is in sync
                afterUndo={ e => {
                  const selection = this.hotInstance.getSelected();
                  if (selection) {
                    const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
                    if (this.inputBar.innerText !== data) {
                      this.updateInputBarValue(data);
                    }
                  }
                }}
                afterRedo={ e => {
                  const selection = this.hotInstance.getSelected();
                  if (selection) {
                    const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
                    if (this.inputBar.innerText !== data) {
                      this.updateInputBarValue(data);
                    }
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
};
