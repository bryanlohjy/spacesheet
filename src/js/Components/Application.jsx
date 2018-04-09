import React from 'react';
import PropTypes from 'prop-types';
import DataPicker from './DataPicker/DataPicker.jsx';
import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';

import FontModel from '../Models/FontModel.js';
import { getData } from '../lib/helpers.js';

export default class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelIsLoaded: false,
      gridData: null,
      outputWidth: 0,
      outputHeight: 0,
    };
  };
  componentWillMount() {
    getData('./dist/data/DataPicker/font_grid_vectors_10x10_min.json').then(res => {
      this.setState({
        gridData: JSON.parse(res),
      });
    });
  };
  componentDidMount() { // Initialise model + load grid data for DataPicker
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
          memoryCtxData.data[4*i+3] = 255;  // ALPHA (0-255)
        }
        this.memoryCtx.putImageData(memoryCtxData, 0, 0);
        ctx.drawImage(this.memoryCtx.canvas, 0, 0);
      };
      this.decodeFn = vector => { // vector to output
        return model.decode(vector, 0);
      };

      this.setState({
        modelIsLoaded: true,
        outputWidth: model.outputWidth,
        outputHeight: model.outputHeight,
      });
    });
  };
  render () {
    const docHeight = document.body.clientHeight;
    const navHeight = 50;
    const spreadSheetWidth = document.body.clientWidth - (docHeight  - navHeight);
    return (
      <div className="application-container">
        <canvas className='memory-canvas' ref="memoryCanvas"/>
        {
          this.state.modelIsLoaded && this.state.gridData ?
            <div>
              <DataPicker
                width={ docHeight  - navHeight || this.state.gridData.grid.columns * this.state.outputWidth }
                height={ docHeight - navHeight || this.state.gridData.grid.rows * this.state.outputHeight }
                outputWidth={ this.state.outputWidth }
                outputHeight={ this.state.outputHeight }
                drawFn={ this.drawFn }
                decodeFn={ this.decodeFn }
                gridData= { this.state.gridData }
                onChange={ (vec) => {
                  console.log(vec)
                }}
              />
              <Spreadsheet
                width={ spreadSheetWidth }
                height={ docHeight - navHeight }
                outputWidth={ this.state.outputWidth }
                outputHeight={ this.state.outputHeight }
              />
            </div> : ''
        }
        <nav className="bottom-nav">
          <a href="">Releases</a>
        </nav>
      </div>
    );
  }
}
Application.propTypes = {};
