import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="spreadsheet-container">
        <div className="table-container" ref="tableContainer">
          <HotTable
            className="table"
            // ref={(ref) => {
            //   this.props.setTableRef(ref);
            //   this.table = ref;
            // }}
            root='hot'
            // data={ this.props.data }
            colHeaders={true}
            rowHeaders={true}
            preventOverflow="horizontal"
            rowHeights={64}
            colWidths={64}
            minCols={5}
            minRows={5}
            maxCols={5}
            maxRows={5}

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
  // data: PropTypes.array,
  // setTableRef: PropTypes.func,
  // beforeChange: PropTypes.func,
  // setCurrentColor: PropTypes.func,
};
