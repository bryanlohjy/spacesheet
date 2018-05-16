import React from 'react';
import PropTypes from 'prop-types';
import DataPicker from './DataPicker/DataPicker.jsx';
import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';

import FontModel from '../Models/FontModel.js';
import { getData, formatDate, map } from '../lib/helpers.js';

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
    getData('./dist/data/DataPicker/datapicker-09.json').then(res => {
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
        // colors
        // const rgb = decodedData.map(v => map(v, -0.25, 0.25, 0, 255));
        // const [ r, g, b ] = [ ...rgb ]
        // ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        // ctx.fillRect(0, 0, model.outputWidth, model.outputHeight);

        // 3 lines
        // for (let i in decodedData) {
        //   const spacing = model.outputWidth / (decodedData.length + 1);
        //   const x = spacing * i + spacing;
        //   const height = map(decodedData[i], -0.25, 0.25, 2, model.outputHeight - 10);
        //   const y1 = (model.outputHeight - height) / 2;
        //   const y2 = y1 + height;
        //   const lineWidth = map(decodedData[i], -0.25, 0.25, 2, 10);
        //
        //   ctx.beginPath();
        //   ctx.moveTo(x, y1);
        //   ctx.lineTo(x, y2);
        //   ctx.lineWidth = lineWidth;
        //   ctx.strokeStyle = `rgba(0, 0, 0, ${1})`;
        //   ctx.stroke();
        // }
        // ctx.lineWidth = 1;
        // ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
        // ctx.strokeRect(0, 0, model.outputWidth, model.outputHeight);

        const w = map(decodedData[0], -0.25, 0.25, 2, model.outputHeight - 10);
        const h = map(decodedData[1], -0.25, 0.25, 2, model.outputHeight - 10);

        const rotate = map(decodedData[2], -0.25, 0.25, 0, 2);

        ctx.save();
        ctx.translate(model.outputWidth/2, 0);
        ctx.rotate(rotate);
        const rgb = decodedData.map(v => parseInt(map(v, -0.25, 0.25, 0, 255)));
        const [ r, g, b ] = [ ...rgb ]
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();

        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
        ctx.strokeRect(0, 0, model.outputWidth, model.outputHeight);
      };
      this.decodeFn = vector => { // vector to output
        return ([vector[0], vector[1], vector[2]])
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
          >SAVE</button>
        </nav>
      </div>
    );
  }
}
Application.propTypes = {};
