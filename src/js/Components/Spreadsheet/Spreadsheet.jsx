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

    this.state = {
      inputBarIsMounted: false,
    }
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
  render() {
    const inputBarHeight = this.inputBar ? this.inputBar.offsetHeight : 21;
    return (
      <div className="spreadsheet-container">
        <InputBar
          setInputRef={ this.setInputRef }
        />
        <div className="table-container" ref="tableContainer">
          <HotTable
            className="table"
            ref={ ref => {
              this.props.setTableRef(ref);
              this.hotTable = ref;
            }}
            root='hot'
            // data={ this.data }
            // columns={ column => {
            //   return { data: 'image' }
            // }}
            // dataSchema={ this.dataSchema }

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
            // validator={MatrixCellType.validator}
            // beforeChange={ this.handleBeforeChange }
            // afterSelection={ this.handleAfterSelection }
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

  // data: PropTypes.array,
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
        ref={ (el) => {
          this.props.setInputRef(el);
        }}
      />
    )
  }
}
InputBar.propTypes = {
  setInputRef: PropTypes.func,
};
