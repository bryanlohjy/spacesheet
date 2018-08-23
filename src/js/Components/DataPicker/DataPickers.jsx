import React from 'react';
import PropTypes from 'prop-types';

import * as dl from 'deeplearn';
import { getData } from '../../lib/helpers.js';
import { lerp, slerp } from '../../lib/tensorUtils.js';

import DataPicker from './DataPicker.jsx';

export default class DataPickers extends React.Component {
  constructor(props) {
    super(props);
    this.state = { // used to manage highlighter
      selectedGrid: 'V1',
    };
  };
  render() {
    const selectorHeight = this.props.dataPickerGrids && Object.keys(this.props.dataPickerGrids).length > 1 ? 48 : 0;
    const multipleDataPickers = this.props.dataPickerGrids && Object.keys(this.props.dataPickerGrids).length > 1;
    return (
      <div>
        { multipleDataPickers ?
            <DataPickerSelector
              dataPickerGrids={this.props.dataPickerGrids}
              onSelectGrid={gridName => {
                if (gridName !== this.state.selectedGrid) {
                  this.setState({ selectedGrid: gridName });
                }
              }}
              selectedGrid={this.state.selectedGrid}
              height={selectorHeight}
            /> : ""
        }
        <div className="datapicker-container" style={{ width: this.props.width, height: this.props.height - selectorHeight}}>
          { this.props.dataPickerGrids ?
              Object.keys(this.props.dataPickerGrids).map(key => {
                return (
                  <DataPicker
                    key={key}
                    visible={ multipleDataPickers ? key === this.state.selectedGrid : true }
                    width={this.props.width}
                    height={this.props.height - selectorHeight}
                    data={this.props.dataPickerGrids[key].data}
                    dataPickerLabel={key}
                    model={this.props.model}
                    onDataPickerInit={ dataPickerObject => {
                      this.props.dataPickerGrids[key].dataPicker = dataPickerObject;
                    }}
                    onCellClick={ this.props.onCellClick }
                  />
                )
              }) : ''
          }
        </div>
      </div>
    );
  }
}
DataPickers.propTypes = {
  model: PropTypes.object.isRequired,
  onCellClick: PropTypes.func,
  dataPickerGrids: PropTypes.object,
};

class DataPickerSelector extends React.Component {
  constructor(props) {
    super(props);
  };
  render() {
    return (
      <div className="datapicker-selector" style={{ height: this.props.height }}>
        <ul>
          {
            Object.keys(this.props.dataPickerGrids).map(key => {
              const label = this.props.dataPickerGrids[key].label;
              return (
                <li key={label}
                  onClick={() => {
                    this.props.onSelectGrid(key);
                  }}
                  className={`${key === this.props.selectedGrid ? 'active' : ''}`}
                >
                  <span>{label}</span>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  };
}
DataPickerSelector.propTypes = {
  dataPickerGrids: PropTypes.object,
  onSelectGrid: PropTypes.func,
  selectedGrid: PropTypes.string,
  height: PropTypes.number,
};
