import React from 'react';
import PropTypes from 'prop-types';
import HotTable from 'react-handsontable';
import HandsOnTable from 'handsontable';
import { CellTypes } from './CellTypes.js';
import { GetCellType } from './CellHelpers.js';
import { DemoSheet } from './SpreadsheetData.js';
import { FormulaParser } from './FormulaParser.js';

export default class Spreadsheet extends React.Component {
  constructor(props) {
    super(props);

    this.initHotTable = this.initHotTable.bind(this);
    this.updateInputBarValue = this.updateInputBarValue.bind(this);
    // this.setCellValue = this.setCellValue.bind(this);
    // this.handleAfterSelection = this.handleAfterSelection.bind(this);
    // this.activateEditor = this.activateEditor.bind(this);
    // this.onInputKeydown = this.onInputKeydown.bind(this);

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
      inputBar: this.inputBar,
      drawFn: this.props.drawFn,
      decodeFn: this.props.decodeFn,
      outputWidth: this.props.outputWidth,
      outputHeight: this.props.outputHeight,
      getCellFromDataPicker: this.props.getCellFromDataPicker,
      formulaParser: new FormulaParser(this.hotInstance, {
        getCellFromDataPicker: this.props.getCellFromDataPicker
      }),
      updateInputBarValue: this.updateInputBarValue,
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
  updateInputBarValue(value, emitUpdate) {
    if (this.activeEditor) {
      this.activeEditor.TEXTAREA.value = value;
      if (emitUpdate) {
        const updateEvent = new CustomEvent("update", { "detail": "inputbar" });
        this.activeEditor.TEXTAREA.dispatchEvent(updateEvent);
      }
    }
    // this.inputBar.value = value;
  };
  // setCellValue(value) {
  //   const selection = this.hotInstance.getSelected();
  //   this.hotInstance.setDataAtCell(selection[0], selection[1], value);
  // };
  // handleAfterSelection(rowFrom, colFrom, rowTo, colTo) {
  //   let currentSelection = [rowFrom, colFrom].toString();
  //   if (this.previousSelection !== currentSelection) { // only update if the value is different
  //     const cell = this.hotInstance.getDataAtCell(rowFrom, colFrom);
  //     this.updateInputBarValue(cell);
  //     this.previousSelection = currentSelection;
  //   }
  // }
  // onInputKeydown(e) {
  //   if (e.keyCode === 13) {
  //     this.activeEditor.finishEditing();
  //   }
  // };
  render() {
    const inputBarHeight = 21;
    return (
      <div className="spreadsheet-container">
        {/* <InputBar
          onInputKeydown={ this.onInputKeydown }
          setInputRef={ this.setInputRef }
          updateInputBarValue={ this.updateInputBarValue }
          setCellValue={ this.setCellValue }
          height={ inputBarHeight }
          activateEditor={ this.activateEditor }
        /> */}
        <input className="input-bar" type="text"
          ref={ el => {
            console.log('remder')
            if (!this.inputBar) {
              this.inputBar = el;
              this.setState({ inputBarIsMounted : true });
            }
          }}
          onChange={ e => { // update active edit cell
            // const updateEvent = new CustomEvent("update", { "detail": "inputbar" });
            // e.target.dispatchEvent(updateEvent);
            const activeEditor = this.hotInstance.getActiveEditor();
            if (!this.activeEditor && !activeEditor.isOpened()) { // if the cell is not being edited, set edit mode
              console.log('Cell was not in edit mode, set it to edit mode');
              this.activeEditor = activeEditor;
              this.activeEditor.beginEditing(null, "FROMINPUTBAR");
              // console.log('INPUT BAR: Initiate editor');
              // this.activeEditor = this.hotInstance.getActiveEditor();
              // this.activeEditor.close();
              // this.activeEditor.beginEditing(null, "FROMINPUTBAR");
              // // listen for updates in cell
              // console.log('INPUT BAR LISTENING FOR CELL UPDATES');
              // this.activeEditor.TEXTAREA.addEventListener('update', () => {
              //   console.log('INPUT BAR DETECTS CELL UPDATES')
              // });
            }
            const updateEvent = new CustomEvent("update", { "detail": "inputbar" });
            e.target.dispatchEvent(updateEvent);
            // this.updateInputBarValue(e.target.value, true);
          }}
          onKeyDown={ e => { // check for submits + aborts
            if (e.keyCode === 13 && this.activeEditor) { // enter: stop editing
              console.log('Submit input and, close and clear activeEditor');
              this.activeEditor.editingFromInputBar = false;
              this.activeEditor.focus();
              this.activeEditor.finishEditing();
              this.activeEditor = null;
              this.inputBar.blur();
            //   console.log("Finish editing and delete editor");
            //   this.activeEditor.close();
            //   this.activeEditor.finishEditing();
            //   this.activeEditor = null;
            }
            // console.log("Input Keydown", e.keyCode)
            // if (e.keyCode === 13) {
            //   this.activeEditor.finishEditing();
            // }
            // this.props.onInputKeydown(e);
            // if (e.keyCode === 13) {
            //   this.props.setCellValue(e.target.value);
            // }
          }}
          style={{
            height: inputBarHeight || 21,
          }}
        />
        {
          this.state.inputBarIsMounted ? (
            <div className="table-container" ref="tableContainer">
              <HotTable
                className="table"
                ref={ ref => {
                  this.props.setTableRef(ref);
                  this.hotInstance = ref.hotInstance;
                  this.initHotTable();
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
                // make sure input bar is in sync
                afterUndo={ e => {
                  const selection = this.hotInstance.getSelected();
                  if (selection) {
                    const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
                    if (this.inputBar.innerText !== data) {
                      this.updateInputBarValue(data);
                    }
                  }
                }}
                afterRedo={ e => {
                  const selection = this.hotInstance.getSelected();
                  if (selection) {
                    const data = this.hotInstance.getDataAtCell(selection[0], selection[1]);
                    if (this.inputBar.innerText !== data) {
                      this.updateInputBarValue(data);
                    }
                  }
                }}
                undo
                redo
                // afterSelection={ this.handleAfterSelection }
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
  // beforeChange: PropTypes.func,
  // setCurrentColor: PropTypes.func,
};

// class InputBar extends React.Component {
//   constructor(props) {
//     super(props);
//   }
//   render() {
//     return (
//       <input className="input-bar" type="text"
//         ref={ el => {
//           this.props.setInputRef(el);
//         }}
//         onChange={ e => {
//           this.props.updateInputBarValue(e.target.value);
//         }}
//         onKeyDown={ e => {
//           this.props.onInputKeydown(e);
//           if (e.keyCode === 13) {
//             this.props.setCellValue(e.target.value);
//           }
//         }}
//         style={{
//           height: this.props.height || 21,
//         }}
//         onClick={ this.props.activateEditor }
//       />
//     )
//   }
// }
// InputBar.propTypes = {
//   onInputKeydown: PropTypes.func,
//   onChange: PropTypes.func,
//   setInputRef: PropTypes.func,
//   setCellValue: PropTypes.func,
//   updateInputBarValue: PropTypes.func,
//   height: PropTypes.number,
//   activateEditor: PropTypes.func,
// };
