import React from 'react';
import PropTypes from 'prop-types';
import { isFormula, cellCoordsToLabel } from './CellHelpers.js';
import { removeInstancesOfClassName, randomInt, getAllIndicesInArray, arraysAreSimilar } from '../../lib/helpers.js';
import {
  getValidMatrix,
  highlightCellsFromSelection,
  highlightSmartFillArray,
  twoArgSmartFillFn,
} from './OperationDrawerHelpers.js';

export default class OperationDrawer extends React.Component {
  constructor(props) {
    super(props);
    const self = this;
    this.operations = {
      AVERAGE: {
        onMouseOver: e => {
          const smartFill = self.operations.AVERAGE.smartFillCells;
          if (smartFill && smartFill.cellsToHighlight.length > 0) {
            highlightSmartFillArray(self.props.hotInstance, smartFill.cellsToHighlight);
          } else {
            const selection = self.props.hotInstance.getSelected();
            highlightCellsFromSelection(self.props.hotInstance, [selection[0], selection[1], selection[0], selection[1]]);
          }
        },
        onClick: e => {
          const smartFill = self.operations.AVERAGE.smartFillCells;
          if (smartFill.cellsToHighlight.length > 0) {
            const smartFillCell = smartFill.cellsToHighlight[0];
            const prevCellData = self.props.hotInstance.getDataAtCell(smartFillCell[0], smartFillCell[1]);
            if (prevCellData !== smartFill.fillString) {
              self.props.hotInstance.setDataAtCell(smartFillCell[0], smartFillCell[1], smartFill.fillString);
            }
          } else {
            self.props.setSelectedCellData('=AVERAGE(');
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.AVERAGE.smartFillCells;
          return smartFill && smartFill.cellsToHighlight.length > 0;
        },
        get smartFillCells() {
          const output = { cellsToHighlight: [], fillString: '' };
          const selection = self.props.currentSelection;
          const startRow = Math.min(selection[0], selection[2]);
          const startCol = Math.min(selection[1], selection[3]);
          const endRow = Math.max(selection[0], selection[2]);
          const endCol = Math.max(selection[1], selection[3]);

          const selectedCells = self.props.hotInstance.getData.apply(self, selection);
          const rows = selectedCells.length;
          const cols = selectedCells[0].length;

          const validMatrix = getValidMatrix(selectedCells);
          const verticalStrip = rows > 1 && cols === 1;
          const horizontalStrip = cols > 1 && rows === 1;
          const gridSelection = rows > 1 && cols > 1;

          let _valCount = 0;
          let hasMultipleValues;
          for (let rowIndex = 0; rowIndex < validMatrix.length; rowIndex++) {
            const row = validMatrix[rowIndex];
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
              const val = validMatrix[rowIndex][colIndex];
              if (val === true) {
                _valCount++;
                if (_valCount >= 2) {
                  hasMultipleValues = true;
                  break;
                }
              }
            }
          }
          const hasVals = _valCount > 0;
          if (!hasMultipleValues) { return output; }

          // if there are vals, and there is an empty at the end of selection
          if (verticalStrip || horizontalStrip) {
            let vals;
            if (verticalStrip) {
              vals = validMatrix.map(row => row[0]);
            } else if (horizontalStrip) {
              vals = validMatrix[0];
            }

            const emptyLastVal = vals[vals.length - 1] === false;
            const emptyValIsWithinSelection = verticalStrip ? rows > 2 : cols > 2;

            let startLabel;
            let endLabel;
            if (emptyLastVal && emptyValIsWithinSelection && hasVals) {
              if (verticalStrip) {
                output.cellsToHighlight = [[endRow, startCol]];
                startLabel = cellCoordsToLabel({ row: startRow, col: startCol });
                endLabel = cellCoordsToLabel({ row: endRow - 1, col: startCol });
              } else if (horizontalStrip) {
                output.cellsToHighlight = [[startRow, endCol]];
                startLabel = cellCoordsToLabel({ row: startRow, col: startCol });
                endLabel = cellCoordsToLabel({ row: startRow, col: endCol - 1 });
              }
              output.fillString = `=AVERAGE(${startLabel}:${endLabel})`;
              return output;
            }
          }

          if (hasVals) { // populate cells to right, or bottom
            const numRows = self.props.hotInstance.countRows();
            const numCols = self.props.hotInstance.countCols();
            // check cells outside of selection
            const rightCell = endCol + 1 < numCols ? [[startRow, endCol + 1]] : false;
            const bottomCell = endRow + 1 < numRows ? [[endRow + 1, startCol]] : false;

            let startLabel = cellCoordsToLabel({ row: startRow, col: startCol });
            let endLabel = cellCoordsToLabel({ row: endRow, col: endCol });

            if (verticalStrip) { // if vertical, look to the bottom first
              if (bottomCell) {
                output.cellsToHighlight = bottomCell;
                output.fillString = `=AVERAGE(${startLabel}:${endLabel})`;
              } else if (rightCell) {
                output.cellsToHighlight = rightCell;
                output.fillString = `=AVERAGE(${startLabel}:${endLabel})`;
              }
            } else {
              if (rightCell) {
                output.cellsToHighlight = rightCell;
                output.fillString = `=AVERAGE(${startLabel}:${endLabel})`;
              } else if (bottomCell) {
                output.cellsToHighlight = bottomCell;
                output.fillString = `=AVERAGE(${startLabel}:${endLabel})`;
              }
            }
          }
          return output;
        },
      },
      LERP: {
        onMouseOver: e => {
          const smartFill = self.operations.LERP.smartFillCells;
          if (smartFill && smartFill.cellsToHighlight.length > 0) {
            highlightSmartFillArray(self.props.hotInstance, smartFill.cellsToHighlight);
          } else {
            const selection = self.props.hotInstance.getSelected();
            highlightCellsFromSelection(self.props.hotInstance, [selection[0], selection[1], selection[0], selection[1]]);
          }
        },
        onClick: e => {
          const smartFill = self.operations.LERP.smartFillCells;
          const newData = smartFill.newData;
          if (newData && newData.length > 0) {
            const selection = self.props.currentSelection;
            const startRow = Math.min(selection[0], selection[2]);
            const startCol = Math.min(selection[1], selection[3]);
            const selectedCells = self.props.hotInstance.getData.apply(self, selection);
            if (!arraysAreSimilar(selectedCells, newData)) {
              self.props.hotInstance.populateFromArray(startRow, startCol, newData);
            }
          } else {
            self.props.setSelectedCellData(`=LERP(`);
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.LERP.smartFillCells;
          return smartFill && smartFill.cellsToHighlight.length > 0;
        },
        get smartFillCells() {
          const output = { cellsToHighlight: [], newData: [] };
          const selection = self.props.currentSelection;
          const selectedCells = self.props.hotInstance.getData.apply(self, selection);

          const rows = selectedCells.length;
          const cols = selectedCells[0].length;

          const validMatrix = getValidMatrix(selectedCells);
          const hasAnchors = validMatrix[0][0] && validMatrix[0][cols - 1] && validMatrix[rows - 1][cols - 1] && validMatrix[rows - 1][0];
          if (!hasAnchors) { return output; }

          const startRow = Math.min(selection[0], selection[2]);
          const startCol = Math.min(selection[1], selection[3]);
          const endRow = Math.max(selection[0], selection[2]);
          const endCol = Math.max(selection[1], selection[3]);

          let hasNewData = false;
          const _newData = selectedCells.map((row, rowIndex) => {
            return row.map((val, colIndex) => {
              const isAnchor = (rowIndex === 0 && (colIndex === 0 || colIndex === cols - 1)) || (rowIndex === rows - 1 && (colIndex === 0 || colIndex === cols - 1));
              if (isAnchor) { return val; }
              if (!hasNewData) { hasNewData = true; }
              let lerpBy;
              let fillString;
              if (rowIndex === 0) {
                let tlLabel = cellCoordsToLabel({ row: startRow, col: startCol });
                let trLabel = cellCoordsToLabel({ row: startRow, col: endCol });
                lerpBy = Number((1 / (cols - 1)) * colIndex).toFixed(2);
                fillString = `=LERP(${tlLabel}, ${trLabel}, ${lerpBy})`;
              } else if (rowIndex === rows - 1) {
                let brLabel = cellCoordsToLabel({ row: endRow, col: endCol });
                let blLabel = cellCoordsToLabel({ row: endRow, col: startCol });
                lerpBy = Number((1 / (cols - 1)) * colIndex).toFixed(2);
                fillString = `=LERP(${blLabel}, ${brLabel}, ${lerpBy})`;
              } else {
                lerpBy = Number((1 / (rows - 1)) * rowIndex).toFixed(2);
                const topLabel = cellCoordsToLabel({ row: startRow, col: startCol + colIndex });
                const bottomLabel = cellCoordsToLabel({ row: startRow + rows - 1, col: startCol + colIndex });
                fillString = `=LERP(${topLabel}, ${bottomLabel}, ${lerpBy})`;
              }
              output.cellsToHighlight.push([startRow + rowIndex, startCol + colIndex]);
              return fillString;
            });
          });
          if (hasNewData) {
            output.newData = _newData;
          }
          return output;
        },
      },
      MINUS: {
        onMouseOver: e => {
          const smartFill = self.operations.MINUS.smartFillCells;
          if (smartFill && smartFill.cellsToHighlight.length > 0) {
            highlightSmartFillArray(self.props.hotInstance, smartFill.cellsToHighlight);
          } else {
            const selection = self.props.hotInstance.getSelected();
            highlightCellsFromSelection(self.props.hotInstance, [selection[0], selection[1], selection[0], selection[1]]);
          }
        },
        onClick: e => {
          const smartFill = self.operations.MINUS.smartFillCells;
          if (smartFill.cellsToHighlight.length > 0) {
            const smartFillCell = smartFill.cellsToHighlight[0];
            const prevCellData = self.props.hotInstance.getDataAtCell(smartFillCell[0], smartFillCell[1]);
            if (prevCellData !== smartFill.fillString) {
              self.props.hotInstance.setDataAtCell(smartFillCell[0], smartFillCell[1], smartFill.fillString);
            }
          } else {
            self.props.setSelectedCellData('=MINUS(');
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.MINUS.smartFillCells;
          return smartFill && smartFill.cellsToHighlight.length > 0;
        },
        get smartFillCells() {
          return twoArgSmartFillFn(self.props.hotInstance, self.props.currentSelection, 'MINUS');
        },
      },
      SUM: {
        onMouseOver: e => {
          const smartFill = self.operations.SUM.smartFillCells;
          if (smartFill && smartFill.cellsToHighlight.length > 0) {
            highlightSmartFillArray(self.props.hotInstance, smartFill.cellsToHighlight);
          } else {
            const selection = self.props.hotInstance.getSelected();
            highlightCellsFromSelection(self.props.hotInstance, [selection[0], selection[1], selection[0], selection[1]]);
          }
        },
        onClick: e => {
          const smartFill = self.operations.SUM.smartFillCells;
          if (smartFill.cellsToHighlight.length > 0) {
            const smartFillCell = smartFill.cellsToHighlight[0];
            const prevCellData = self.props.hotInstance.getDataAtCell(smartFillCell[0], smartFillCell[1]);
            if (prevCellData !== smartFill.fillString) {
              self.props.hotInstance.setDataAtCell(smartFillCell[0], smartFillCell[1], smartFill.fillString);
            }
          } else {
            self.props.setSelectedCellData('=SUM(');
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.SUM.smartFillCells;
          return smartFill && smartFill.cellsToHighlight.length > 0;
        },
        get smartFillCells() {
          return twoArgSmartFillFn(self.props.hotInstance, self.props.currentSelection, 'SUM');
        },
      },
      DIST: {
        onMouseOver: e => {
          const smartFill = self.operations.DIST.smartFillCells;
          if (smartFill && smartFill.cellsToHighlight.length > 0) {
            highlightSmartFillArray(self.props.hotInstance, smartFill.cellsToHighlight);
          } else {
            const selection = self.props.hotInstance.getSelected();
            highlightCellsFromSelection(self.props.hotInstance, [selection[0], selection[1], selection[0], selection[1]]);
          }
        },
        onClick: e => {
          const smartFill = self.operations.DIST.smartFillCells;
          if (smartFill.cellsToHighlight.length > 0) {
            const smartFillCell = smartFill.cellsToHighlight[0];
            const prevCellData = self.props.hotInstance.getDataAtCell(smartFillCell[0], smartFillCell[1]);
            if (prevCellData !== smartFill.fillString) {
              self.props.hotInstance.setDataAtCell(smartFillCell[0], smartFillCell[1], smartFill.fillString);
            }
          } else {
            self.props.setSelectedCellData('=DIST(');
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.DIST.smartFillCells;
          return smartFill && smartFill.cellsToHighlight.length > 0;
        },
        get smartFillCells() {
          return twoArgSmartFillFn(self.props.hotInstance, self.props.currentSelection, 'DIST');
        },
      },
      SLIDER: {
        onMouseOver: e => {
          const selection = self.props.hotInstance.getSelected();
          highlightCellsFromSelection(self.props.hotInstance, selection);
        },
        onClick: e => {
          const selection = self.props.hotInstance.getSelected();
          const selectedCells = self.props.hotInstance.getData.apply(self, selection);
          const startRow = Math.min(selection[0], selection[2]);
          const startCol = Math.min(selection[1], selection[3]);
          const newData = selectedCells.map(row => {
            return row.map(col => {
              return `=SLIDER(0, 1, 0.05)`;
            });
          });
          if (!arraysAreSimilar(selectedCells, newData)) {
            self.props.hotInstance.populateFromArray(startRow, startCol, newData);
          }
        },
        shouldHighlight: () => {
          return false;
        },
        get smartFillCells() {
          return [];
        },
      },
      RANDFONT: {
        onMouseOver: e => {
          const selection = self.props.hotInstance.getSelected();
          highlightCellsFromSelection(self.props.hotInstance, selection);
        },
        onClick: e => {
          const selection = self.props.hotInstance.getSelected();
          const selectedCells = self.props.hotInstance.getData.apply(self, selection);
          const startRow = Math.min(selection[0], selection[2]);
          const startCol = Math.min(selection[1], selection[3]);
          const newData = selectedCells.map(row => {
            return row.map(col => {
              return `=RANDFONT(${randomInt(0, 9999)})`;
            });
          });
          if (!arraysAreSimilar(selectedCells, newData)) {
            self.props.hotInstance.populateFromArray(startRow, startCol, newData);
          }
        },
        shouldHighlight: () => {
          return false;
        },
        get smartFillCells() {
          return [];
        },
      },
    }
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
      const operations = Object.keys(this.operations);
      for (let opIndex = 0; opIndex < operations.length; opIndex++) {
        const operationKey = operations[opIndex];
        highlight[operationKey] = this.operations[operationKey].shouldHighlight();
      }
      this.setState({ highlighted: highlight });
    }
  };
  render() {
    return (
      <div className='operation-drawer'>
        { Object.keys(this.operations).map(key => {
          const operation = this.operations[key];
            return (
              <div
                key={key}
                className={`operation-button ${this.state.highlighted[key] ? 'highlighted' : ''}`}
                onClick={ e => {
                  operation.onClick(e);
                  this.updateHighlights();
                }}
                onMouseOver={ e => {
                  operation.onMouseOver(e);
                }}
                onMouseOut={ e => {
                  removeInstancesOfClassName('highlighted-reference');
                }}
              >{key}</div>
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
