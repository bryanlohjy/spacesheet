import React from 'react';
import PropTypes from 'prop-types';

export default class DataPickerCreator extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="datapicker-creator modal">
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
}
DataPickerCreator.propTypes = {
  currentModel: PropTypes.string.isRequired,
  closeModal: PropTypes.func.isRequired
};
