import React from 'react';
import PropTypes from 'prop-types';

export default class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.onClose = this.onClose.bind(this);
  }

  onClose() {
    if (this.props.modalSection === 'MOBILE' || this.props.modalSection === 'LOADING') { return; }

    if (this.props.modalSection === 'UNSUPPORTED' && !this.props.model) {
      // display loading modal if user continues, and the model is not loaded
      this.props.setModalSection('LOADING');
    } else {
      this.props.setModalSection('');
    }
  }

  render() {
    return (
      <div
        className={`modal-overlay ${this.props.modalSection ? 'visible' : ''}`}
        onClick={this.onClose}
      >
        <div onClick={e => {
          e.stopPropagation();
        }}>
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
          {
            this.props.modalSection === 'INFO' &&
            <InfoModal
              closeModal={this.onClose}
              currentModel={this.props.currentModel}
            />
          }
          {
            this.props.modalSection === 'LOADING' &&
            <LoadingModal
              closeModal={this.onClose}
            />
          }
        </div>
      </div>
    )
  }
}
Modal.propTypes = {
  modalSection: PropTypes.string,
  currentModel: PropTypes.string.isRequired,
  setModalSection: PropTypes.func.isRequired,
  model: PropTypes.object
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
          <p className="message">Mobile devices are not supported.<br/><br/>Please use a desktop computer, or view the SpaceSheet in action on the landing page.</p>
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
          <p className="message">The SpaceSheet is best experienced on <a href="https://www.google.com/chrome/">Google Chrome</a> at the moment.<br/><br/>Some functionality may not work on your browser.</p>
          <button className="button" onClick={this.props.closeModal}>Continue anyway</button>
        </div>
      </div>
    )
  }
};
UnsupportedModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
};

class InfoModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let modelCredit;

    switch (this.props.currentModel) {
      case 'FACES':
        modelCredit = (
          <span>This SpaceSheet explores <a href="https://github.com/alantian/ganshowcase" target="_blank">alantian's GAN Showcase model.</a></span>
        );
        break;
      case 'FONTS':
        modelCredit = (
          <span>This SpaceSheet explores <a href="https://github.com/erikbern/deep-fonts" target="_blank">erikbern's deep-fonts model.</a></span>
        );
        break;
      case 'WORD2VEC':
        modelCredit = (
          <span>This SpaceSheet explores <a href="https://github.com/turbomaze/word2vecjson" target="_blank">turbomaze's port of the word2vec model.</a></span>
        );
        break;
      case 'MNIST':
        modelCredit = (
          <span>This SpaceSheet explores <a href="https://github.com/tayden/VAE-Latent-Space-Explorer" target="_blank">tayden's MNIST model.</a></span>
        );
        break;
      case 'COLOURS':
        modelCredit = (
          <span>This SpaceSheet explores a colour space. To explore neural models, check out the other SpaceSheets.</span>
        );
        break;
    }

    return (
      <div className="modal info">
        <div className="title">Info</div>
        <div className="content">
          <p className="message">
            Thanks for checking out the SpaceSheet.
            <span><br/><br/>
              {modelCredit}
            </span>
            <br/><br/>
            This is an ongoing project, and we welcome feedback.<br/>Get in touch at bryanlohjy@hotmail.com.
          </p>
          <a href="http://vusd.github.io/spacesheet" className="button">
            Visit the landing page
          </a>
        </div>
      </div>
    )
  }
};
InfoModal.propTypes = {
  currentModel: PropTypes.string.isRequired,
  closeModal: PropTypes.func.isRequired,
};

class LoadingModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="modal">
        <div className="title">
          <div className="lds-ring">
            <div/>
            <div/>
            <div/>
            <div/>
          </div>
          Loading model...
        </div>
        <div className="content">
          <p className="message">Welcome to the SpaceSheet!<br/><br/>Before we begin, a model has to be preloaded. These are large files and may take a couple of minutes.</p>
        </div>
      </div>
    )
  }
};
LoadingModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
};
