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
    const self = this;
    this.operations = {
      AVERAGE: {
        onMouseOver: e => {
        },
        onClick: e => {
        },
        shouldHighlight: () => {
        },
        get smartFillCells() {
        },
      },
      LERP: {
        onMouseOver: e => {
          const smartFill = self.operations.LERP.smartFillCells;
          if (smartFill && smartFill.length > 0) {
            highlightSmartFillArray(self.props.hotInstance, smartFill);
          } else {
            const selection = self.props.hotInstance.getSelected();
            highlightCellsFromSelection(self.props.hotInstance, [selection[0], selection[1], selection[0], selection[1]]);
          }
        },
        onClick: e => {
          const smartFill = self.operations.LERP.smartFillCells;
          if (smartFill && smartFill.length > 0) {
            // fill cells in between start and end
            // with incremented lerp
            const selection = self.props.currentSelection;
            const selectedCells = self.props.hotInstance.getData.apply(self, selection);

            const rows = selectedCells.length;
            const cols = selectedCells[0].length;

            const verticalStrip = rows > 1 && cols === 1;
            const horizontalStrip = cols > 1 && rows === 1;

            const validMatrix = getValidMatrix(selectedCells);

            const startRow = Math.min(selection[0], selection[2]);
            const startCol = Math.min(selection[1], selection[3]);
            const endRow = Math.max(selection[0], selection[2]);
            const endCol = Math.max(selection[1], selection[3]);

            const vals = selectedCells.map((row, rowIndex) => {
              return row.map((col, colIndex) => {
                if (!verticalStrip && !horizontalStrip) { // gridInterpolation
                  // interpolate horizontally between anchors, then vertically between results
                  let tlLabel = cellCoordsToLabel({ row: startRow, col: startCol });
                  let trLabel = cellCoordsToLabel({ row: startRow, col: endCol });
                  let brLabel = cellCoordsToLabel({ row: endRow, col: endCol });
                  let blLabel = cellCoordsToLabel({ row: endRow, col: startCol });
                  const isAnchor = (rowIndex === 0 && (colIndex === 0 || colIndex === cols - 1)) || (rowIndex === rows - 1 && (colIndex === 0 || colIndex === cols - 1));
                  if (!isAnchor) {
                    let lerpBy;
                    if (rowIndex === 0) {
                      lerpBy = Number((1 / (cols - 1)) * colIndex).toFixed(2);
                      return `=LERP(${tlLabel}, ${trLabel}, ${lerpBy})`
                    } else if (rowIndex === rows - 1) {
                      lerpBy = Number((1 / (cols - 1)) * colIndex).toFixed(2);
                      return `=LERP(${blLabel}, ${brLabel}, ${lerpBy})`
                    } else {
                      lerpBy = Number((1 / (rows - 1)) * rowIndex).toFixed(2);
                      const topLabel = cellCoordsToLabel({ row: startRow, col: startCol + colIndex });
                      const bottomLabel = cellCoordsToLabel({ row: startRow + rows - 1, col: startCol + colIndex });
                      return `=LERP(${topLabel}, ${bottomLabel}, ${lerpBy})`
                    }
                  }
                } else {
                  let startLabel = cellCoordsToLabel({ row: startRow, col: startCol });
                  let endLabel = cellCoordsToLabel({ row: endRow, col: endCol });
                  const isStartCell = rowIndex === 0 && colIndex === 0;
                  const isEndCell = rowIndex === rows - 1 && colIndex === cols - 1;
                  if (!isStartCell && !isEndCell) {
                    let lerpBy;
                    if (horizontalStrip) {
                      lerpBy = Number((1 / (cols - 1)) * colIndex).toFixed(2);
                    } else if (verticalStrip) {
                      lerpBy = Number((1 / (rows - 1)) * rowIndex).toFixed(2);
                    }
                    return `=LERP(${startLabel}, ${endLabel}, ${lerpBy})`;
                  }
                }
                return col;
              });
            });
            if (!arraysAreSimilar(selectedCells, vals)) {
              self.props.hotInstance.populateFromArray(startRow, startCol, vals);
            }
          } else {
            self.props.setSelectedCellData(`=LERP(`);
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.LERP.smartFillCells;
          return smartFill && smartFill.length > 0;
        },
        get smartFillCells() {
          const selection = self.props.currentSelection;
          const selectedCells = self.props.hotInstance.getData.apply(self, selection);
          const rows = selectedCells.length;
          const cols = selectedCells[0].length;
          const startRow = Math.min(selection[0], selection[2]);
          const startCol = Math.min(selection[1], selection[3]);
          const endRow = Math.max(selection[0], selection[2]);
          const endCol = Math.max(selection[1], selection[3]);

          // check to see if there are anchors
          const cells = [];

          const validMatrix = getValidMatrix(selectedCells);
          const verticalStrip = rows > 1 && cols === 1;
          const horizontalStrip = cols > 1 && rows === 1;
          const hasAnchors = validMatrix[0][0] && validMatrix[0][cols - 1] && validMatrix[rows - 1][cols - 1] && validMatrix[rows - 1][0];

          if (!hasAnchors) { return cells; }

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              if (verticalStrip) {
                if (row === startRow || row === endRow) {
                  continue;
                }
              } else if (horizontalStrip) {
                if (col === startCol || col === endCol) {
                  continue;
                }
              } else { // grid
                if ((row === startRow && (col === startCol || col === endCol)) || (row === endRow && (col === startCol || col === endCol))) {
                  continue;
                }
              }
              cells.push([row, col]);
            }
          }
          return cells;
        },
      },
      MINUS: {
        onMouseOver: e => {
          const smartFill = self.operations.MINUS.smartFillCells;
          if (smartFill && smartFill.length > 0) {
            highlightSmartFillArray(self.props.hotInstance, smartFill);
          } else {
            const selection = self.props.hotInstance.getSelected();
            highlightCellsFromSelection(self.props.hotInstance, [selection[0], selection[1], selection[0], selection[1]]);
          }
        },
        onClick: e => {
          const smartFill = self.operations.MINUS.smartFillCells;
          if (smartFill.length > 0) {
            const smartFillCell = smartFill[0];
            self.props.hotInstance.setDataAtCell(smartFillCell[0], smartFillCell[1], smartFillCell[2]);
          } else {
            self.props.setSelectedCellData('=MINUS(');
          }
        },
        shouldHighlight: () => {
          const smartFill = self.operations.MINUS.smartFillCells;
          return smartFill && smartFill.length > 0;
        },
        get smartFillCells() {
          const cells = [];
          const selection = self.props.currentSelection;
          const startRow = Math.min(selection[0], selection[2]);
          const startCol = Math.min(selection[1], selection[3]);
          const endRow = Math.max(selection[0], selection[2]);
          const endCol = Math.max(selection[1], selection[3]);

          const selectedCells = self.props.hotInstance.getData.apply(self, selection);
          const rows = selectedCells.length;
          const cols = selectedCells[0].length;
          const validMatrix = getValidMatrix(selectedCells);
          const verticalStrip = rows > 2 && cols === 1;
          const horizontalStrip = cols > 2 && rows === 1;

          let vals;
          if (horizontalStrip) {
            vals = validMatrix[0];
          } else if (verticalStrip) {
            vals = validMatrix.map(row => row[0]);
          }

          if (!vals || vals.length < 0) { return cells };
          const valids = getAllIndicesInArray(vals, true);
          const firstEmpty = vals.indexOf(false);
          if (valids.length !== 2) { return cells };
          if (firstEmpty < 0) { return cells };

          let fillCellRow;
          let fillCellCol;
          let firstArgCoords;
          let secondArgCoords;

          if (horizontalStrip) {
            fillCellRow = startRow;
            fillCellCol = startCol + firstEmpty;
            firstArgCoords = { row: startRow, col: valids[0] + startCol };
            secondArgCoords = { row: startRow, col: valids[1] + startCol };
          } else if (verticalStrip) {
            fillCellRow = startRow + firstEmpty;
            fillCellCol = startCol;
            firstArgCoords = { row: valids[0] + startRow, col: startCol };
            secondArgCoords = { row: valids[1] + startRow, col: startCol };
          }

          const firstArgLabel = cellCoordsToLabel(firstArgCoords);
          const secondArgLabel = cellCoordsToLabel(secondArgCoords);
          cells.push([fillCellRow, fillCellCol, `=MINUS(${firstArgLabel}, ${secondArgLabel})`])
          return cells;
        },
      },
      SUM: {
        onMouseOver: e => {
        },
        onClick: e => {
        },
        shouldHighlight: () => {
        },
        get smartFillCells() {
        },
      },
      DIST: {
        onMouseOver: e => {
        },
        onClick: e => {
        },
        shouldHighlight: () => {
        },
        get smartFillCells() {
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
