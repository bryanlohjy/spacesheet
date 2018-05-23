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
    this.initHotTable = this.initHotTable.bind(this);

    this.state = {
      inputBarIsMounted: false,
      hotTableIsLoaded: false,
    };

    this.maxCols = Math.ceil(this.props.width / this.props.outputWidth);
    this.maxRows = Math.ceil(this.props.height / this.props.outputHeight);
    this.demoSheet = DemoSheet(this.maxRows, this.maxCols);

    this.setSelectedCellData = this.setSelectedCellData.bind(this);
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
      inputBar: this.inputBar,
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
  setSelectedCellData(operation, closeAfterSetting) {
    if (closeAfterSetting) {
      const selection = this.hotInstance.getSelected();
      this.hotInstance.setDataAtCell(selection[0], selection[1], operation);
      this.inputBar.value = operation;
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
    console.warn('SPREADSHEET COMPOONENT RENDER')
    return (
      <div className="spreadsheet-container">
        <input className="input-bar" type="text"
          disabled
          ref={ el => {
            if (!this.state.inputBarIsMounted) {
              this.inputBar = el;
              this.setState({ inputBarIsMounted : true });
            }
          }}
        />
        <OperationDrawer
          setSelectedCellData={this.setSelectedCellData}
        />
        {
          this.state.inputBarIsMounted ? (
            <div className="table-container" ref="tableContainer">
              <HotTable
                className="table"
                ref={ ref => {
                  if (ref && !this.hotInstance) {
                    this.props.setTableRef(ref);
                    this.hotInstance = ref.hotInstance;
                    this.initHotTable();
                    this.setState({ hotTableIsLoaded: true });
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

                // width={ this.props.width }
                // height={ this.props.height - inputBarHeight - this.drawerHeight }

                maxCols={ this.maxCols }
                maxRows={ this.maxRows }

                viewportColumnRenderingOffset={26}
                viewportRowRenderingOffset={26}

                outsideClickDeselects={false}
                // make sure input bar is in sync
                afterUndo={ changes => {
                  const selection = this.hotInstance.getSelected();
                  const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
                  if (this.inputBar.value !== data) {
                    this.inputBar.value = data;
                  }
                }}
                afterRedo={ changes => {
                  const selection = this.hotInstance.getSelected();
                  const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
                  if (this.inputBar.value !== data) {
                    this.inputBar.value = data;
                  }
                }}
                comments={true}
                customBorders={true}

                undo
                redo
              />
            </div>) : ''
        }
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
  model: PropTypes.object,
  // beforeChange: PropTypes.func,
  // setCurrentColor: PropTypes.func,
};

class OperationDrawer extends React.Component {
  constructor(props) {
    super(props);
    this.operations = [
      { name: 'AVERAGE', populateString: '=AVERAGE(' },
      { name: 'LERP', populateString: '=LERP(' },
      { name: 'MINUS', populateString: '=MINUS(' },
      { name: 'ADD', populateString: '=ADD(' },
      { name: 'SLIDER', populateString: '=SLIDER(0, 1, 0.05)' },
      { name: 'RANDFONT', populateString: `=RANDFONT()` },
      { name: 'DIST', populateString: '=DIST(' },
    ];
  };
  render() {
    return (
      <div className='operation-drawer'>
        { this.operations.map(operation => {
            return (
              <div
                key={operation.name}
                className='operation-button'
                onClick={ e => {
                  const string = operation.name === 'RANDFONT' ? `=RANDFONT(${randomInt(0, 9999)})` : operation.populateString;
                  const closeAfterSetting = operation.name === 'SLIDER' || operation.name === 'RANDFONT';
                  this.props.setSelectedCellData(string, closeAfterSetting);
                }}
              >{operation.name}</div>
            );
          }) }
      </div>
    );
  };
};
OperationDrawer.propTypes = {
  // hotInstance: PropTypes.object,
  setSelectedCellData: PropTypes.func,
};
