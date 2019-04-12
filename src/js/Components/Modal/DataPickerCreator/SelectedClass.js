import React from 'react';
import PropTypes from 'prop-types';

export default class SelectedClass extends React.Component {
  render() {
    return (
      <div>
        Id: {this.props.id}
        Name: {this.props.name}
        Amount: {this.props.amount}
      </div>
    );
  }
}

SelectedClass.propTypes = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired
};
