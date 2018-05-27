import React from 'react';
import PropTypes from 'prop-types';
import { isFormula } from '../Spreadsheet/CellHelpers.js';

export default class FontDrawer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
    };
  };
  render() {
    return (
      <div
        className="font-drawer"
        style={{height: this.props.height}}
      >
        <input
          className="sample-font-input"
          type="text"
          value={this.state.inputValue}
          onChange={e => {
            this.setState({
              inputValue: e.target.value,
            });
          }}
        />
        <div className="font-samples">
          <FontSample
            inputValue={this.state.inputValue}
            hotInstance={this.props.hotInstance}
            formulaParser={this.props.formulaParser}
            drawFn={this.props.drawFn}
            decodeFn={this.props.decodeFn}
          />
          {/* <FontSample
            inputValue={this.state.inputValue}
          />
          <FontSample
            inputValue={this.state.inputValue}
          /> */}
        </div>
      </div>
    );
  };
}
FontDrawer.propTypes = {
  height: PropTypes.number,
  hotInstance: PropTypes.object,
  formulaParser: PropTypes.object,
  drawFn: PropTypes.func,
  decodeFn: PropTypes.func,
};

class FontSample extends React.Component {
  constructor(props) {
    super(props);
    this.ctx;
    this.updateCanvas = this.updateCanvas.bind(this);
    this.storeSelectedFont = this.storeSelectedFont.bind(this);
    this.state = { vector: [] };
  };
  componentDidMount() {
    const parentEl = this.refs.canvasEl.parentNode;
    const controls = this.refs.canvasEl.previousSibling;

    this.refs.canvasEl.width = parentEl.clientWidth - controls.clientWidth;
    this.ctx = this.refs.canvasEl.getContext('2d');
    this.updateCanvas();
  };
  componentWillReceiveProps(newProps) {
    if (newProps.inputValue !== this.props.inputValue) {
      setTimeout(() => {
        this.updateCanvas();
      }, 0);
    }
  };
  storeSelectedFont(e) {
    if (!this.props.hotInstance || !this.props.formulaParser) { return; }
    const selection = this.props.hotInstance.getSelected();
    const selectedVal = this.props.hotInstance.getDataAtCell(selection[0], selection[1]);

    if (!selectedVal || !selectedVal.trim() || !isFormula(selectedVal)) { return; }
    const result = this.props.formulaParser.parse(selectedVal.replace('=', '')).result;
    if (result && Array.isArray(result)) {
      this.setState({ vector: result }, () => {
        this.updateCanvas();
      });
    }
  };
  updateCanvas() {
    const vec = this.state.vector;
    if (vec.length <= 0) { return; }
    const canvas = this.ctx.canvas;
    const image = this.props.decodeFn(vec, 2);
    if (image) {
      this.props.drawFn(this.ctx, image);
    }
    // this.ctx.fillStyle = `rgb(${Math.random() * 255}, 100, 100)`;
    // this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    // this.ctx.fillText(this.props.inputValue, 10, 90);

  };
  render() {
    return (
      <div className="font-sample">
        <div className="font-sample-controls">
          <button
            onClick={ this.storeSelectedFont }
          >
            store
          </button>
        </div>
        <canvas
          ref="canvasEl"
          className="font-sample-canvas"
        />
      </div>
    );
  };
};
FontSample.propTypes = {
  inputValue: PropTypes.string,
  hotInstance: PropTypes.object,
  formulaParser: PropTypes.object,
  drawFn: PropTypes.func,
  decodeFn: PropTypes.func,
};
