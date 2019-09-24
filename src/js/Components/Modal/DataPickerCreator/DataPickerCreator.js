import React from 'react';
import PropTypes from 'prop-types';
import ClassTreeSelector from './ClassTreeSelector/ClassTreeSelector';
import SelectedClass from './SelectedClass';
import ClassCompositionBar from './ClassCompositionBar';
import trailMap from './trailMap.json';
import classTree from './tree.json';
import classIndicatorColors from './classIndicatorColors';

export default class DataPickerCreator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      classTree: [],
      selectedClasses: [
        /*
          { id, name, amount }
        */
      ]
    }
  }

  componentDidMount() {
    this.loadClasses();
  }

  loadClasses() {
    if (this.props.currentModel === 'BIGGAN') {
      /* TODO: ajax it */
      this.setState({
        classTree
      });
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
        amount: 1,
        bigGANClassIndex: _class.bigGANClassIndex
      }
    });

    selectedClasses = selectedClasses.concat(newClasses);

    this.setState({
      selectedClasses
    });
  }

  onClassAmountChange(id, amount) {
    let selectedClasses = this.state.selectedClasses.slice();

    selectedClasses = selectedClasses.map(_class => {
      if (_class.id === id) {
        _class.amount = Number(amount);
      }
      return Object.assign({}, _class);
    });

    this.setState({
      selectedClasses
    });
  }

  onRemoveSelectedClass(removedClassName) {
    let selectedClasses = this.state.selectedClasses.slice();

    selectedClasses = selectedClasses.filter(_class => {
      return _class.name !== removedClassName;
    });

    let classTree = JSON.parse(JSON.stringify(this.state.classTree));

    const treeTrail = trailMap[removedClassName.toUpperCase()];
    let pointer = classTree;
    treeTrail.forEach(trailId => {
      pointer = pointer.find(node => node.trailId === trailId).children;
    });

    let node = pointer.find(_class => _class.name === removedClassName);
    node.isChecked = false;

    this.setState({
      classTree,
      selectedClasses
    });
  }

  createDataPicker() {
    let label = new Array(1000).fill(0);
    this.state.selectedClasses.forEach(_class => {
      const { bigGANClassIndex, amount } = _class;
      label[bigGANClassIndex] = amount;
    });

    console.log(label);
  }

  render() {
    let modelName;

    if (this.props.currentModel === 'BIGGAN') {
      modelName = 'BigGAN';
    }

    return (
      <div className="datapicker-creator modal">
        <header className="title">DataPicker Creator</header>
        <section className="body">
          <div className="creator-section available">
            <header>Available classes</header>
            <section>
              <ClassTreeSelector
                currentModel={this.props.currentModel}
                onCheckToggle={this.onCheckToggle.bind(this)}
                classTree={this.state.classTree}
                onUpdateCb={updatedData => {
                  this.setState({classTree: updatedData})
                }}
              />
            </section>
          </div>

          <div className="creator-section selected">
            <header>Selected classes</header>
            <section>
            {
              this.state.selectedClasses.map((_class, i) => {
                const numClassColors = classIndicatorColors.length;
                const colorIndex = i%numClassColors;
                const indicatorColor = classIndicatorColors[colorIndex];

                return (
                  <SelectedClass
                    key={_class.id}
                    id={_class.id}
                    name={_class.name}
                    amount={_class.amount}
                    indicatorColor={indicatorColor}
                    onClassAmountChange={this.onClassAmountChange.bind(this)}
                    onRemoveSelectedClass={this.onRemoveSelectedClass.bind(this)}
                  />
                )
              })
            }
            </section>
          </div>

          <div className="creator-section creator">
            <header>Resulting class sample</header>
            <section>
              <div className="resulting-class">
                <div className="sample-image"/>
                <ClassCompositionBar
                  selectedClasses={this.state.selectedClasses}
                />
              </div>
              <div className="details">
                <header>Details</header>
                <section>
                  <div>
                    <label>Name</label>
                    <input type="text" placeholder="BigGAN DataPicker"/>
                  </div>
                </section>
              </div>
            </section>
          </div>

        </section>
        <footer className="footer">
          <button className="button" onClick={this.createDataPicker.bind(this)}>Create DataPicker</button>
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
