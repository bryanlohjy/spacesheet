import React from 'react';
import PropTypes from 'prop-types';
import SuperTreeview from 'react-super-treeview';
import classes from './tree.json';

console.log(classes)
export default class ClassTreeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: []
    };
  }

  componentDidMount() {
    this.loadClasses();
  }

  loadClasses() {
    if (this.props.currentModel === 'BIGGAN') {
      /* TODO: ajax it */
      this.setState({
        classes
      });
    }
  }

  render() {
    return (
      <div className="class-tree-selector">
        {/* TODO: search through tre <input type="text" placeholder="Search for a class..." className="class-tree-search"/> */}
        <SuperTreeview
          data={this.state.classes}
          onUpdateCb={updatedData => {
            console.log('update')
            this.setState({classes: updatedData})
          }}
          isExpandable={(node, depth) => {
            if (!node.children || node.children.length == 0) {
              return false;
            }
            return true;
          }}
          isCheckable={(node, depth) => {
            if (node.children.length > 0) {
              return false;
            }
            return true;
          }}
          transitionEnterTimeout={0}
          isDeletable={() => false}
          onCheckToggleCb={this.props.onCheckToggle}
        />
      </div>
    )
  }
}

ClassTreeSelector.propTypes = {
  currentModel: PropTypes.string.isRequired,
  onCheckToggle: PropTypes.func.isRequired,
};
