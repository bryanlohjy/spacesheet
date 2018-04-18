import React from 'react';
import PropTypes from 'prop-types';
import onClickOutside from "react-onclickoutside";

class InputBar extends React.Component {
  constructor(props) {
    super(props);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  };
  handleClickOutside(e) {
    if (e.target && e.target.className.indexOf("fake-input") < 0) {
      this.props.closeFakeCell(e);
    }
  };
  render() {
    return (
      <input className="input-bar" type="text"
        ref={ el => {
          this.props.setInputRef(el);
        }}
        onChange={ e => {
          this.props.setFakeCellValue(e.target.value);
        }}
        onKeyDown={ e => {
          if (e.keyCode === 9) { // if tab is pressed
            e.preventDefault();
          }
          if (e.keyCode === 13 || e.keyCode === 27 || e.keyCode === 9) {
            this.props.closeFakeCell(e);
          }
        }}
        onClick={ e => {
          this.props.openFakeCell();
        }}
        style={{
          height: this.props.height || 21,
        }}
      />
    )
  }
}
InputBar.propTypes = {
  setInputRef: PropTypes.func,
  setInputValue: PropTypes.func,
  setFakeCellValue: PropTypes.func,
  openFakeCell: PropTypes.func,
  closeFakeCell: PropTypes.func,
};

class FakeCell extends React.Component {
  constructor(props) {
    super(props);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  };
  handleClickOutside(e) {
    // if (e.target && e.target.className.indexOf("fake-input") < 0) {
    //   this.props.closeFakeCell(e);
    // }
  };
  render() {
    return (<div
              contentEditable
              className="fake-input hidden"
              ref={ el => {
                this.props.setFakeCellRef(el);
              }}
              onKeyDown={ e => {
                e.persist();
                if (e.keyCode === 13 || e.keyCode === 27 || e.keyCode === 9) {
                  this.props.closeFakeCell(e);
                } else {
                  setTimeout(() => {
                    this.props.setInputValue(e.target.innerText);
                  }, 0);
                }
              }}
              tabIndex="-1"
            />
    )
  }
}
FakeCell.propTypes = {
  setFakeCellRef: PropTypes.func,
  setInputValue: PropTypes.func,
  setFakeCellValue: PropTypes.func,
  openFakeCell: PropTypes.func,
  closeFakeCell: PropTypes.func,
};

module.exports = {
  InputBar: onClickOutside(InputBar),
  FakeCell: onClickOutside(FakeCell),
};
