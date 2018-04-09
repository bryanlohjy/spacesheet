import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);
    this.setInputRef = this.setInputRef.bind(this);
    this.state = {
      inputBarIsMounted: false,
    }
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
            // data={ this.props.data }
            rowHeaderWidth={32}
            colHeaderHeight={32}

            colHeaders={true}
            rowHeaders={true}
            preventOverflow="horizontal"
            rowHeights={this.props.outputHeight}
            colWidths={this.props.outputWidth}

            width={this.props.width}
            height={this.props.height - inputBarHeight}

            minCols={ Math.ceil(this.props.width / this.props.outputWidth) }
            minRows={ Math.ceil(this.props.height / this.props.outputHeight) }

            viewportColumnRenderingOffset={26}
            viewportRowRenderingOffset={26}

            outsideClickDeselects={false}
            persistentState
            undo

            // renderer={MatrixCellType.renderer}
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
