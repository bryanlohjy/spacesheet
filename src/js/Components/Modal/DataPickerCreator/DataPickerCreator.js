import React from 'react';
import PropTypes from 'prop-types';
import ClassTreeSelector from './ClassTreeSelector/ClassTreeSelector';

export default class DataPickerCreator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedClasses: [
        { name: "", index: 0, amount: 0 }
      ]
    }
  }

  render() {
    let modelName;

    if (this.props.currentModel === 'BIGGAN') {
      modelName = 'BigGAN';
    }

    return (
      <div className="datapicker-creator modal">
        <header className="title">
          <span>DataPicker Creator:</span>
          <span className="subtitle">explore and combine {modelName} classes. Create a DataPicker from the resulting class</span>
        </header>
        <section className="body">
          <div className="creator-section available">
            <header>Available classes</header>
            <section>
              <ClassTreeSelector
                currentModel={this.props.currentModel}
              />
            </section>
          </div>

          <div className="creator-section selected">
            <header>Selected classes</header>
          </div>

          <div className="creator-section creator">
            <header>Resulting class</header>
          </div>

        </section>
        <footer className="footer">
          <button className="button">Create DataPicker</button>
        </footer>
        {/* <div className="title">Use a desktop computer</div>
        <div className="content">
          <p className="message">Mobile devices are not supported.<br/><br/>Please use a desktop computer, or view the SpaceSheet in action on the landing page.</p>
          <a href="http://vusd.github.io/spacesheet" className="button">
            Visit the landing page
          </a>
        </div> */}
      </div>
    )
  }
}
DataPickerCreator.propTypes = {
  currentModel: PropTypes.string.isRequired,
  closeModal: PropTypes.func.isRequired
};
