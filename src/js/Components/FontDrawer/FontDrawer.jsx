import React from 'react';
import PropTypes from 'prop-types';

export default class FontDrawer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
    };
  };
  shouldComponentUpdate(newProps, newState) {
    return newState.inputValue !== this.state.inputValue;
  };
  render() {
    console.log("RENDER")
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
        <div className="font-canvas-container">
          <FontCanvas
            inputValue={this.state.inputValue}
          />
          <FontCanvas
            inputValue={this.state.inputValue}
          />
          <FontCanvas
            inputValue={this.state.inputValue}
          />
        </div>
      </div>
    );
  };
}
FontDrawer.propTypes = {
  height: PropTypes.number,
};

class FontCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.ctx;
    this.updateCanvas = this.updateCanvas.bind(this);
  };
  componentDidMount() {
    const parentEl = this.refs.canvasEl.parentNode;
    console.log(parentEl.offsetWidth, parentEl.clientWidth, parentEl.getBoundingClientRect().width)
    this.refs.canvasEl.width = parentEl.clientWidth;
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
  updateCanvas() {
    const canvas = this.ctx.canvas;
    this.ctx.fillStyle = `rgb(${Math.random() * 255}, 100, 100)`;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillText(this.props.inputValue, 10, 90);
  };
  render() {
    return (
      <canvas
        ref="canvasEl"
        className="font-canvas"
      />
    );
  };
};
FontCanvas.propTypes = {
  inputValue: PropTypes.string,
};
