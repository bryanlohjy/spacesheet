import React from 'react';
import PropTypes from 'prop-types';

export default class ErrorsModal extends React.Component {
  constructor(props) {
    super(props);
  };
  render() {
    return (
      <div
        className="errors-modal-wrapper"
        onClick={ e => {
          this.props.handleClose();
        }}
      >
        <div className="modal" onClick={ e => {
          e.stopPropagation();
        }}>
          <h2>Errors</h2>
          { this.props.errors }

        </div>
      </div>
    )
  }
}
ErrorsModal.propTypes = {
  errors: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired,
};
