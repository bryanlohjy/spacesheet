import React from 'react';
import PropTypes from 'prop-types';

export default class SelectedClass extends React.Component {
  render() {
    return (
      <div className="selected-class">
        <div>Name: {this.props.name}</div>
        <div className="amount">
          <span>{this.props.amount.toFixed(1)*100}%</span>
          <input
            type="range"
            min={0}
            max={1}
            value={this.props.amount}
            step={0.1}
            onChange={(e) => {
              const id = this.props.id;
              this.props.onClassAmountChange(id, e.target.value);
            }}
          />
        </div>
      </div>
    );
  }
}

SelectedClass.propTypes = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  onClassAmountChange: PropTypes.func.isRequired
};
