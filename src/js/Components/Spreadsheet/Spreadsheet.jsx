import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import OperationDrawer from './OperationDrawer.jsx';

import { CellTypes } from './CellTypes.js';
import { getCellType, isFormula, cellCoordsToLabel } from './CellHelpers.js';

import { OperatorDemoSheet, BlankSheet } from './SpreadsheetData.js';
import { FormulaParser } from './FormulaParser.js';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);
    this.state = { // updated using refs to prevent unnecessary table rendering
      inputBarIsMounted: false,
      inputBarValue: "",
      currentSelection: [0, 0, 0, 0],
    };
    this.setSelectedCellData = this.setSelectedCellData.bind(this);
  };
  setSelectedCellData(operation, closeAfterSetting) {
    if (closeAfterSetting) {
      const selection = this.hotInstance.getSelected();
      const prevData = this.hotInstance.getDataAtCell(selection[0], selection[1]);
      if (prevData !== operation) {
        this.hotInstance.setDataAtCell(selection[0], selection[1], operation);
        this.props.setInputBarValue(operation);
      }
      return;
    }
    const editor = this.hotInstance.getActiveEditor();
    editor.beginEditing();
    editor.clearHighlightedReferences();
    editor.TEXTAREA.value = operation;
    editor.eventManager.fireEvent(editor.TEXTAREA, 'keydown');
    editor.updateTableCellCaptureClass();
  };
  render() {
    return (
      <div className="spreadsheet-container">
        <input className="input-bar" type="text"
          disabled
          value={this.props.inputBarValue}
          ref={ el => {
            if (!this.state.inputBarIsMounted) {
              this.setState({ inputBarIsMounted : true });
            }
          }}
        />
        <OperationDrawer
          setSelectedCellData={this.setSelectedCellData}
          currentSelection={this.state.currentSelection}
          hotInstance={this.hotInstance}
        />
        {
          this.state.inputBarIsMounted ? (
            <div className="table-container" ref="tableContainer">
              <HotTableContainer
                setTableRef={ ref => {
                  this.hotInstance = ref.hotInstance;
                  this.props.setTableRef(ref);
                }}
                width={this.props.width}
                height={this.props.height}
                setInputBarValue={this.props.setInputBarValue}
                getCellFromDataPicker={this.props.getCellFromDataPicker}
                model={this.props.model}
                afterSelection={ (r, c, r2, c2) => {
                  this.setState({
                    currentSelection: [r, c , r2, c2],
                  });
                }}
                afterRender={ this.props.afterRender }
                setFormulaParserRef={this.props.setFormulaParserRef}
              />
            </div>) : ''
        }
      </div>
    )
  }
}
Spreadsheet.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  getCellFromDataPicker: PropTypes.func,
  model: PropTypes.object.isRequired,
  inputBarValue: PropTypes.string,
  setTableRef: PropTypes.func,
  setFormulaParserRef: PropTypes.func,
  afterRender: PropTypes.func,
};

class HotTableContainer extends React.Component {
  constructor(props) {
    super(props);
    const cols = Math.ceil(this.props.width / this.props.model.outputWidth) + 1;
    const rows = Math.ceil(this.props.height / this.props.model.outputHeight) + 1;
    // this.demoSheet = this.props.model.constructor.name === 'FontModel' ? OperatorDemoSheet(rows, cols) : BlankSheet(rows, cols);
    this.demoSheet = BlankSheet(rows, cols);
    this.initHotTable = this.initHotTable.bind(this);
  };
  initHotTable() {
    const hotInstance = this.hotInstance;
    const formulaParser = new FormulaParser(this.hotInstance, {
      getCellFromDataPicker: this.props.getCellFromDataPicker,
      model: this.props.model,
    });
    this.props.setFormulaParserRef(formulaParser);
    const cellTypes = new CellTypes({
      drawFn: this.props.model.drawFn,
      decodeFn: this.props.model.decodeFn,
      outputWidth: this.props.model.outputWidth,
      outputHeight: this.props.model.outputHeight,
      formulaParser: formulaParser,
      setInputBarValue: this.props.setInputBarValue,
      asyncDecode: this.props.model.asyncDecode,
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
          case 'RANDVAR':
          cellProperties.renderer = cellTypes.RandVar.renderer;
          cellProperties.editor = cellTypes.RandVar.editor;
          break;
          default:
          cellProperties.renderer = cellTypes.Text.renderer;
          cellProperties.editor = cellTypes.Text.editor;
        }
        return cellProperties;
      },
      data: this.demoSheet ? this.demoSheet.data : null,
      contextMenu: {
        items: {
          "undo": {
            name: "Undo (Ctrl + Z)",
          },
          "redo": {
            name: "Redo (Ctrl + Y)",
          },
          "hsep1": "---------",
          "borders": {},
          "alignment": {},
          "hsep2": "---------",
          "mergeCells": {},
          "hsep3": "---------",
          "commentsAddEdit": {},
          "commentsRemove": {},
        }
      }
    });
    setTimeout(() => {
      hotInstance.selectCell(0, 0);
    }, 0);
  };
  shouldComponentUpdate(newProps, newState) {
    return false;
  };
  render() {
    const minCellSize = 64;
    return (
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

        mergeCells={  this.demoSheet ? this.demoSheet.mergeCells : null }

        rowHeaderWidth={32}
        colHeaderHeight={32}

        colHeaders={true}
        rowHeaders={true}
        preventOverflow="horizontal"
        rowHeights={Math.max(this.props.model.outputHeight, minCellSize)}
        colWidths={Math.max(this.props.model.outputWidth, minCellSize)}

        minCols={7}
        minRows={10}

        afterRender={ forced => {
          if (!this.props.afterRender) { return; }
          this.props.afterRender(forced);
        }}

        viewportColumnRenderingOffset={26}
        viewportRowRenderingOffset={26}

        outsideClickDeselects={false}

        afterUndo={ changes => {
          const selection = this.hotInstance.getSelected();
          const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
          this.props.setInputBarValue(data)
        }}
        afterRedo={ changes => {
          const selection = this.hotInstance.getSelected();
          const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
          this.props.setInputBarValue(data);
        }}
        afterSelection={ (r, c, r2, c2) => {
          this.props.afterSelection(r, c, r2, c2);
        }}

        comments={true}
        customBorders={true}

        undo
        redo
      />
    );
  }
}
HotTableContainer.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  getCellFromDataPicker: PropTypes.func,
  model: PropTypes.object.isRequired,
  inputBarValue: PropTypes.string,
  afterSelection: PropTypes.func,
  afterRender: PropTypes.func,
  setInputBarValue: PropTypes.func,
  setTableRef: PropTypes.func,
  setFormulaParserRef: PropTypes.func,
};
