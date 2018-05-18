import React from 'react';
import PropTypes from 'prop-types';
import DataPickerCanvas from './DataPickerCanvas.js';

export default class DataPicker extends React.Component {
  constructor(props) {
    super(props);
    this.elementBounds = null;
    this.dragStart = null;
    this.dragged = null;
    this.mouseDownOnDataPicker = false;
    //
    this.state = {
      showHighlighter: false,
      highlighterColumn: 0,
      highlighterRow: 0,
      drawnWidth: 0,
      drawnHeight: 0,
    };

    this.initDataPicker = this.initDataPicker.bind(this);
    this.handleMouse = this.handleMouse.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.mouseToDataCoordinates = this.mouseToDataCoordinates.bind(this);
    this.handleZoomClick = this.handleZoomClick.bind(this);
  };
  componentDidMount() {
    this.initDataPicker();
    this.dataPicker.draw();
  };
  initDataPicker() {
    this.dataPicker = new DataPickerCanvas(
      this.refs.dataPickerCanvas.getContext('2d'),
      {
        gridData: this.props.data,
        outputWidth: this.props.outputWidth,
        outputHeight: this.props.outputHeight,
        drawFn: this.props.drawFn,
        decodeFn: this.props.decodeFn,
      }
    );
    this.props.onDataPickerInit(this.dataPicker);
  };
  mouseToDataCoordinates(mouseX, mouseY) {
    const dataPicker = this.dataPicker;
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
  handleMouseWheel(e) {
    e.preventDefault();
    const dataPicker = this.dataPicker;
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
    const dataPicker = this.dataPicker;
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
  handleMouse(e) {
    e.stopPropagation();
    const dataPicker = this.dataPicker;
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
          const image = dataPicker.cells[dataKey].image;
          if (this.props.onCellClick && this.mouseDownOnDataPicker) {
            this.mouseDownOnDataPicker = false;
            const dataPickerKey = `${this.props.dataPickerLabel}-${dataKey}`;
            this.props.onCellClick(dataPickerKey);
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
  render() {
    return (
      <div>
        <canvas
          ref='dataPickerCanvas'
          style={!this.props.visible ? { visibility: 'hidden', display: 'none' } : null}
          onMouseMove={ this.handleMouse }
          onMouseDown={ this.handleMouse }
          onMouseOut={ this.handleMouse }
          onMouseUp={ this.handleMouse }
          onWheel={ this.handleMouseWheel }
          width={this.props.width}
          height={this.props.height}
        />
        { this.state.showHighlighter ?
          <DataPickerHighlighter
            dataPicker={ this.dataPicker }
            highlighterColumn={ this.state.highlighterColumn }
            highlighterRow={ this.state.highlighterRow }
            drawnWidth={ this.state.drawnWidth }
            drawnHeight={ this.state.drawnHeight }
          /> : "" }
        { this.props.visible ?
          <ZoomButtons
            zoomIn={ () => {
              this.handleZoomClick(1);
            }}
            zoomOut={ () => {
              this.handleZoomClick(-1);
            }}
          />
          : ""
        }
      </div>
    )
  };
};
DataPicker.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  visible: PropTypes.bool,
  outputWidth: PropTypes.number.isRequired,
  outputHeight: PropTypes.number.isRequired,
  drawFn: PropTypes.func.isRequired,
  decodeFn: PropTypes.func.isRequired,
  data: PropTypes.object,
  dataPickerLabel: PropTypes.string,
  onCellClick: PropTypes.func,
  onDataPickerInit: PropTypes.func,
};

class ZoomButtons extends React.Component {
  constructor(props) {
    super(props);
  };
  render() {
    return (
      <div
        className="scale-buttons"
      >
        <span onClick={() => {
          this.props.zoomIn();
        }}>
        +
        </span>
        <span onClick={() => {
          this.props.zoomOut();
        }}>
          -
        </span>
      </div>
    );
  };
}
ZoomButtons.propTypes = {
  zoomIn: PropTypes.func,
  zoomOut: PropTypes.func,
  visible: PropTypes.bool,
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
