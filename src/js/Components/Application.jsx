import React from 'react';
import PropTypes from 'prop-types';
import DataPickers from './DataPicker/DataPickers.jsx';
import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';
import FontDrawer from './FontDrawer/FontDrawer.jsx';

import ModelLoader from '../lib/ModelLoader.js';
import FontModel from '../Models/FontModel.js';

import { formatDate } from '../lib/helpers.js';

import { saveJSON } from './Application.js';

export default class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelIsLoaded: false,
      outputWidth: 0,
      outputHeight: 0,
      inputBarValue: "",
    };
    this.setSpreadsheetCellFromDataPicker = this.setSpreadsheetCellFromDataPicker.bind(this);
    this.getCellFromDataPicker = this.getCellFromDataPicker.bind(this);
    this.setInputBarValue = this.setInputBarValue.bind(this);
  };
  componentDidMount() { // Initialise model + load grid data for DataPicker
    this.bottomNav = this.refs.bottomNav;
    this.memoryCtx = this.refs.memoryCanvas.getContext('2d'); // used to store and render drawings

    const loader = new ModelLoader(this, FontModel);

    const self = this;
    loader.load((errors, model) => {
      if (!errors) {
        console.log('Success', model)
        self.drawFn = model.drawFn;
        self.decodeFn = model.decodeFn;
        self.model = model;

        self.setState({
          outputWidth: model.outputWidth,
          outputHeight: model.outputHeight,
          modelIsLoaded: true,
        });
      } else {
        console.log('Errors')
      }
    });
  };
  setSpreadsheetCellFromDataPicker(dataKey) {
    const selection = this.hotInstance.getSelected();
    const cellData = `=DATAPICKER('${dataKey}')`;
    const prevData = this.hotInstance.getDataAtCell(selection[0], selection[1]);
    if (prevData !== cellData) {
      this.hotInstance.setDataAtCell(selection[0], selection[1], cellData);
      this.setInputBarValue(cellData);
    }
  };
  setInputBarValue(value) {
    this.setState({ inputBarValue: value });
  };
  getCellFromDataPicker(dataKey) {
    if (Array.isArray(dataKey)) {
      dataKey = dataKey[0];
    }
    dataKey = dataKey.trim().replace(/["']/gi, "");
    const firstHyphen = dataKey.indexOf('-');
    const dataPickerKey = dataKey.substring(0, firstHyphen);
    const cellKey = dataKey.substring(firstHyphen + 1, dataKey.length);

    const cell = this.refs.dataPicker.grids[dataPickerKey].dataPicker.cells[cellKey];
    return cell.vector;
  };
  render () {
    const docHeight = document.body.offsetHeight;
    const navHeight = this.bottomNav ? this.bottomNav.offsetHeight : null;
    const fontDrawerHeight = 400;
    const dataPickerSize = docHeight - navHeight;
    const spreadsheetWidth = document.body.offsetWidth - dataPickerSize;
    const spreadsheetHeight = docHeight - navHeight - fontDrawerHeight;
    return (
      <div className="application-container">
        <canvas className='memory-canvas' ref="memoryCanvas"/>
        {
          this.state.modelIsLoaded ?
            <div className="component-container">
                <DataPickers
                  width={ dataPickerSize || this.state.gridData.grid.columns * this.state.outputWidth }
                  height={ dataPickerSize || this.state.gridData.grid.rows * this.state.outputHeight }
                  outputWidth={ this.state.outputWidth }
                  outputHeight={ this.state.outputHeight }
                  drawFn={ this.drawFn }
                  decodeFn={ this.decodeFn }
                  onCellClick={ this.setSpreadsheetCellFromDataPicker }
                  ref='dataPicker'
                />
              <div className="right-container">
                <Spreadsheet
                  width={ spreadsheetWidth }
                  height={ spreadsheetHeight }
                  outputWidth={ this.state.outputWidth }
                  outputHeight={ this.state.outputHeight }
                  drawFn={ this.drawFn }
                  decodeFn={ this.decodeFn }
                  getCellFromDataPicker={ this.getCellFromDataPicker }
                  ref='spreadsheet'
                  model={ this.model }
                  setTableRef={ ref => {
                    this.hotInstance = ref.hotInstance;
                  }}
                  setFormulaParserRef={ parser => {
                    this.formulaParser = parser;
                  }}
                  inputBarValue={this.state.inputBarValue}
                  setInputBarValue={this.setInputBarValue}
                  afterRender={ forced => {
                    if (!forced) { return };
                    // console.log(this.refs.fontDrawer)
                    if (!this.refs.fontDrawer || !this.refs.fontDrawer.updateFontSamples || !this.hotInstance) { return; }
                    this.refs.fontDrawer.updateFontSamples();
                    const editor = this.hotInstance.getActiveEditor();
                    if (editor) {
                      editor.clearHighlightedReferences();
                      editor.highlightReferences(this.hotInstance);
                    }
                  }}
                />
                { this.hotInstance && this.formulaParser ?
                  <FontDrawer
                    height={fontDrawerHeight}
                    hotInstance={this.hotInstance}
                    formulaParser={this.formulaParser}
                    drawFn={this.drawFn}
                    decodeFn={this.decodeFn}
                    outputWidth={ this.state.outputWidth }
                    outputHeight={ this.state.outputHeight }
                    ref='fontDrawer'
                  /> : ""
                }
              </div>
            </div> :
            <div className="loader-container">
              <div className="loader"/>
              <span className="loading-message">Loading model ...</span>
            </div>
        }
        {/* <nav ref="bottomNav" className="bottom-nav">
          <button
            onClick={ e => {
              const dateString = formatDate(new Date());
              const cellData = JSON.stringify(this.hotInstance.getData());
              const mergedCellData = JSON.stringify(this.hotInstance.mergeCells.mergedCellInfoCollection);
              saveJSON(cellData, `fs-data-${dateString}`);
              saveJSON(mergedCellData, `fs-data-${dateString}-mergecells`);
            }}
          >SAVE</button>
        </nav> */}
      </div>
    );
  }
}
Application.propTypes = {};
