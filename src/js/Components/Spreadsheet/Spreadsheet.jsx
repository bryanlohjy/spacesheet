import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import { InputBar, FakeCell } from './Inputs.jsx';

import { CellTypes } from './CellTypes.js';
import { GetCellType } from './CellHelpers.js';
import { DemoSheet } from './SpreadsheetData.js';
import { FormulaParser } from './FormulaParser.js';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);
    this.initHotTable = this.initHotTable.bind(this);
    this.setInputValue = this.setInputValue.bind(this);
    this.handleAfterSelection = this.handleAfterSelection.bind(this);
    this.setFakeCellValue = this.setFakeCellValue.bind(this);
    this.openFakeCell = this.openFakeCell.bind(this);
    this.closeFakeCell = this.closeFakeCell.bind(this);

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
      setInputValue: this.setInputValue,
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
  setInputValue(value) {
    this.inputBar.value = value;
  };
  handleAfterSelection(rowFrom, colFrom, rowTo, colTo) {
    let currentSelection = [rowFrom, colFrom].toString();
    if (this.previousSelection !== currentSelection) { // only update if the value is different
      const cell = this.hotInstance.getDataAtCell(rowFrom, colFrom);
      this.setInputValue(cell);
      this.previousSelection = currentSelection;
    }
  };
  setFakeCellValue(value) {
    this.fakeCell.innerText = value;
  };
  openFakeCell() {
    const selection = this.hotInstance.getSelected();
    if (selection) {
      let fakeCell = this.fakeCell;
      const cellStyle = this.hotInstance.getCell(selection[0], selection[1]).getBoundingClientRect();
      const cellData = this.hotInstance.getDataAtCell(selection[0], selection[1]);
      this.setFakeCellValue(cellData || "");
      // show and style fake input
      fakeCell.classList.remove('hidden');
      fakeCell.style.minWidth = `${cellStyle.width}px`;
      fakeCell.style.height = `${cellStyle.height}px`;
      fakeCell.style.left = `${cellStyle.left - 1}px`;
      fakeCell.style.top = `${cellStyle.top - 1}px`;

      const corners = document.querySelectorAll('.current.corner');
      for (var i = 0; i < corners.length; i++) {
        corners[i].style.visibility = 'hidden';
      }
      this.inputBar.focus();
    }
  };
  closeFakeCell(e) {
    const selection = this.hotInstance.getSelected();
    let fakeCell = this.fakeCell;
    if (selection && fakeCell && fakeCell.className.indexOf('hidden') < 0) {
      if (e.keyCode === 13 || e.keyCode === 9) { // if enter or tab, set data, else abort
        this.hotInstance.setDataAtCell(selection[0], selection[1], this.fakeCell.innerText || "");
        if (e.keyCode === 13) { // if enter, move to row below
          this.hotInstance.selectCell(selection[0] + 1, selection[1]);
        } else { // if enter, move to col across
          this.hotInstance.selectCell(selection[0], selection[1] + 1);
        }
      }

      this.setFakeCellValue("");
      this.inputBar.blur();
      fakeCell.classList.add('hidden');
      const corners = document.querySelectorAll('.current.corner');
      for (var i = 0; i < corners.length; i++) {
        corners[i].style.visibility = 'visible';
      }
    }
  };
  render() {
    const inputBarHeight = 21;
    return (
      <div className="spreadsheet-container">
        <InputBar
          setInputRef={ el => {
            if (!this.inputBar) {
              this.inputBar = el;
              this.setState({ inputBarIsMounted : true });
            }
          }}
          setFakeCellValue={ this.setFakeCellValue }
          openFakeCell={ this.openFakeCell }
          closeFakeCell={ this.closeFakeCell }
        />
        <FakeCell
          setFakeCellRef={ el => {
            this.fakeCell = el;
          }}
          setInputValue={ this.setInputValue }
          openFakeCell={ this.openFakeCell }
          closeFakeCell={ this.closeFakeCell }
        />

        <div className="table-container" ref="tableContainer">
          <HotTable
            className="table"
            ref={ ref => {
              if (ref && !this.hotInstance) {
                this.props.setTableRef(ref);
                this.hotInstance = ref.hotInstance;
                this.initHotTable();
              }
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

            undo
            redo
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

  setTableRef: PropTypes.func,
  dataPickerCellData: PropTypes.object,
  getCellFromDataPicker: PropTypes.func,
};
