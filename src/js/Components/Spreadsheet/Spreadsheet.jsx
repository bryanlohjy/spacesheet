import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import Cell from './CellTypes.js';
import { Data, DataSchema } from './SpreadsheetData.js';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);
    this.setInputRef = this.setInputRef.bind(this);
    this.state = {
      inputBarIsMounted: false,
    }
    this.data = [];
    this.minCols = Math.ceil(this.props.width / this.props.outputWidth);
    this.minRows = Math.ceil(this.props.height / this.props.outputHeight);
    this.dataSchema = DataSchema(this.minCols);
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
            // ref={(ref) => {
            //   this.props.setTableRef(ref);
            //   this.table = ref;
            // }}
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

            renderer={ Cell.renderer }
            // editor={MatrixCellType.editor}
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
  // data: PropTypes.array,
  // setTableRef: PropTypes.func,
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
