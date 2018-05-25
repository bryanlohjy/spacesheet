import React from 'react';
import PropTypes from 'prop-types';
import { isFormula, cellCoordsToLabel } from './CellHelpers.js';
import { removeInstancesOfClassName, randomInt, getAllIndicesInArray } from '../../lib/helpers.js';

export default class OperationDrawer extends React.Component {
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

    const highlightCellsFromSelection = (hotInstance, selection) => {
      const startRow = Math.min(selection[0], selection[2]);
      const startCol = Math.min(selection[1], selection[3]);
      const endRow = Math.max(selection[0], selection[2]);
      const endCol = Math.max(selection[1], selection[3]);

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cell = hotInstance.getCell(row, col);
          if (cell) {
            cell.classList.add('highlighted-reference');
          }
        }
      }
    };

    const highlightSmartFillArray = (hotInstance, arr) => {
      for (let cellRefIndex = 0; cellRefIndex < arr.length; cellRefIndex++) {
        const cell = arr[cellRefIndex];
        const reference = hotInstance.getCell(cell[0], cell[1]);
        if (reference) {
          reference.classList.add('highlighted-reference');
        }
      }
    };

    const twoArgSmartFillFn = operationName => {
      const output = { cellsToHighlight: [], fillString: "" };
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

      let vals;
      if (horizontalStrip) {
        vals = validMatrix[0];
      } else if (verticalStrip) {
        vals = validMatrix.map(row => row[0]);
      }
      if (!vals || vals.length < 0) { return output };
      const valids = getAllIndicesInArray(vals, true);
      if (valids.length !== 2) { return output };

      let firstArgCoords;
      let secondArgCoords;
      if (horizontalStrip) {
        firstArgCoords = { row: startRow, col: valids[0] + startCol };
        secondArgCoords = { row: startRow, col: valids[1] + startCol };
      } else if (verticalStrip) {
        firstArgCoords = { row: valids[0] + startRow, col: startCol };
        secondArgCoords = { row: valids[1] + startRow, col: startCol };
      }

      const firstEmpty = vals.indexOf(false);
      let fillCellRow;
      let fillCellCol;
      if (firstEmpty < 0) { // if there are no empty cells selected, look outside selection
        // look first for a cell on an extended column, then row if not available
        if (horizontalStrip) {
          const extendedValidMatrix = getValidMatrix(self.props.hotInstance.getData(startRow, startCol, endRow,  endCol + 1));
          const extendedEndCol = extendedValidMatrix.map(row => {
            return row[row.length - 1];
          });
          const emptyCellsInEndCol = getAllIndicesInArray(extendedEndCol, false);
          if (emptyCellsInEndCol.length <= 0) {
            return output;
          }
          fillCellRow = startRow;
          fillCellCol = endCol + 1;
        } else if (verticalStrip) {
          const extendedValidMatrix = getValidMatrix(self.props.hotInstance.getData(startRow, startCol, endRow + 1,  endCol));
          const extendedEndRow = extendedValidMatrix[extendedValidMatrix.length - 1];
          const emptyCellsInEndRow = getAllIndicesInArray(extendedEndRow, false);
          if (emptyCellsInEndRow.length <= 0) {
            return output;
          }
          fillCellRow = endRow + 1;
          fillCellCol = startCol;
        }
      } else if (horizontalStrip) {
        fillCellRow = startRow;
        fillCellCol = startCol + firstEmpty;
      } else if (verticalStrip) {
        fillCellRow = startRow + firstEmpty;
        fillCellCol = startCol;
      }

      const firstArgLabel = cellCoordsToLabel(firstArgCoords);
      const secondArgLabel = cellCoordsToLabel(secondArgCoords);

      let fillString = `=${operationName}(${firstArgLabel}, ${secondArgLabel})`;

      // if labels have been reordered, order it back
      if (startRow != selection[0] || startCol != selection[1]) {
        fillString = `=${operationName}(${secondArgLabel}, ${firstArgLabel})`;
      }
      output.fillString = fillString;

      output.cellsToHighlight.push([fillCellRow, fillCellCol]);
      return output;
    }

    const self = this;
    this.operations = {
      AVERAGE: {
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
        },
        shouldHighlight: () => {
        },
        get smartFillCells() {
          const output = { cellsToHighlight: [], newData: [] };
          // if a strip is selected, and there is an empty - fill that cell with the average cell

          // otherwise, look for empties outside the selection
            // if a vertical strip - look first for the cell below the selection
              // extend col and look down otherwise

            // if a horizontal strip - look first for the cell to the right of the selection
              // extend row and look right other wise
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
          if (smartFill && smartFill.newData.length > 0) {
            const newData = smartFill.newData;
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

          output.newData = selectedCells.map((row, rowIndex) => {
            return row.map((val, colIndex) => {
              const isAnchor = (rowIndex === 0 && (colIndex === 0 || colIndex === cols - 1)) || (rowIndex === rows - 1 && (colIndex === 0 || colIndex === cols - 1));
              if (isAnchor) { return val; }
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
            self.props.hotInstance.setDataAtCell(smartFillCell[0], smartFillCell[1], smartFill.fillString);
          } else {
            self.props.setSelectedCellData('=MINUS(');
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.MINUS.smartFillCells;
          return smartFill && smartFill.cellsToHighlight.length > 0;
        },
        get smartFillCells() {
          return twoArgSmartFillFn('MINUS');
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
            self.props.hotInstance.setDataAtCell(smartFillCell[0], smartFillCell[1], smartFill.fillString);
          } else {
            self.props.setSelectedCellData('=SUM(');
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.SUM.smartFillCells;
          return smartFill && smartFill.cellsToHighlight.length > 0;
        },
        get smartFillCells() {
          return twoArgSmartFillFn('SUM');
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
            self.props.hotInstance.setDataAtCell(smartFillCell[0], smartFillCell[1], smartFill.fillString);
          } else {
            self.props.setSelectedCellData('=DIST(');
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.DIST.smartFillCells;
          return smartFill && smartFill.cellsToHighlight.length > 0;
        },
        get smartFillCells() {
          return twoArgSmartFillFn('DIST');
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
          const newCells = selectedCells.map(row => {
            return row.map(col => {
              return `=SLIDER(0, 1, 0.05)`;
            });
          });
          self.props.hotInstance.populateFromArray(startRow, startCol, newCells);
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
          const newCells = selectedCells.map(row => {
            return row.map(col => {
              return `=RANDFONT(${randomInt(0, 9999)})`;
            });
          });
          self.props.hotInstance.populateFromArray(startRow, startCol, newCells);
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
