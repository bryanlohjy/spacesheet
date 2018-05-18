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
    this.loadGridData = this.loadGridData.bind(this);

    this.handleMouse = this.handleMouse.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.mouseToDataCoordinates = this.mouseToDataCoordinates.bind(this);
    this.handleZoomClick = this.handleZoomClick.bind(this);
    this.elementBounds = null;
    this.dragStart = null;
    this.dragged = null;
    this.mouseDownOnDataPicker = false;

    this.onSelectGrid = this.onSelectGrid.bind(this);

    this.state = { // used to manage highlighter
      showHighlighter: false,
      highlighterColumn: 0,
      highlighterRow: 0,
      drawnWidth: 0,
      drawnHeight: 0,
      gridData: null,
      selectedGrid: 'variety1',
    };
    this.grids = {
      variety1: {
        label: 'Variety 1',
        src: './dist/data/DataPicker/variety_1.json',
      },
      variety2: {
        label: 'Variety 2',
        src: './dist/data/DataPicker/variety_2.json',
      },
      family: {
        label: 'Family',
        src: './dist/data/DataPicker/family.json',
      },
      novelty: {
        label: 'Novelty',
        src: './dist/data/DataPicker/novelty.json',
      },
    };
  };
  componentDidMount() {
    this.loadGridData(() => {
      this.grids[this.state.selectedGrid].dataPicker.draw();
    });
  };
  loadGridData(loadedCallback) {
    const gridKeys = Object.keys(this.grids);
    const gridPromises = gridKeys.map(key => getData(this.grids[key].src));
    Promise.all(gridPromises).then(res => {
      for (let i = 0; i < res.length; i++) {
        const gridKey = gridKeys[i];
        const data = JSON.parse(res[i]);
        this.grids[gridKey].data = data;
        this.grids[gridKey].dataPicker = this.initDataPicker(data);
      }
      loadedCallback();
    });
  };
  initDataPicker(data) {
    const { rows, columns } = data.grid;
    this.refs.dataPickerCanvas.width =  this.props.width;
    this.refs.dataPickerCanvas.height = this.props.height;

    const el = this.refs.dataPickerCanvas;
    const dataPicker = new DataPickerCanvas(el.getContext('2d'), data, {
      outputWidth: this.props.outputWidth,
      outputHeight: this.props.outputHeight,
      drawFn: this.props.drawFn,
      decodeFn: this.props.decodeFn,
    });
    return dataPicker;
  };
  mouseToDataCoordinates(mouseX, mouseY) {
    const dataPicker = this.grids[this.state.selectedGrid].dataPicker;
    if (!dataPicker) { return; }
    const canvasEl = this.refs.dataPickerCanvas.getBoundingClientRect();
    mouseX -= canvasEl.left;
    mouseY -= canvasEl.top;

    // takes in mouse coords and returns row and col index
    let { a: scale, b, c, d, e: translateX, f: translateY } = dataPicker.ctx.getTransform();

    const el = this.refs.dataPickerCanvas;

    const drawnScaleX = el.clientWidth / (dataPicker.outputWidth * dataPicker.columns);
    const subdivisionWidth = dataPicker.outputWidth / dataPicker.subdivisions * scale * drawnScaleX;

    const column = Math.floor(((mouseX - translateX)) / subdivisionWidth);

    const drawnScaleY = el.clientHeight / (dataPicker.outputHeight * dataPicker.rows);
    const subdivisionHeight = dataPicker.outputHeight / dataPicker.subdivisions * scale * drawnScaleY;
    const row = Math.floor(((mouseY - translateY)) / subdivisionHeight);

    this.setState({
      drawnWidth: subdivisionWidth,
      drawnHeight: subdivisionHeight,
    });

    return { row, column };
  };
  handleMouse(e) {
    e.stopPropagation();
    const dataPicker = this.grids[this.state.selectedGrid].dataPicker;
    if (!dataPicker) { return; }
    switch (e.type) {
      case 'mousemove':
        if (this.dragStart) { // prevents mousemove from firing, if it hasn't moved at all - can sometimes be a problem
          const coords = dataPicker.ctx.transformedPoint(e.clientX, e.clientY);
          if (coords.x === this.dragStart.x && coords.y === this.dragStart.y) {
            return;
          }
        }
        dataPicker.originX = e.clientX;
        dataPicker.originY = e.clientY;
        this.dragged = true;
        let showHighlighter = false;

        if (this.dragStart) {
          const pt = dataPicker.ctx.transformedPoint(dataPicker.originX, dataPicker.originY);
          dataPicker.ctx.translate(pt.x-this.dragStart.x,pt.y-this.dragStart.y);
          dataPicker.draw();
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
        dataPicker.originX = e.clientX;
        dataPicker.originY = e.clientY;
        this.dragStart = dataPicker.ctx.transformedPoint(dataPicker.originX, dataPicker.originY);
        this.dragged = false;
        break;
      case 'mouseup':
        this.dragStart = null;
        if (this.state.showHighlighter) {
          const subdivisions = dataPicker.subdivisions;
          const totalRows = dataPicker.rows * subdivisions;
          const row = Math.floor(this.state.highlighterRow / subdivisions);
          const subrow = this.state.highlighterRow - (row * subdivisions);

          const totalColumns = dataPicker.columns * subdivisions;
          const column = Math.floor(this.state.highlighterColumn / subdivisions);
          const subcolumn = this.state.highlighterColumn - (column * subdivisions);

          const dataKey = `${subdivisions}-${column}-${row}-${subcolumn}-${subrow}`;
          const vector = dataPicker.cells[dataKey].vector;
          const image = dataPicker.cells[dataKey].image;
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
    const dataPicker = this.grids[this.state.selectedGrid].dataPicker;
    if (!dataPicker) { return; }
    const delta = e.deltaY;
    if (delta) {
      if (delta < 0) {
        dataPicker.zoom(1);
      } else {
        dataPicker.zoom(-1);
      }
      const { row, column } = this.mouseToDataCoordinates(e.clientX, e.clientY);
      this.setState({
        highlighterColumn: column,
        highlighterRow: row,
      });
    }
  };
  handleZoomClick(direction) {
    const dataPicker = this.grids[this.state.selectedGrid].dataPicker;
    if (!dataPicker) { return; }
    // zoom towards center
    const centerX = this.refs.dataPickerCanvas.width / 2;
    const centerY = this.refs.dataPickerCanvas.height / 2;
    dataPicker.originX = centerX;
    dataPicker.originY = centerY;

    dataPicker.zoom(direction)
    const { row, column } = this.mouseToDataCoordinates(centerX, centerY);

    this.setState({
      highlighterColumn: column,
      highlighterRow: row,
    });
  };
  onSelectGrid(gridName) {
    console.log(`Select ${gridName}`)
    this.setState({ selectedGrid: gridName });
  };
  render() {
    return (
      <div>
        <DataPickerSelector
          grids={this.grids}
          onSelectGrid={this.onSelectGrid}
          selectedGrid={this.state.selectedGrid}
        />
        <div className="datapicker-container">
          {
            this.state.gridData ?
            <div>
              { this.state.showHighlighter ?
                <DataPickerHighlighter
                  dataPicker={ this.grids[this.state.selectedGrid].dataPicker }
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

class DataPickerSelector extends React.Component {
  constructor(props) {
    super(props);
  };
  render() {
    return (
      <div className="datapicker-selector">
        <ul>
          {
            Object.keys(this.props.grids).map(key => {
              const label = this.props.grids[key].label;
              return (
                <li key={label}
                  onClick={() => {
                    this.props.onSelectGrid(key);
                  }}
                  className={`${key === this.props.selectedGrid ? 'active' : ''}`}
                >
                  {label}
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  };
}
DataPickerSelector.propTypes = {
  grids: PropTypes.object,
  onSelectGrid: PropTypes.func,
  selectedGrid: PropTypes.string,
};
