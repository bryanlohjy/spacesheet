import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import { CellTypes, GetCellType } from './CellTypes.js';
import { Data, DataSchema } from './SpreadsheetData.js';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);

    this.setInputRef = this.setInputRef.bind(this);
    this.initHotTable = this.initHotTable.bind(this);

    this.state = {
      inputBarIsMounted: false,
    }
    this.data = [];
    this.minCols = Math.ceil(this.props.width / this.props.outputWidth);
    this.minRows = Math.ceil(this.props.height / this.props.outputHeight);
    this.dataSchema = DataSchema(this.minCols);
    this.CellTypes = new CellTypes({
      drawFn: this.props.drawFn,
      outputWidth: this.props.outputWidth,
      outputHeight: this.props.outputHeight,
    });
  };
  componentDidMount() {
    this.initHotTable();
    console.log(this.hotTable)
  };
  initHotTable() {
    const hotInstance = this.hotTable.hotInstance;
    hotInstance.updateSettings({
      cells: (row, col, prop) => { // determine and set cell types based on value
        let cellProperties = {};
        const cellData = hotInstance.getDataAtRowProp(row, prop);
        switch (GetCellType(cellData)) {
          case 'DATAPICKER':
            cellProperties.renderer = this.CellTypes.DataPicker.renderer;
            cellProperties.editor = this.CellTypes.DataPicker.editor;
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
            data={ this.data }
            // columns={ column => {
            //   return { data: 'image' }
            // }}
            dataSchema={ this.dataSchema }

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
  // data: PropTypes.array,
  setTableRef: PropTypes.func,
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
