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
      isLoaded: false,
    };

    this.initDataPicker = this.initDataPicker.bind(this);
    this.handleMouse = this.handleMouse.bind(this);
    this.handleMouseWheel = this.handleMouseWheel.bind(this);
    this.mouseToDataCoordinates = this.mouseToDataCoordinates.bind(this);
    this.handleZoomClick = this.handleZoomClick.bind(this);
    this.resetZoom = this.resetZoom.bind(this);
  };
  componentDidMount() {
    this.initDataPicker();
    if (this.props.visible) {
      const container = this.refs.container;

      const greaterLength = Math.max(container.clientWidth, container.clientHeight);

      this.dataPicker.width = greaterLength;
      this.dataPicker.height= greaterLength;

      this.dataPicker.ctx.canvas.width = greaterLength;
      this.dataPicker.ctx.canvas.height= greaterLength;

      this.dataPicker.updateTransform();
      this.dataPicker.draw();
    }
  };
  componentWillReceiveProps(newProps) {
    const visiblityChanged = !this.props.visible && newProps.visible;
    const windowResized = newProps.windowWidth != this.props.windowWidth || newProps.windowHeight != this.props.windowHeight;

    if (newProps.visible && (visiblityChanged || windowResized)) {
      if (windowResized) {
        const container = this.refs.container;
        console.log(container)
        const greaterLength = Math.max(container.clientWidth, container.clientHeight);

        this.dataPicker.width = greaterLength;
        this.dataPicker.height= greaterLength;

        this.dataPicker.ctx.canvas.width = greaterLength;
        this.dataPicker.ctx.canvas.height= greaterLength;

        this.dataPicker.updateTransform();
        console.log(container.clientWidth, container.clientHeight, this.dataPicker)
      }
      this.dataPicker.draw();
    }
  };
  initDataPicker() {
    this.dataPicker = new DataPickerCanvas(
      this.refs.dataPickerCanvas.getContext('2d'),
      {
        gridData: this.props.data,
        model: this.props.model,
      }
    );
    this.props.onDataPickerInit(this.dataPicker);
    this.setState({ isLoaded: true })
  };
  mouseToDataCoordinates(mouseX, mouseY) {
    const dataPicker = this.dataPicker;
    if (!dataPicker) { return; }
    const canvasEl = this.refs.dataPickerCanvas.getBoundingClientRect();
    mouseX -= canvasEl.left;
    mouseY -= canvasEl.top;

    // takes in mouse coords and returns row and col index
    let { a: scale, b, c, d, e: translateX, f: translateY } = dataPicker.ctx.getTransform();

    const drawnScaleX = dataPicker.width / (dataPicker.outputWidth * dataPicker.columns);
    const subdivisionWidth = dataPicker.outputWidth / dataPicker.subdivisions * scale * drawnScaleX;

    const column = Math.floor(((mouseX - translateX)) / subdivisionWidth);

    const drawnScaleY = dataPicker.height / (dataPicker.outputHeight * dataPicker.rows);
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
  resetZoom() {
    const dataPicker = this.dataPicker;
    if (!dataPicker) { return; }
    // zoom towards center
    dataPicker.resetZoom();
    const centerX = this.refs.dataPickerCanvas.width / 2;
    const centerY = this.refs.dataPickerCanvas.height / 2;
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
    console.log('update canvas')
    return (
      <div ref="container">
        <canvas
          ref='dataPickerCanvas'
          style={!this.props.visible ? { visibility: 'hidden', display: 'none' } : null}
          onMouseMove={ this.handleMouse }
          onMouseDown={ this.handleMouse }
          onMouseOut={ this.handleMouse }
          onMouseUp={ this.handleMouse }
          onWheel={ this.handleMouseWheel }
          // width={this.props.width}
          // height={this.props.height}
        />
        { this.state.showHighlighter ?
          <DataPickerHighlighter
            dataPicker={ this.dataPicker }
            highlighterColumn={ this.state.highlighterColumn }
            highlighterRow={ this.state.highlighterRow }
            drawnWidth={ this.state.drawnWidth }
            drawnHeight={ this.state.drawnHeight }
          /> : "" }
        { this.props.visible && this.state.isLoaded ?
          <div className="datapicker-ui">
            <MiniMap
              width={this.props.width}
              height={this.props.height}
              viewportWidth={Math.floor(this.props.width / this.dataPicker.scale)}
              viewportHeight={Math.floor(this.props.height / this.dataPicker.scale)}
              viewportX={Math.floor(-this.dataPicker.translateX / this.dataPicker.scale)}
              viewportY={Math.floor(-this.dataPicker.translateY / this.dataPicker.scale)}
              displayScale={Math.round(this.dataPicker.scale * 100)}
            />
            <ZoomButtons
              zoomIn={() => {
                this.handleZoomClick(1);
              }}
              zoomOut={() => {
                this.handleZoomClick(-1);
              }}
              resetZoom={this.resetZoom}
            />
          </div>
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
  model: PropTypes.object,
  data: PropTypes.object,
  dataPickerLabel: PropTypes.string,
  onCellClick: PropTypes.func,
  onDataPickerInit: PropTypes.func,

  windowWidth: PropTypes.number,
  windowHeight: PropTypes.number
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
        <span onClick={() => {
          this.props.resetZoom();
        }}>
        100%
        </span>
      </div>
    );
  };
}
ZoomButtons.propTypes = {
  zoomIn: PropTypes.func,
  zoomOut: PropTypes.func,
  resetZoom: PropTypes.func,
};

class MiniMap extends React.Component {
  constructor(props) {
    super(props);
    this.drawScale = 1/10;
  };
  render() {
    return (
      <div className="datapicker-minimap">
        <div
          className="whole"
          style={{
            width: this.props.width * this.drawScale,
            height: this.props.height * this.drawScale,
          }}
        >
          <span>{this.props.displayScale}%</span>
          <div
            className="window"
            style={{
              width: this.props.viewportWidth * this.drawScale,
              height: this.props.viewportHeight * this.drawScale,
              left: this.props.viewportX * this.drawScale,
              top: this.props.viewportY * this.drawScale,
            }}
          />
        </div>
      </div>
    );
  }
}

MiniMap.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  viewportWidth: PropTypes.number,
  viewportHeight: PropTypes.number,
  viewportX: PropTypes.number,
  viewportY: PropTypes.number,
  displayScale: PropTypes.number,
};

class DataPickerHighlighter extends React.Component {
  constructor(props) {
    super(props);
    this.computeStyle = this.computeStyle.bind(this);
  };
  computeStyle() {
    const { a, b, c, d, e: translateX, f: translateY } = this.props.dataPicker.ctx.getTransform();
    const top = `${translateY + this.props.highlighterRow * this.props.drawnHeight}px`;
    const left = `${translateX + this.props.highlighterColumn * this.props.drawnWidth}px`;
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
