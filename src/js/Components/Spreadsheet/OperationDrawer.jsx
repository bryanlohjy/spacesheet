import React from 'react';
import PropTypes from 'prop-types';
import { isFormula, cellCoordsToLabel } from './CellHelpers.js';
import { removeInstancesOfClassName } from '../../lib/helpers.js';

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

            let hasValuesAtEnds;
            let hasInBetweens;
            let hasEmptyValuesInBetween = true;

            if (!verticalStrip && !horizontalStrip) { // check for grid
              hasInBetweens = rows > 2 && cols > 2;
              if (hasInBetweens) {
                for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                    const isAnchor = (row === 0 && (col === 0 || col === cols - 1)) || (row === rows - 1 && (col === 0 || col === cols - 1));
                    if (!isAnchor && validMatrix[row][col]) {
                      hasEmptyValuesInBetween = false;
                      break;
                    }
                  }
                }
                if (hasEmptyValuesInBetween && validMatrix[0][0] && validMatrix[0][cols - 1] && validMatrix[rows - 1][0] && validMatrix[rows - 1][cols - 1]) {
                  return true;
                }
              }
            } else if (verticalStrip) {
              hasInBetweens = rows > 2;
              hasValuesAtEnds = validMatrix[0][0] && validMatrix[rows - 1][0];
              for (let row = 1; row < rows - 1; row++) {
                if (validMatrix[row][0]) {
                  hasEmptyValuesInBetween = false;
                  break;
                }
              }
            } else if (horizontalStrip) {
              hasInBetweens = cols > 2;
              hasValuesAtEnds = validMatrix[0][0] && validMatrix[0][cols - 1];
              for (let col = 1; col < cols - 1; col++) {
                if (validMatrix[0][col]) {
                  hasEmptyValuesInBetween = false;
                  break;
                }
              }
            }
            if (hasValuesAtEnds && hasInBetweens && hasEmptyValuesInBetween) {
              return true;
            }
          }
          return false;
        },
        mouseOver: () => { // highlight cells that would be populated
          // 'highlighted-reference'
          const selection = this.props.currentSelection;
          const selectedCells = this.props.hotInstance.getData.apply(this, selection);
          const rows = selectedCells.length;
          const cols = selectedCells[0].length;
          const startRow = Math.min(selection[0], selection[2]);
          const startCol = Math.min(selection[1], selection[3]);
          const endRow = Math.max(selection[0], selection[2]);
          const endCol = Math.max(selection[1], selection[3]);

          const verticalStrip = rows > 1 && cols === 1;
          const horizontalStrip = cols > 1 && rows === 1;

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
              const reference = this.props.hotInstance.getCell(row, col);
              if (reference) {
                reference.classList.add('highlighted-reference');
              }
            }
          }
        },
        highlightedFunction: () => {
          // fill cells in between start and end
          // with incremented lerp
          const selection = this.props.currentSelection;
          const selectedCells = this.props.hotInstance.getData.apply(this, selection);

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
            this.props.hotInstance.populateFromArray(startRow, startCol, vals);
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
                onMouseOver={ e => {
                  if (highlighted) {
                    operation.mouseOver();
                  }
                }}
                onMouseOut={ e => {
                  removeInstancesOfClassName('highlighted-reference');
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
