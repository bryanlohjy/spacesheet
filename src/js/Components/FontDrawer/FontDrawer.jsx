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
        <FontCanvas
          inputValue={this.state.inputValue}
        />
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
    console.log(parentEl)
    this.ctx = this.refs.canvasEl.getContext('2d');
    this.updateCanvas();
  };
  componentWillReceiveProps(newProps) {
    if (newProps.inputValue !== this.props.inputValue) {
      this.updateCanvas();
    }
  };
  updateCanvas() {
    this.ctx.fillStyle = `rgb(${Math.random() * 255}, 100, 100)`;
    this.ctx.fillRect(0, 0, 100, 100);
  };
  render() {
    return (
      <canvas
        ref="canvasEl"
        className="font-canvas"
        // width="100%"
        // height="100%"
      />
    );
  };
};
FontCanvas.propTypes = {
  inputValue: PropTypes.string,
};
