import React from 'react';
import PropTypes from 'prop-types';
import ClassTreeSelector from './ClassTreeSelector/ClassTreeSelector';
import SelectedClass from './SelectedClass';

export default class DataPickerCreator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedClasses: [
      /*
        { id, name, amount }
      */
      ]
    }
  }

  onCheckToggle(nodes, depth) {
    let selectedClasses = this.state.selectedClasses.slice();

    let changes = {};
    nodes.forEach(node => {
      changes[node.id] = node;
    });

    selectedClasses = selectedClasses.filter(_class => {
      const existingChange = changes[_class.id];
      let removeExisting = existingChange && !existingChange.isChecked;

      if (existingChange) {
        delete changes[_class.id];
      }

      if (removeExisting) {
        return false;
      }

      return true;
    });

    const newClasses = Object.keys(changes).map(id => {
      const _class = changes[id];
      return {
        id: _class.id,
        name: _class.name,
        amount: 1
      }
    });

    selectedClasses = selectedClasses.concat(newClasses);

    this.setState({
      selectedClasses
    });
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
                onCheckToggle={this.onCheckToggle.bind(this)}
              />
            </section>
          </div>

          <div className="creator-section selected">
            <header>Selected classes</header>
            <section>
            {
              this.state.selectedClasses.map((_class, i) => {
                return (
                  <SelectedClass
                    key={_class.id}
                    id={_class.id}
                    name={_class.name}
                    amount={_class.amount}
                  />
                )
              })
            }
            </section>
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
