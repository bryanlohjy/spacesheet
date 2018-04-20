import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import { CellTypes } from './CellTypes.js';
import { DemoSheet } from './SpreadsheetData.js';
import { FormulaParser } from './FormulaParser.js';
import { highlightReferencesInString, clearHighlightedReferences, GetCellType } from './SpreadsheetHelpers.js';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);

    this.setInputRef = this.setInputRef.bind(this);
    this.initHotTable = this.initHotTable.bind(this);
    this.updateInputBarValue = this.updateInputBarValue.bind(this);
    this.setCellValue = this.setCellValue.bind(this);
    this.handleAfterSelection = this.handleAfterSelection.bind(this);

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
  };
  setInputRef(el) {
    if (!this.inputBar) {
      this.inputBar = el;
      this.setState({ inputBarIsMounted : true });
    }
  };
  updateInputBarValue(value) {
    this.inputBar.value = value;
  };
  setCellValue(value) {
    const selection = this.hotInstance.getSelected();
    this.hotInstance.setDataAtCell(selection[0], selection[1], value);
  };
  handleAfterSelection(rowFrom, colFrom, rowTo, colTo) {
    // clear previously styled references
    const cellData = this.hotInstance.getDataAtCell(rowFrom, colFrom);
    clearHighlightedReferences();
    this.props.clearDataPickerReferences();
    if (cellData && cellData.trim()[0] === '=') { // if it is a formula
      highlightReferencesInString(this.hotInstance, this.props.highlightDataPickerReferences, cellData);
    }
  };
  render() {
    const inputBarHeight = 21;
    return (
      <div className="spreadsheet-container">
        <InputBar
          setInputRef={ this.setInputRef }
          updateInputBarValue={ this.updateInputBarValue }
          setCellValue={ this.setCellValue }
          height={ inputBarHeight }
        />
        {
          this.state.inputBarIsMounted ? (
            <div className="table-container" ref="tableContainer">
              <HotTable
                className="table"
                ref={ ref => {
                  this.props.setTableRef(ref);
                  this.hot = ref;
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
                afterSelection={ this.handleAfterSelection }
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
  highlightDataPickerReferences: PropTypes.func,
  clearDataPickerReferences: PropTypes.func,
  // beforeChange: PropTypes.func,
  // setCurrentColor: PropTypes.func,
};

class InputBar extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <input className="input-bar" type="text"
        ref={ el => {
          this.props.setInputRef(el);
        }}
        onChange={ e => {
          this.props.updateInputBarValue(e.target.value);
        }}
        onKeyDown={ e => {
          if (e.keyCode === 13) {
            this.props.setCellValue(e.target.value);
          }
        }}
        style={{
          height: this.props.height || 21,
        }}
      />
    )
  }
}
InputBar.propTypes = {
  setInputRef: PropTypes.func,
  setCellValue: PropTypes.func,
  updateInputBarValue: PropTypes.func,
  height: PropTypes.number,
};
