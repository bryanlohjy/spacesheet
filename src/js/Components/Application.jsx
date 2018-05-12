import React from 'react';
import PropTypes from 'prop-types';
import DataPicker from './DataPicker/DataPicker.jsx';
import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';

import FontModel from '../Models/FontModel.js';
import { getData, formatDate } from '../lib/helpers.js';

import { saveJSON } from './Application.js';

export default class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelIsLoaded: false,
      gridData: null,
      outputWidth: 0,
      outputHeight: 0,
    };
    this.setSpreadsheetCellFromDataPicker = this.setSpreadsheetCellFromDataPicker.bind(this);
    this.getCellFromDataPicker = this.getCellFromDataPicker.bind(this);
  };
  componentWillMount() {
    getData('./dist/data/DataPicker/font_grid_vectors_10x10_min.json').then(res => {
      this.setState({
        gridData: JSON.parse(res),
      });
    });
  };
  componentDidMount() { // Initialise model + load grid data for DataPicker
    this.bottomNav = this.refs.bottomNav;
    this.memoryCtx = this.refs.memoryCanvas.getContext('2d');
    new FontModel(model => {
      this.drawFn = (ctx, decodedData) => { // decoded vector => canvas rendering logic
        const memoryCtxData = this.memoryCtx.getImageData(0, 0, model.outputWidth, model.outputHeight);
        const memoryCtxDataLength = memoryCtxData.data.length;
        for (let i = 0; i < memoryCtxDataLength/4; i++) {
          const val = (1 - decodedData[i]) * 255;
          memoryCtxData.data[4*i] = val;    // RED (0-255)
          memoryCtxData.data[4*i+1] = val;    // GREEN (0-255)
          memoryCtxData.data[4*i+2] = val;    // BLUE (0-255)
          memoryCtxData.data[4*i+3] = decodedData[i] <= 0.05 ? 0 : 255;  // ALPHA (0-255)
        }
        this.memoryCtx.putImageData(memoryCtxData, 0, 0);
        ctx.clearRect(0, 0, model.outputWidth, model.outputHeight);
        ctx.drawImage(this.memoryCtx.canvas, 0, 0);
      };
      this.decodeFn = vector => { // vector to output
        return model.decode(vector, 0);
      };
      this.model = model;
      this.setState({
        modelIsLoaded: true,
        outputWidth: model.outputWidth,
        outputHeight: model.outputHeight,
      });
    });
  };
  setSpreadsheetCellFromDataPicker(vector, dataKey) {
    const data = this.getCellFromDataPicker(dataKey); // to do: move this step to cell renderer
    const selection = this.hotInstance.getSelected();
    if (selection) {
      const cellData = `=DATAPICKER('${dataKey}')`;
      this.hotInstance.setDataAtCell(selection[0], selection[1], cellData);
      this.refs.spreadsheet.inputBar.value = cellData;
    }
  };
  getCellFromDataPicker(dataKey) {
    const cell = this.refs.dataPicker.dataPicker.cells[dataKey];
    return cell.vector;
  };
  render () {
    const docHeight = document.body.offsetHeight;
    const navHeight = this.bottomNav ? this.bottomNav.offsetHeight : null;
    const dataPickerSize = docHeight - navHeight;
    const spreadsheetWidth = document.body.offsetWidth - dataPickerSize;
    const spreadsheetHeight = docHeight - navHeight;

    return (
      <div className="application-container">
        <canvas className='memory-canvas' ref="memoryCanvas"/>
        {
          this.state.modelIsLoaded && this.state.gridData ?
            <div className="spreadsheet-datapicker-container">
              <DataPicker
                width={ dataPickerSize || this.state.gridData.grid.columns * this.state.outputWidth }
                height={ dataPickerSize || this.state.gridData.grid.rows * this.state.outputHeight }
                outputWidth={ this.state.outputWidth }
                outputHeight={ this.state.outputHeight }
                drawFn={ this.drawFn }
                decodeFn={ this.decodeFn }
                gridData= { this.state.gridData }
                onChange={ this.setSpreadsheetCellFromDataPicker }
                ref='dataPicker'
              />
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
              />
            </div> :
            <div className="loader-container">
              <div className="loader"/>
              <span className="loading-message">Loading model ...</span>
            </div>
        }
        <nav ref="bottomNav" className="bottom-nav">
          <button
            onClick={ e => {
              const dateString = formatDate(new Date());
              const cellData = JSON.stringify(this.hotInstance.getData());
              const mergedCellData = JSON.stringify(this.hotInstance.mergeCells.mergedCellInfoCollection);
              saveJSON(cellData, `fs-data-${dateString}`);
              saveJSON(mergedCellData, `fs-data-${dateString}-mergecells`);
            }}
          >Save</button>
        </nav>
      </div>
    );
  }
}
Application.propTypes = {};
