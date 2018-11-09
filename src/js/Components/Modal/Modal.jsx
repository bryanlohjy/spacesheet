import React from 'react';
import PropTypes from 'prop-types';

export default class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.onClose = this.onClose.bind(this);
  }

  onClose() {
    if (this.props.modalSection === 'MOBILE') { return; }
    this.props.setModalSection('');
  }

  render() {
    return (
      <div className={`modal-overlay ${this.props.modalSection ? 'visible' : ''}`}>
        {
          this.props.modalSection === 'MOBILE' &&
          <MobileModal/>
        }
        {
          this.props.modalSection === 'UNSUPPORTED' &&
          <UnsupportedModal
            closeModal={this.onClose}
          />
        }
      </div>
    )
  }
}
Modal.propTypes = {
  modalSection: PropTypes.string,
  setModalSection: PropTypes.func.isRequired,
};

class MobileModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="modal">
        <div className="title">Use a desktop computer</div>
        <div className="content">
          <p className="message">Mobile devices are not supported. Please use a desktop computer.<br/><br/>You can view videos of the SpaceSheet in action on the landing page.</p>
          <a href="http://vusd.github.io/spacesheet" className="button">
            Visit the landing page
          </a>
        </div>
      </div>
    )
  }
};
MobileModal.propTypes = {
};

class UnsupportedModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="modal">
        <div className="title">Use Google Chrome</div>
        <div className="content">
          <p className="message">The SpaceSheet is best experienced on Google Chrome at the moment.<br/><br/>Some functionality may not work on your browser.</p>
          <button className="button" onClick={this.props.closeModal}>Continue anyway</button>
        </div>
      </div>
    )
  }
};
UnsupportedModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
};
