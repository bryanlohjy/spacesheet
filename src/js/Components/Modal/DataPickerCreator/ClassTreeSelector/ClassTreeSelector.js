import React from 'react';
import PropTypes from 'prop-types';
import SuperTreeview from 'react-super-treeview';

export default class ClassTreeSelector extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="class-tree-selector">
        {/* TODO: search through tree */}
        <input type="text" placeholder="Search for a class..." className="class-tree-search"/>
        <SuperTreeview
          data={this.props.classTree}
          onUpdateCb={this.props.onUpdateCb}
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
          getStyleClassCb={(node, depth) => {
            return ` ${node.isChecked ? 'selected' : ''} `;
          }}
        />
      </div>
    )
  }
}

ClassTreeSelector.propTypes = {
  currentModel: PropTypes.string.isRequired,
  onCheckToggle: PropTypes.func.isRequired,
  onUpdateCb: PropTypes.func.isRequired,
  classTree: PropTypes.array.isRequired
};
