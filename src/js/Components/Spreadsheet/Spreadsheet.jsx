import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import { CellTypes } from './CellTypes.js';
import { getCellType, isFormula, cellCoordsToLabel } from './CellHelpers.js';
import { randomInt } from '../../lib/helpers.js';

import { DemoSheet } from './SpreadsheetData.js';
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
                outputWidth={this.props.outputWidth}
                outputHeight={this.props.outputHeight}
                setTableRef={ ref => {
                  this.hotInstance = ref.hotInstance;
                  this.props.setTableRef(ref);
                }}
                width={this.props.width}
                height={this.props.height}
                setInputBarValue={this.props.setInputBarValue}
                getCellFromDataPicker={this.props.getCellFromDataPicker}
                model={this.props.model}
                drawFn={this.props.drawFn}
                decodeFn={this.props.decodeFn}
                afterSelection={ (r, c, r2, c2) => {
                  this.setState({
                    currentSelection: [r, c , r2, c2],
                  });
                }}
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
  outputWidth: PropTypes.number,
  outputHeight: PropTypes.number,
  drawFn: PropTypes.func,
  decodeFn: PropTypes.func,
  getCellFromDataPicker: PropTypes.func,
  model: PropTypes.object,
  inputBarValue: PropTypes.string,
  setTableRef: PropTypes.func,
};

class HotTableContainer extends React.Component {
  constructor(props) {
    super(props);
    this.maxCols = Math.ceil(this.props.width / this.props.outputWidth);
    this.maxRows = Math.ceil(this.props.height / this.props.outputHeight);
    this.demoSheet = DemoSheet(this.maxRows, this.maxCols);
    this.initHotTable = this.initHotTable.bind(this);
  };
  initHotTable() {
    const hotInstance = this.hotInstance;
    const cellTypes = new CellTypes({
      drawFn: this.props.drawFn,
      decodeFn: this.props.decodeFn,
      outputWidth: this.props.outputWidth,
      outputHeight: this.props.outputHeight,
      formulaParser: new FormulaParser(this.hotInstance, {
        getCellFromDataPicker: this.props.getCellFromDataPicker,
        model: this.props.model,
      }),
      setInputBarValue: this.props.setInputBarValue,
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
          case 'RANDFONT':
          cellProperties.renderer = cellTypes.RandFont.renderer;
          cellProperties.editor = cellTypes.RandFont.editor;
          break;
          default:
          cellProperties.renderer = cellTypes.Text.renderer;
          cellProperties.editor = cellTypes.Text.editor;
        }
        return cellProperties;
      },
      data: this.demoSheet.data,
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
    hotInstance.selectCell(0, 0);
  };
  shouldComponentUpdate(newProps, newState) {
    return false;
  };
  render() {
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

        mergeCells={ this.demoSheet.mergeCells }

        rowHeaderWidth={32}
        colHeaderHeight={32}

        colHeaders={true}
        rowHeaders={true}
        preventOverflow="horizontal"
        rowHeights={this.props.outputHeight}
        colWidths={this.props.outputWidth}

        maxCols={ this.maxCols }
        maxRows={ this.maxRows }

        // afterRender={ e => { console.warn('HotTable Render')}}

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
  outputWidth: PropTypes.number,
  outputHeight: PropTypes.number,
  drawFn: PropTypes.func,
  decodeFn: PropTypes.func,
  getCellFromDataPicker: PropTypes.func,
  model: PropTypes.object,
  inputBarValue: PropTypes.string,
  afterSelection: PropTypes.func,
  setInputBarValue: PropTypes.func,
  setTableRef: PropTypes.func,
};

class OperationDrawer extends React.Component {
  constructor(props) {
    super(props);
    const getValidMatrix = arr => {
      if (!arr) { return; }
      return arr.map(row => {
        return row.map(val => {
          return val.trim().length > 0;
        });
      });
    };
    const arraysAreSimilar = (arr1, arr2) => {
      return JSON.stringify(arr1, null, 0) === JSON.stringify(arr2, null, 0);
    };

    this.operations = [
      {
        name: 'AVERAGE',
        populateString: '=AVERAGE(',
        shouldHighlight: () => {
          return false;
        },
        highlightedFunction: () => {
        },
      },
      {
        name: 'LERP',
        populateString: '=LERP(',
        shouldHighlight: () => {
          const selection = this.props.currentSelection;
          const selectedCells = this.props.hotInstance.getData.apply(this, selection);
          const validMatrix = getValidMatrix(selectedCells)

          if (validMatrix && validMatrix.length > 0) {
            const rows = validMatrix.length;
            const cols = validMatrix[0].length;

            const verticalStrip = rows > 1 && cols === 1;
            const horizontalStrip = cols > 1 && rows === 1;

            if (horizontalStrip) {
              const hasValuesAtEnds = validMatrix[0][0] && validMatrix[0][cols - 1];
              let hasNoValuesInBetween = true;
              for (let col = 1; col < cols - 1; col++) {
                if (validMatrix[0][col]) {
                  hasNoValuesInBetween = false;
                  break;
                }
              }
              if (hasValuesAtEnds && hasNoValuesInBetween && cols > 2) {
                return true;
              }
            }
          }
          return false;
        },
        highlightedFunction: () => {
          // fill cells in between start and end
          // with incremented lerp
          const selection = this.props.currentSelection;
          const selectedCells = this.props.hotInstance.getData.apply(this, selection);

          const rows = selectedCells.length;
          const cols = selectedCells[0].length;

          const startLabel = cellCoordsToLabel({ row: selection[0], col: selection[1] });
          const endLabel = cellCoordsToLabel({ row: selection[2], col: selection[3] });

          const verticalStrip = rows > 1 && cols === 1;
          const horizontalStrip = cols > 1 && rows === 1;

          const vals = selectedCells.map((row, rowIndex) => {
            return row.map((col, colIndex) => {
              const isStartCell = rowIndex === 0 && colIndex === 0;
              const isEndCell = rowIndex === rows - 1 && colIndex === cols - 1;
              if (!isStartCell && !isEndCell) {
                let lerpBy = Number((1 / (cols - 1)) * colIndex).toFixed(2);
                return `=LERP(${startLabel}, ${endLabel}, ${lerpBy})`;
              }
              return col;
            });
          });
          if (!arraysAreSimilar(selectedCells, vals)) {
            this.props.hotInstance.populateFromArray(selection[0], selection[1], vals, selection[2], selection[3]);
          }
        },
      },
      {
        name: 'MINUS',
        populateString: '=MINUS(',
        shouldHighlight: () => {
          return false;
        },
        highlightedFunction: () => {
        },
      },
      {
        name: 'SUM',
        populateString: '=SUM(',
        shouldHighlight: () => {
          return false;
        },
        highlightedFunction: () => {
        },
      },
      {
        name: 'SLIDER',
        populateString: '=SLIDER(0, 1, 0.05)',
        shouldHighlight: () => {
          return false;
        },
        highlightedFunction: () => {
        },
      },
      {
        name: 'RANDFONT',
        populateString: `=RANDFONT()`,
        shouldHighlight: () => {
          return false;
        },
        highlightedFunction: () => {
        },
      },
      {
        name: 'DIST',
        populateString: '=DIST(',
        shouldHighlight: () => {
          return false;
        },
        highlightedFunction: () => {
        },
      },
    ];
    this.state = {
      highlighted: {
        AVERAGE: false,
        LERP: false,
        MINUS: false,
        SUM: false,
        SLIDER: false,
        RANDFONT: false,
        DIST: false,
      }
    };
    this.updateHighlights = this.updateHighlights.bind(this);
  };
  componentWillReceiveProps(props) {
    this.updateHighlights();
  };
  updateHighlights() {
    // if one cell is selected
      // and it doesnt have a value, highlight all
    // if two cells are selected
      // if they both have values
        // clicking starts a capture mode
    // if more than two cells are selected
      // and two have values,
      // highlight add, average, minus
      // populate next empty cell with result
    const highlight = {
      AVERAGE: false,
      LERP: false,
      MINUS: false,
      SUM: false,
      SLIDER: false,
      RANDFONT: false,
      DIST: false,
    };

    if (this.props.currentSelection && this.props.hotInstance) { // add in highlighted selection logic
      for (let opIndex = 0; opIndex < this.operations.length; opIndex++) {
        const operation = this.operations[opIndex];
        highlight[operation.name] = operation.shouldHighlight();
      }
      this.setState({ highlighted: highlight });
    }
  };
  render() {
    return (
      <div className='operation-drawer'>
        { this.operations.map(operation => {
            const highlighted = this.state.highlighted[operation.name];
            return (
              <div
                key={operation.name}
                className={`operation-button ${highlighted ? 'highlighted' : ''}`}
                onClick={ e => {
                  const string = operation.name === 'RANDFONT' ? `=RANDFONT(${randomInt(0, 9999)})` : operation.populateString;
                  const closeAfterSetting = operation.name === 'SLIDER' || operation.name === 'RANDFONT';
                  if (highlighted) {
                    operation.highlightedFunction();
                  } else {
                    this.props.setSelectedCellData(string, closeAfterSetting);
                  }
                  this.updateHighlights();
                }}
              >{operation.name}</div>
            );
          }) }
      </div>
    );
  };
};
OperationDrawer.propTypes = {
  currentSelection: PropTypes.array,
  setSelectedCellData: PropTypes.func,
  hotInstance: PropTypes.object,
};
