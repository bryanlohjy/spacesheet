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
      <div>
        <SuperTreeview
          data={this.state.classes}
          onUpdateCb={updatedData => {
            console.log(updatedData)
            // this.setState({data: updatedData})
          }}
        />
      </div>
    )
  }
}

ClassTreeSelector.propTypes = {
  currentModel: PropTypes.string.isRequired
};
