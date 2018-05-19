import React from 'react';
import PropTypes from 'prop-types';
import DataPickers from './DataPicker/DataPickers.jsx';
import Spreadsheet from './Spreadsheet/Spreadsheet.jsx';

import FontModel from '../Models/FontModel.js';
import { formatDate, map } from '../lib/helpers.js';

import { saveJSON } from './Application.js';

export default class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelIsLoaded: false,
      outputWidth: 0,
      outputHeight: 0,
    };
    this.setSpreadsheetCellFromDataPicker = this.setSpreadsheetCellFromDataPicker.bind(this);
    this.getCellFromDataPicker = this.getCellFromDataPicker.bind(this);
  };
  componentDidMount() { // Initialise model + load grid data for DataPicker
    this.bottomNav = this.refs.bottomNav;
    this.memoryCtx = this.refs.memoryCanvas.getContext('2d');
    new FontModel(model => {
      this.drawFn = (ctx, decodedData) => { // decoded vector => canvas rendering logic
        // COLORS
        // const rgb = decodedData.map(v => map(v, -0.25, 0.25, 0, 255));
        // const [ r, g, b ] = [ ...rgb ]
        // ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        // ctx.fillRect(0, 0, model.outputWidth, model.outputHeight);

        // 3 LINES
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

        // TWO COLORS
        // const rgb = decodedData.map(v => parseInt(map(v, -0.25, 0.25, 0, 255)));
        // const [ r1, g1, b1, r2, g2, b2, ] = [ ...rgb ]
        //
        // const rotate = map(decodedData[2], -0.25, 0.25, 0, 2);
        //
        // ctx.save();
        // ctx.fillStyle = `rgb(${r1}, ${g1}, ${b1})`;
        // ctx.fillRect(0, 0, model.outputWidth, model.outputHeight);
        // // ctx.fillStyle = `rgb(${r1}, ${g1}, ${b1})`;
        // // ctx.fillRect(0, 0, model.outputWidth/2, model.outputHeight);
        // // ctx.fillStyle = `rgb(${r2}, ${g2}, ${b2})`;
        // // ctx.fillRect(model.outputWidth/2, 0, model.outputWidth, model.outputHeight);
        // ctx.restore();


        // CONFETTI
        // const w = map(decodedData[0], -0.25, 0.25, 2, model.outputHeight - 10);
        // const h = map(decodedData[1], -0.25, 0.25, 2, model.outputHeight - 10);
        //
        // const rotate = map(decodedData[2], -0.25, 0.25, 0, 2);
        //
        // ctx.save();
        // ctx.translate(model.outputWidth/2, 0);
        // ctx.rotate(rotate);
        // const rgb = decodedData.map(v => parseInt(map(v, -0.25, 0.25, 0, 255)));
        // const [ r, g, b ] = [ ...rgb ]
        // ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        // ctx.fillRect(0, 0, w, h);
        // ctx.restore();
        //

        // context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

        // CONCENTRIC CIRCLES
        // const x = model.outputWidth / 2;
        // const y = model.outputHeight / 2;
        //
        // const numCircs = Math.floor(map(decodedData[0], -0.25, 0.25, 1, 5));
        // const rgb = decodedData.map(v => parseInt(map(v, -0.25, 0.25, 0, 255)));
        // const [ r, g, b ] = [ ...rgb ]
        //
        // for (let i = 0; i < numCircs; i++) {
        //   const rad = map(decodedData[0], -0.25, 0.25, 2, 25);
        //   ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
        //   ctx.beginPath();
        //   ctx.arc(x, y, rad / i,0,2*Math.PI);
        //   ctx.fill();
        //   ctx.strokeStyle = `rgba(${r - 20}, ${g - 20}, ${b - 20}, 1)`;
        //   ctx.stroke();
        // }
        // // CONSTELLATIONS
        const circle = (ctx, x, y, r) => {
          ctx.arc(x, y, r, 0, 2*Math.PI);
        }
        // const points = [];
        // // create points
        // ctx.fillStyle = `rgb(0, 0, 50)`;
        // ctx.fillRect(0, 0, model.outputWidth, model.outputHeight);
        // ctx.save();
        // decodedData.forEach((d, i) => {
        //   const pointIndex = Math.floor(i / 2);
        //   const val = map(d, -0.25, 0.25, 0, model.outputWidth);
        //   if (!points[pointIndex]) {
        //     points.push({ x: val, y: null });
        //   } else {
        //     points[pointIndex].y = val;
        //   }
        // });
        // // draw points
        // points.forEach((pt, i) => {
        //   ctx.beginPath();
        //   ctx.fillStyle = `rgba(255, 255, 255, 1)`;
        //   circle(ctx, pt.x, pt.y, 3);
        //   ctx.fill();
        // });
        // // draw lines between points
        // points.forEach((pt, i) => {
        //   const toIndex = (i + 1) % points.length;
        //   const to = points[toIndex];
        //   ctx.beginPath();
        //   ctx.lineWidth = 2;
        //   ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
        //   ctx.moveTo(pt.x, pt.y);
        //   ctx.lineTo(to.x, to.y);
        //   ctx.stroke();
        // });
        // ctx.restore();


        // PHOTO MANIP
        // ctx.save();
        // const brightness = map(decodedData[1], -0.25, 0.25, 100, 200);
        // const contrast = map(decodedData[2], -0.25, 0.25, 0, 200);
        // const saturate = map(decodedData[3], -0.25, 0.25, 0, 200);
        // const cssString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
        // ctx.filter = cssString;
        // const base_image = new Image();
        // base_image.src = 'dist/test_image.png';
        // ctx.drawImage(base_image, 0, 0, model.outputWidth, model.outputHeight);
        // ctx.restore();

        // calculate filter strings

        // FACES ?
        ctx.lineWidth = 0.5;
        ctx.clearRect(0, 0, model.outputWidth, model.outputHeight);

        ctx.fillStyle = 'rgba(255, 255, 0, 0.05)';
        ctx.fillRect(0, 0, model.outputWidth, model.outputHeight);
        ctx.strokeStyle = `rgba(180, 120, 10, 0.5)`;
        ctx.strokeRect(0, 0, model.outputWidth, model.outputHeight);
        ctx.save();
        // eyebrow
        const eyebrowBaseY = model.outputHeight / 3;

        const eyebrowLeftHeight = map(decodedData[0], -0.25, 0.25, eyebrowBaseY - 6, eyebrowBaseY + 4);
        const eyebrowRightHeight = map(decodedData[1], -0.25, 0.25, eyebrowBaseY - 6, eyebrowBaseY + 4);

        const eyeXLeft = (model.outputWidth / 6) * 2;
        const eyebrowAngle = map(decodedData[2], -0.25, 0.25, -3, 3);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';

        ctx.beginPath();
        ctx.moveTo(eyeXLeft - 6, eyebrowLeftHeight + eyebrowAngle);
        ctx.lineTo(eyeXLeft + 6, eyebrowLeftHeight - eyebrowAngle);
        ctx.stroke();

        const eyeXRight = (model.outputWidth / 6) * 4;
        ctx.beginPath();
        ctx.moveTo(eyeXRight - 6, eyebrowRightHeight - eyebrowAngle);
        ctx.lineTo(eyeXRight + 6, eyebrowRightHeight + eyebrowAngle);
        ctx.stroke();

        const eyeSize = Math.max(1, map(decodedData[3], -0.25, 0.25, 1, 5));
        // Left Eye
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(eyeXLeft + 2, eyebrowBaseY + 6, eyeSize, 0, 2*Math.PI);
        ctx.stroke();

        // Right Eye
        ctx.beginPath();
        ctx.arc(eyeXRight - 2, eyebrowBaseY + 6, eyeSize, 0, 2*Math.PI);
        ctx.stroke();

        // Mouth - comprised of 3 points
        const mouthYBase = model.outputHeight/2 + 8;
        const mouthHeight = map(decodedData[4], -0.25, 0.25, mouthYBase - 2, mouthYBase + 5);
        const mouthWidth = map(decodedData[5], -0.25, 0.25, model.outputWidth / 20, model.outputWidth / 3);

        const centerX = model.outputWidth / 2;
        const mouthAsymmetry = map(decodedData[6], -0.25, 0.25, -5, 5);

        const mouth1Y = mouthHeight + map(decodedData[7], -0.25, 0.25, -5, 5);
        const mouth2Y = mouthHeight + map(decodedData[8], -0.25, 0.25, -5, 5);
        const mouth3Y = mouthHeight + map(decodedData[9], -0.25, 0.25, -5, 5);

        const mouthPoints = [
          {
            x: centerX - mouthWidth / 2 + mouthAsymmetry,
            y: mouth1Y
          },
          {
            x: centerX + mouthAsymmetry,
            y: mouth2Y
          },
          {
            x: centerX + mouthWidth / 2 + mouthAsymmetry,
            y: mouth3Y
          },
        ];
        ctx.beginPath();
        ctx.lineCap = "round"
        for (let pointIndex = 0; pointIndex < mouthPoints.length; pointIndex++) {
          const point = mouthPoints[pointIndex];
          if (pointIndex === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        ctx.stroke();
        ctx.restore();
      };
      this.decodeFn = vector => { // vector to output
        return ([vector[0], vector[1], vector[2], vector[3], vector[4], vector[5], vector[6], vector[7], vector[8], vector[9]]);
      };
      this.model = model;
      this.setState({
        modelIsLoaded: true,
        outputWidth: model.outputWidth,
        outputHeight: model.outputHeight,
      });
    });
  };
  setSpreadsheetCellFromDataPicker(dataKey) {
    const selection = this.hotInstance.getSelected();
    const cellData = `=DATAPICKER('${dataKey}')`;
    this.hotInstance.setDataAtCell(selection[0], selection[1], cellData);
    this.refs.spreadsheet.inputBar.value = cellData;
  };
  getCellFromDataPicker(dataKey) {
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
    const dataPickerSize = docHeight - navHeight;
    const spreadsheetWidth = document.body.offsetWidth - dataPickerSize;
    const spreadsheetHeight = docHeight - navHeight;

    return (
      <div className="application-container">
        <canvas className='memory-canvas' ref="memoryCanvas"/>
        {
          this.state.modelIsLoaded ?
            <div className="spreadsheet-datapicker-container">
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
