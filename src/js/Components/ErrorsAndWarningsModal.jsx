import React from 'react';
import PropTypes from 'prop-types';

export default class ErrorsAndWarningsModal extends React.Component {
  constructor(props) {
    super(props);
  };
  render() {
    return (
      <div className="errors-and-warnings">
        <div className="modal">
          Errors and Warnings
        </div>
      </div>
    )
  }
}
ErrorsAndWarningsModal.propTypes = {
  errors: PropTypes.object,
  warnings: PropTypes.object,
};
