import React from 'react';
import PropTypes from 'prop-types';
import { isFormula } from '../Spreadsheet/CellHelpers.js';
import { charToDecodeIndex } from './FontDrawerHelpers.js';
import { arraysAreSimilar } from '../../lib/helpers.js';

export default class FontDrawer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: 'handgloves',
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
          autoComplete={false}
        />
        <div className="font-samples">
          <FontSample
            inputValue={this.state.inputValue}
            hotInstance={this.props.hotInstance}
            formulaParser={this.props.formulaParser}
            drawFn={this.props.drawFn}
            decodeFn={this.props.decodeFn}
            outputWidth={ this.props.outputWidth }
            outputHeight={ this.props.outputHeight }
          />
          <FontSample
            inputValue={this.state.inputValue}
            hotInstance={this.props.hotInstance}
            formulaParser={this.props.formulaParser}
            drawFn={this.props.drawFn}
            decodeFn={this.props.decodeFn}
            outputWidth={ this.props.outputWidth }
            outputHeight={ this.props.outputHeight }
          />
          <FontSample
            inputValue={this.state.inputValue}
            hotInstance={this.props.hotInstance}
            formulaParser={this.props.formulaParser}
            drawFn={this.props.drawFn}
            decodeFn={this.props.decodeFn}
            outputWidth={ this.props.outputWidth }
            outputHeight={ this.props.outputHeight }
          />
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
  outputWidth: PropTypes.number,
  outputHeight: PropTypes.number,
};

class FontSample extends React.Component {
  constructor(props) {
    super(props);
    this.ctx;
    this.updateCanvas = this.updateCanvas.bind(this);
    this.storeSelectedFont = this.storeSelectedFont.bind(this);
    this.state = { vector: [] };

    this.decodedImages = {};
  };
  componentDidMount() {
    const parentEl = this.refs.canvasEl.parentNode;
    const controls = this.refs.canvasEl.previousSibling;

    this.refs.canvasEl.width = parentEl.clientWidth - controls.clientWidth;
    this.refs.canvasEl.height = controls.clientHeight;

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
    if (result && result.length === 40) {
      if (!arraysAreSimilar(result, this.state.vector)) {
        this.setState({ vector: result }, () => {
          this.updateCanvas();
        });
        console.log('set')
        this.decodedImages = {};
      }
    }
  };
  updateCanvas() {
    const vec = this.state.vector;
    if (vec.length <= 0) { return; }

    const canvas = this.ctx.canvas;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sampleString = this.props.inputValue;
    if (sampleString && sampleString.length > 0) {
      const charsToDraw = sampleString.split('');
      for (let charIndex = 0; charIndex < charsToDraw.length; charIndex++) {
        const char = sampleString[charIndex];
        const decodeIndex = charToDecodeIndex(char);
        if (decodeIndex > -1) {
          this.ctx.save();
          this.ctx.scale(0.5, 0.5);
          let image;
          if (this.decodedImages[decodeIndex]) { // decode only if it hasn't before
            image = this.decodedImages[decodeIndex];
          } else {
            image = this.props.decodeFn(vec, decodeIndex);
            this.decodedImages[decodeIndex] = image;
          }
          this.ctx.translate(this.props.outputWidth * charIndex, 0);
          this.props.drawFn(this.ctx, image);
          this.ctx.restore();
        }
      }
    }
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
  outputWidth: PropTypes.number,
  outputHeight: PropTypes.number,
};
