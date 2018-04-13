import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import { CellTypes } from './CellTypes.js';
import { GetCellType } from './CellHelpers.js';
import { Data, DataSchema } from './SpreadsheetData.js';
import { FormulaParser } from './FormulaParser.js';

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
      inputBarValue: "",
    };
    // this.data = [];
    // this.dataSchema = DataSchema(this.minCols);
    this.minCols = Math.ceil(this.props.width / this.props.outputWidth);
    this.minRows = Math.ceil(this.props.height / this.props.outputHeight);

  };
  componentDidMount() {
    this.CellTypes = new CellTypes({
      drawFn: this.props.drawFn,
      decodeFn: this.props.decodeFn,
      outputWidth: this.props.outputWidth,
      outputHeight: this.props.outputHeight,
      getCellFromDataPicker: this.props.getCellFromDataPicker,
      formulaParser: new FormulaParser(this.hotTable.hotInstance, {
        getCellFromDataPicker: this.props.getCellFromDataPicker
      }),
    });
    this.initHotTable();
  };
  initHotTable() {
    const hotInstance = this.hotTable.hotInstance;
    hotInstance.updateSettings({
      cells: (row, col, prop) => { // determine and set cell types based on value
        let cellProperties = {};
        const cellData = hotInstance.getDataAtRowProp(row, prop);
        // take in cell data and return celltype and values
        switch (GetCellType(cellData)) {
          case 'FORMULA':
            cellProperties.renderer = this.CellTypes.Formula.renderer;
            cellProperties.editor = this.CellTypes.Formula.editor;
            break;
          default:
            cellProperties.renderer = this.CellTypes.Text.renderer;
            cellProperties.editor = this.CellTypes.Text.editor;
        }
        return cellProperties;
      }
    });
  };
  setInputRef(el) {
    if (!this.inputBar) {
      this.inputBar = el;
      this.setState({ inputBarIsMounted : true });
    }
  };
  updateInputBarValue(value) {
    this.setState({ inputBarValue: value || ""});
  };
  setCellValue(value) {
    const selection = this.hotTable.hotInstance.getSelected();
    this.hotTable.hotInstance.setDataAtCell(selection[0], selection[1], value);
  };
  handleAfterSelection(rowFrom, colFrom, rowTo, colTo) {
    let currentSelection = [rowFrom, colFrom].toString();
    if (this.previousSelection !== currentSelection) { // only update if the value is different
      const cell = this.hotTable.hotInstance.getDataAtCell(rowFrom, colFrom);
      this.updateInputBarValue(cell);
      this.previousSelection = currentSelection;
    }
  }
  render() {
    const inputBarHeight = this.inputBar ? this.inputBar.offsetHeight : 21;
    return (
      <div className="spreadsheet-container">
        <InputBar
          setInputRef={ this.setInputRef }
          inputBarValue={ this.state.inputBarValue }
          updateInputBarValue={ this.updateInputBarValue }
          setCellValue={ this.setCellValue }
        />
        <div className="table-container" ref="tableContainer">
          <HotTable
            className="table"
            ref={ ref => {
              this.props.setTableRef(ref);
              this.hotTable = ref;
            }}
            root='hot'

            rowHeaderWidth={32}
            colHeaderHeight={32}

            colHeaders={true}
            rowHeaders={true}
            preventOverflow="horizontal"
            rowHeights={this.props.outputHeight}
            colWidths={this.props.outputWidth}

            width={ this.props.width }
            height={ this.props.height - inputBarHeight }

            minCols={ this.minCols }
            minRows={ this.minRows }

            viewportColumnRenderingOffset={26}
            viewportRowRenderingOffset={26}

            outsideClickDeselects={false}
            persistentState
            undo

            afterSelection={ this.handleAfterSelection }
          />
        </div>
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
        value={ this.props.inputBarValue }
      />
    )
  }
}
InputBar.propTypes = {
  setInputRef: PropTypes.func,
  setCellValue: PropTypes.func,
  inputBarValue: PropTypes.string,
  updateInputBarValue: PropTypes.func,
};
