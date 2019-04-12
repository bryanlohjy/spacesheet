import React from 'react';
import PropTypes from 'prop-types';
import SuperTreeview from 'react-super-treeview';
import classes from './BigGANClasses';

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
        <input type="text" placeholder="Search for a class..." className="class-tree-search"/>
        <SuperTreeview
          data={this.state.classes}
          onUpdateCb={updatedData => {
            this.setState({classes: updatedData})
          }}
          isExpandable={(node, depth) => {
            if (!node.children || node.children.length == 0) {
              return false;
            }
            return true;
          }}
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
