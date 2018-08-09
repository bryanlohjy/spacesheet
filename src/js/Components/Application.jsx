import React from 'react';
import PropTypes from 'prop-types';

import ModelLoader from '../lib/ModelLoader.js';
// import ModelToLoad from '../Models/MNISTModel.js';
import ModelToLoad from '../Models/FontModel.js';1

import GenerateDataPicker from '../lib/DataPickerGenerator.js';
import DataPickerGrids from './DataPickerGrids/FontModel/FontDataPickers.js';

import ErrorsModal from './ErrorsModal.jsx';
import DataPickers from './DataPicker/DataPickers.jsx';

import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';
import FontDrawer from './FontDrawer/FontDrawer.jsx';

// import { formatDate } from '../lib/helpers.js';
// import { saveJSON } from './Application.js';

export default class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelIsLoaded: false,
      model: null,
      loadErrors: null,
      inputBarValue: "",
      dataPickerGrids: false,
    };
    this.setSpreadsheetCellFromDataPicker = this.setSpreadsheetCellFromDataPicker.bind(this);
    this.getCellFromDataPicker = this.getCellFromDataPicker.bind(this);
    this.setInputBarValue = this.setInputBarValue.bind(this);
  };
  componentDidMount() { // Initialise model + load grid data for DataPicker
    this.bottomNav = this.refs.bottomNav;
    this.memoryCtx = this.refs.memoryCanvas.getContext('2d'); // used to store and render drawings

    const loader = new ModelLoader(this, ModelToLoad);
    loader.load(res => {
      if (!res.errors) {
        let dataPickerGrids;
        try {
          dataPickerGrids = DataPickerGrids;
        } catch (e) {
          dataPickerGrids = GenerateDataPicker(10, 10, 'DATAPICKER', res.model);
        }
        this.setState({
          model: res.model,
          modelIsLoaded: true,
          dataPickerGrids: dataPickerGrids,
        });
      } else {
        this.setState({
          loadErrors: res.errors,
        });
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
    const cell = this.state.dataPickerGrids[dataPickerKey].dataPicker.cells[cellKey];
    return cell.vector;
  };
  render() {
    const docHeight = document.body.offsetHeight;
    const navHeight = this.bottomNav ? this.bottomNav.offsetHeight : null;
    const dataPickerSize = docHeight - navHeight;
    const spreadsheetWidth = document.body.offsetWidth - dataPickerSize;
    const spreadsheetHeight = docHeight - navHeight;
    return (
      <div className="application-container">
        <canvas className='memory-canvas' ref="memoryCanvas"/>
        {
          this.state.loadErrors ?
            <ErrorsModal
              errors={this.state.loadErrors}
            /> : ''
        }
        {
          this.state.modelIsLoaded && this.state.model && this.state.dataPickerGrids ?
            <div className="component-container">
              <DataPickers
                width={ dataPickerSize || this.state.gridData.grid.columns * this.state.model.outputWidth }
                height={ dataPickerSize || this.state.gridData.grid.rows * this.state.model.outputHeight }
                model={ this.state.model }
                dataPickerGrids={this.state.dataPickerGrids}
                onCellClick={ this.setSpreadsheetCellFromDataPicker }
                ref='dataPickers'
              />
              <div className="right-container">
                <Spreadsheet
                  width={ spreadsheetWidth }
                  height={ spreadsheetHeight }
                  getCellFromDataPicker={ this.getCellFromDataPicker }
                  ref='spreadsheet'
                  model={ this.state.model }
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
                    if (!this.refs.fontDrawer || !this.refs.fontDrawer.updateFontSamples || !this.hotInstance) { return; }
                    this.refs.fontDrawer.updateFontSamples();
                    const editor = this.hotInstance.getActiveEditor();
                    if (editor) {
                      editor.clearHighlightedReferences();
                      editor.highlightReferences(this.hotInstance);
                    }
                  }}
                />
                { this.hotInstance && this.formulaParser && this.state.model.constructor.name === "FontModel"?
                  <FontDrawer
                    hotInstance={this.hotInstance}
                    formulaParser={this.formulaParser}
                    model={this.state.model}
                    ref='fontDrawer'
                  />
                  : ""
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
