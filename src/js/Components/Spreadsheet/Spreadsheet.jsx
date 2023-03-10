import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import OperationDrawer from './OperationDrawer.jsx';

import { CellTypes } from './CellTypes.js';
import { getCellType, isFormula, cellCoordsToLabel } from './CellHelpers.js';

import { FontDemoSheet, FaceDemoSheet, MNISTDemoSheet, Word2VecDemoSheet, ColourDemoSheet, BlankSheet } from './SpreadsheetData.js';
import { FormulaParser } from './FormulaParser.js';

const OptimisedHotTable = Component => {
  return class extends React.Component {
    constructor(props) {
      super(props);
    }

    shouldComponentUpdate() {
      return false;
    }

    render() {
      return <Component {...this.props} ref={this.props.onRef}/>;
    }
  }
}

const WrappedHotTable = OptimisedHotTable(HotTable);

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);
    this.state = { // updated using refs to prevent unnecessary table rendering
      inputBarAndOperationDrawerIsMounted: false,
      inputBarValue: "",
      currentSelection: [0, 0, 0, 0],
    };

    this.setSelectedCellData = this.setSelectedCellData.bind(this);
    this.initHotTable = this.initHotTable.bind(this);
    this.updateHotTableSettings = this.updateHotTableSettings.bind(this);
    this.updateHotTableData = this.updateHotTableData.bind(this);

    this.afterSelection = this.afterSelection.bind(this);
    this.afterRender = this.afterRender.bind(this);
    this.afterUndoRedo = this.afterUndoRedo.bind(this);

    this.minCellSize = props.currentModel === 'FACES' ? 82 : 64;
    this.minCols = 10;
    this.minRows = 10;

    this.modSegmentCount = 7;
  };

  componentWillReceiveProps(newProps) {
    const modelFirstLoaded = newProps.model && !this.props.model;

    if (modelFirstLoaded) {
      this.updateHotTableSettings(newProps.model);
    }
  }

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
  }

  initHotTable() { // initial settings, pre receiving model
    this.hotInstance.updateSettings({
      colHeaders: true,
      rowHeaders: true,
      rowHeaderWidth: 32,

      minCols: this.minCols,
      minRows: this.minRows,
      maxCols: 20, // make sure it doesn't get to 2 letters

      rowHeights: this.minCellSize,
      colWidths: this.minCellSize,

      undo: true,
      redo: true,
      outsideClickDeselects: false,
      viewportColumnRenderingOffset: 26,
      viewportRowRenderingOffset: 26,
    });

    setTimeout(() => {
      this.hotInstance.selectCell(0, 0);
    }, 0);
  }

  updateHotTableSettings(model) { // runs once when model is loaded
    const cellWidth = Math.max(this.minCellSize, model.outputWidth);
    const cellHeight = Math.max(this.minCellSize, model.outputHeight);

    const tableContainer = this.refs.tableContainer;

    let cols = Math.ceil(tableContainer.clientWidth / cellWidth) + 1;
    let rows = Math.ceil(tableContainer.clientHeight / cellHeight) + 1;

    cols = Math.max(this.minCols, cols);
    rows = Math.max(this.minRows, rows);

    const formulaParser = new FormulaParser(this.hotInstance, {
      getCellFromDataPicker: this.props.getCellFromDataPicker,
      model: model,
      modSegmentCount: this.modSegmentCount
    });

    this.props.setFormulaParserRef(formulaParser);

    const cellTypes = new CellTypes({
      drawFn: model.drawFn,
      decodeFn: model.decodeFn,
      outputWidth: model.outputWidth,
      outputHeight: model.outputHeight,
      formulaParser: formulaParser,
      setInputBarValue: this.props.setInputBarValue,
      minCellSize: this.minCellSize,
      modSegmentCount: this.modSegmentCount,
    });

    this.cellTypes = cellTypes;

    this.hotInstance.updateSettings({
      cells: (row, col, prop) => {
        let cellProperties = {};
        const cellData = this.hotInstance.getDataAtRowProp(row, prop);
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
          case 'MOD':
          cellProperties.renderer = cellTypes.Mod.renderer;
          cellProperties.editor = cellTypes.Mod.editor;
          break;
          default:
          cellProperties.renderer = cellTypes.Text.renderer;
          cellProperties.editor = cellTypes.Text.editor;
        }
        return cellProperties;
      },
      rowHeights: Math.max(model.outputHeight, this.minCellSize),
      colWidths: Math.max(model.outputWidth, this.minCellSize),
      comments: true,
      contextMenu: ['commentsAddEdit', 'commentsRemove', 'commentsReadOnly']
    });

    setTimeout(() => {
      this.hotInstance.selectCell(0, 0);
      this.updateHotTableData(rows, cols);
    }, 0);
  }

  updateHotTableData(rows, cols) {
    switch (this.props.currentModel) {
      case 'FONTS':
        this.defaultSheet = FontDemoSheet(rows, cols);
        break;
      case 'FACES':
        this.defaultSheet = FaceDemoSheet(rows, cols);
        break;
      case 'MNIST':
        this.defaultSheet = MNISTDemoSheet(rows, cols);
        break;
      case 'WORD2VEC':
        this.defaultSheet = Word2VecDemoSheet(rows, cols);
        break;
      case 'COLOURS':
        this.defaultSheet = ColourDemoSheet(rows, cols);
        break;
      default:
        this.defaultSheet = BlankSheet(rows, cols);
    }

    this.hotInstance.updateSettings({
      data: this.defaultSheet ? this.defaultSheet.data : null,
      cell: this.defaultSheet ? this.defaultSheet.comments : [],
    });
  }

  afterSelection(r, c, r2, c2) {
    this.setState({
      currentSelection: [r, c , r2, c2],
    });
  }

  afterRender(forced) {
    if (!this.props.afterRender) { return; }
    this.props.afterRender(forced);
  };

  afterUndoRedo(changes) {
    const selection = this.hotInstance.getSelected();
    const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
    this.props.setInputBarValue(data);
  };

  render() {
    return (
      <div className="spreadsheet-container">
        <div
          ref={ el => {
            if (!this.state.inputBarIsMounted && !this.inputBarAndOperationDrawerEl) {
              this.setState({ inputBarAndOperationDrawerIsMounted: true });
              this.inputBarAndOperationDrawerEl = el;
            }
          }}
        >
          <input className="input-bar" type="text"
            disabled
            value={this.props.inputBarValue}
          />
          <OperationDrawer
            setSelectedCellData={this.setSelectedCellData}
            currentSelection={this.state.currentSelection}
            hotInstance={this.hotInstance}
            cellTypes={this.cellTypes}
            modSegmentCount={this.modSegmentCount}
            setInputBarValue={this.props.setInputBarValue}
          />
        </div>
        {
          this.state.inputBarAndOperationDrawerIsMounted &&
          <div className="table-container" ref="tableContainer">
            <WrappedHotTable
              className="table"
              onRef={ ref => {
                if (ref && !this.hotInstance) {
                  this.props.setTableRef(ref);
                  this.hotInstance = ref.hotInstance;
                  // Wait for actual heights of elements
                  setTimeout(this.initHotTable, 0);
                }
              }}

              root='hot'

              afterRender={this.afterRender}
              afterUndo={this.afterUndoRedo}
              afterRedo={this.afterUndoRedo}
              afterSelection={this.afterSelection}

              // merge cells needs to be present in render method
              mergeCells={this.defaultSheet && this.defaultSheet.mergeCells}
            />
          </div>
        }
      </div>
    )
  }
}

Spreadsheet.propTypes = {
  getCellFromDataPicker: PropTypes.func,
  model: PropTypes.object,
  inputBarValue: PropTypes.string,
  setTableRef: PropTypes.func,
  setFormulaParserRef: PropTypes.func,
  afterRender: PropTypes.func,
  currentModel: PropTypes.string,
  setInputBarValue: PropTypes.func,
};
