// import React from 'react';
// import PropTypes from 'prop-types';
// import DataPickerCanvas from './DataPickerCanvas.js';
import React from 'react';
import PropTypes from 'prop-types';

import * as dl from 'deeplearn';
import { getData } from '../../lib/helpers.js';
import { lerp, slerp } from '../../lib/tensorUtils.js';
import DataPickerCanvas from './DataPickerCanvas.js';

export default class DataPicker extends React.Component {
  constructor(props) {
    super(props);

    this.initDataPicker = this.initDataPicker.bind(this);

    this.handleMouse = this.handleMouse.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.mouseToDataCoordinates = this.mouseToDataCoordinates.bind(this);
    this.handleZoomClick = this.handleZoomClick.bind(this);
    this.elementBounds = null;
    this.dragStart = null;
    this.dragged = null;
    this.mouseDownOnDataPicker = false;

    this.state = { // used to manage highlighter
      showHighlighter: false,
      highlighterColumn: 0,
      highlighterRow: 0,
      drawnWidth: 0,
      drawnHeight: 0,
      gridData: null,
    };
  };
  componentWillMount() {
    getData('./dist/data/DataPicker/datapicker-09.json').then(res => {
      this.setState({
        gridData: JSON.parse(res),
      });
      this.initDataPicker();
    });
  };
  initDataPicker() {
    const { rows, columns } = this.state.gridData.grid;
    this.refs.dataPickerCanvas.width =  this.props.width;
    this.refs.dataPickerCanvas.height = this.props.height;

    const el = this.refs.dataPickerCanvas;
    this.dataPicker = new DataPickerCanvas(el.getContext('2d'), this.state.gridData, {
      outputWidth: this.props.outputWidth,
      outputHeight: this.props.outputHeight,
      drawFn: this.props.drawFn,
      decodeFn: this.props.decodeFn,
    });
    this.dataPicker.draw();
  };
  mouseToDataCoordinates(mouseX, mouseY) {
    // takes in mouse coords and returns row and col index
    let { a: scale, b, c, d, e: translateX, f: translateY } = this.dataPicker.ctx.getTransform();

    const el = this.refs.dataPickerCanvas;

    const drawnScaleX = el.clientWidth / (this.dataPicker.outputWidth * this.dataPicker.columns);
    const subdivisionWidth = this.dataPicker.outputWidth / this.dataPicker.subdivisions * scale * drawnScaleX;
    const column = Math.floor(((mouseX - translateX)) / subdivisionWidth);

    const drawnScaleY = el.clientHeight / (this.dataPicker.outputHeight * this.dataPicker.rows);
    const subdivisionHeight = this.dataPicker.outputHeight / this.dataPicker.subdivisions * scale * drawnScaleY;
    const row = Math.floor(((mouseY - translateY)) / subdivisionHeight);

    this.setState({
      drawnWidth: subdivisionWidth,
      drawnHeight: subdivisionHeight,
    });

    return { row, column };
  };
  handleMouse(e) {
    e.stopPropagation();
    if (!this.dataPicker) {
      return;
    }
    switch (e.type) {
      case 'mousemove':
        if (this.dragStart) { // prevents mousemove from firing, if it hasn't moved at all - can sometimes be a problem
          const coords = this.dataPicker.ctx.transformedPoint(e.clientX, e.clientY);
          if (coords.x === this.dragStart.x && coords.y === this.dragStart.y) {
            return;
          }
        }
        this.dataPicker.originX = e.clientX;
        this.dataPicker.originY = e.clientY;
        this.dragged = true;
        let showHighlighter = false;

        if (this.dragStart) {
          const pt = this.dataPicker.ctx.transformedPoint(this.dataPicker.originX, this.dataPicker.originY);
          this.dataPicker.ctx.translate(pt.x-this.dragStart.x,pt.y-this.dragStart.y);
          this.dataPicker.draw();
        } else {
          showHighlighter = true;
        }

        const { row, column } = this.mouseToDataCoordinates(e.clientX, e.clientY);
        this.setState({
          highlighterColumn: column,
          highlighterRow: row,
          showHighlighter: showHighlighter,
        });
        break;
      case 'mousedown':
        e.preventDefault();
        this.mouseDownOnDataPicker = true;
        this.dataPicker.originX = e.clientX;
        this.dataPicker.originY = e.clientY;
        this.dragStart = this.dataPicker.ctx.transformedPoint(this.dataPicker.originX, this.dataPicker.originY);
        this.dragged = false;
        break;
      case 'mouseup':
        this.dragStart = null;
        if (this.state.showHighlighter) {
          const subdivisions = this.dataPicker.subdivisions;
          const totalRows = this.dataPicker.rows * subdivisions;
          const row = Math.floor(this.state.highlighterRow / subdivisions);
          const subrow = this.state.highlighterRow - (row * subdivisions);

          const totalColumns = this.dataPicker.columns * subdivisions;
          const column = Math.floor(this.state.highlighterColumn / subdivisions);
          const subcolumn = this.state.highlighterColumn - (column * subdivisions);

          const dataKey = `${subdivisions}-${column}-${row}-${subcolumn}-${subrow}`;
          const vector = this.dataPicker.cells[dataKey].vector;
          const image = this.dataPicker.cells[dataKey].image;
          if (this.props.onChange && this.mouseDownOnDataPicker) {
            this.mouseDownOnDataPicker = false;
            this.props.onChange(vector, dataKey);
          }
        }
        break;
      case 'mouseout':
        this.dragStart = null;
        this.setState({
          highlighterColumn: 0,
          highlighterRow: 0,
          showHighlighter: false,
        });
        break;
    }
  };
  handleMouseWheel(e) {
    e.preventDefault();
    if (!this.dataPicker) {
      return;
    }
    const delta = e.deltaY;
    if (delta) {
      if (delta < 0) {
        this.dataPicker.zoom(1);
      } else {
        this.dataPicker.zoom(-1);
      }
      const { row, column } = this.mouseToDataCoordinates(e.clientX, e.clientY);
      this.setState({
        highlighterColumn: column,
        highlighterRow: row,
      });
    }
  };
  handleZoomClick(direction) {
    if (!this.dataPicker) {
      return;
    }
    // zoom towards center
    const centerX = this.refs.dataPickerCanvas.width / 2;
    const centerY = this.refs.dataPickerCanvas.height / 2;
    this.dataPicker.originX = centerX;
    this.dataPicker.originY = centerY;

    this.dataPicker.zoom(direction)
    const { row, column } = this.mouseToDataCoordinates(centerX, centerY);

    this.setState({
      highlighterColumn: column,
      highlighterRow: row,
    });
  };
  shouldComponentUpdate(newProps, newState) {
    const showHighlighter = newState.showHighlighter !== this.state.showHighlighter;
    const highlighterColumn = newState.highlighterColumn !== this.state.highlighterColumn;
    const highlighterRow = newState.highlighterRow !== this.state.highlighterRow;
    const drawnWidth = newState.drawnWidth !== this.state.drawnWidth;
    const drawnHeight = newState.drawnHeight !== this.state.drawnHeight;
    if (showHighlighter || highlighterColumn || highlighterRow || drawnWidth || drawnHeight) {
      return true;
    }
    return false;
  };
  render() {
    return (
      <div className="datapicker-container">
        {
          this.state.gridData ?
            <div>
              { this.state.showHighlighter ?
                <DataPickerHighlighter
                  dataPicker={ this.dataPicker }
                  highlighterColumn={ this.state.highlighterColumn }
                  highlighterRow={ this.state.highlighterRow }
                  drawnWidth={ this.state.drawnWidth }
                  drawnHeight={ this.state.drawnHeight }
                /> : "" }
              <div className="scale-buttons">
                <span onClick={() => {
                  this.handleZoomClick(1);
                }}>
                  +
                </span>
                <span onClick={() => {
                  this.handleZoomClick(-1);
                }}>
                -
              </span>
            </div>
          </div> : ''
        }
        <canvas
          ref='dataPickerCanvas'
          onMouseMove={ this.handleMouse }
          onMouseDown={ this.handleMouse }
          onMouseOut={ this.handleMouse }
          onMouseUp={ this.handleMouse }
          onWheel={ this.handleMouseWheel }
          width={ this.props.width }
          height={ this.props.height }
        />
      </div>
    );
  }
}
DataPicker.propTypes = {
  outputWidth: PropTypes.number.isRequired,
  outputHeight: PropTypes.number.isRequired,
  drawFn: PropTypes.func.isRequired,
  decodeFn: PropTypes.func.isRequired,
  gridData: PropTypes.object,
  isColorTest: PropTypes.bool,
  onChange: PropTypes.func,
};


class DataPickerHighlighter extends React.Component {
  constructor(props) {
    super(props);
    this.computeStyle = this.computeStyle.bind(this);
  };
  computeStyle() {
    const { a, b, c, d, e: translateX, f: translateY } = this.props.dataPicker.ctx.getTransform();
    const top = `${translateY + this.props.highlighterRow * this.props.drawnWidth}px`;
    const left = `${translateX + this.props.highlighterColumn * this.props.drawnHeight}px`;
    const width = `${this.props.drawnWidth}px`;
    const height = `${this.props.drawnHeight}px`;

    return { top, left, width, height, };
  };
  shouldComponentUpdate(nextProps, nextState) {
    const newColumn = nextProps.highlighterColumn !== this.props.highlighterColumn;
    const newRow = nextProps.highlighterRow !== this.props.highlighterRow;
    const newDrawnWidth = nextProps.drawnWidth !== this.props.drawnWidth;
    const newDrawnHeight = nextProps.drawnHeight !== this.props.drawnHeight;

    return newColumn || newRow || newDrawnWidth || newDrawnHeight;
  };
  render() {
    return (
      <div
        className='highlighter'
        ref='highlighter'
        style={ this.computeStyle() }
      />
    )
  }
}
DataPickerHighlighter.propTypes = {
  dataPicker: PropTypes.object,
  highlighterColumn: PropTypes.number,
  highlighterRow: PropTypes.number,
  drawnWidth: PropTypes.number,
  drawnHeight: PropTypes.number,
};
