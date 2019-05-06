import React from 'react';
import PropTypes from 'prop-types';
import { MdClear } from 'react-icons/md';

export default class SelectedClass extends React.Component {
  render() {
    return (
      <div className="selected-class">
        <div className="indicator" style={{background: this.props.indicatorColor}}/>
        <div className="name" title={this.props.name}>{this.props.name}</div>
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
              this.props.onClassAmountChange(id, Math.max(e.target.value, 0.1));
            }}
          />
        </div>
        <div
          className='delete-button'
          onClick={() => {
            this.props.onRemoveSelectedClass(this.props.name);
          }
        }>
          <MdClear/>
        </div>
      </div>
    );
  }
}

SelectedClass.propTypes = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  indicatorColor: PropTypes.string.isRequired,
  onClassAmountChange: PropTypes.func.isRequired,
  onRemoveSelectedClass: PropTypes.func.isRequired
};
