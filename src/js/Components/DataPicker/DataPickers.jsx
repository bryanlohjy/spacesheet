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
      selectedGrid: null,
    };
  }

  componentWillReceiveProps(newProps) {
    const grids = newProps.dataPickerGrids;
    if (!this.state.selectedGrid && grids) {
      const firstKey = Object.keys(grids)[0];
      this.setState({
        selectedGrid: firstKey
      });
    }
  }

  render() {
    const isBigGAN = this.props.currentModel == "BIGGAN";

    const selectorHeight = isBigGAN || (this.props.dataPickerGrids && Object.keys(this.props.dataPickerGrids).length > 1) ? 50 : 0;
    const multipleDataPickers = this.props.dataPickerGrids && Object.keys(this.props.dataPickerGrids).length > 1;

    return (
      <div>
        { multipleDataPickers || isBigGAN ?
            <DataPickerSelector
              dataPickerGrids={this.props.dataPickerGrids}
              onSelectGrid={gridName => {
                if (gridName !== this.state.selectedGrid) {
                  this.setState({ selectedGrid: gridName });
                }
              }}
              selectedGrid={this.state.selectedGrid}
              height={selectorHeight}
              enableCreation={isBigGAN}
            /> : ""
        }
        <div className="datapicker-container" ref="dataPickerContainer">
          { this.props.dataPickerGrids ?
              Object.keys(this.props.dataPickerGrids).map(key => {
                const visible = multipleDataPickers ? key === this.state.selectedGrid : true;

                return (
                  <DataPicker
                    key={key}
                    visible={visible}
                    data={this.props.dataPickerGrids[key].data}
                    dataPickerLabel={key}
                    model={this.props.model}
                    onDataPickerInit={ dataPickerObject => {
                      this.props.dataPickerGrids[key].dataPicker = dataPickerObject;
                    }}

                    onCellClick={ this.props.onCellClick }

                    windowWidth={this.props.windowWidth}
                    windowHeight={this.props.windowHeight}
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
  model: PropTypes.object,
  currentModel: PropTypes.string,
  onCellClick: PropTypes.func,
  dataPickerGrids: PropTypes.object,
  windowWidth: PropTypes.number,
  windowHeight: PropTypes.number
};

class DataPickerSelector extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const enableCreation = this.props.enableCreation;
    const dataPickers = this.props.dataPickerGrids;

    return (
      <div className="datapicker-selector" style={{ height: this.props.height }}>
        <ul className={`${!enableCreation ? "equal-spaced-tabs" : ""}`}>
          {
            dataPickers && Object.keys(dataPickers).map(key => {
              const label = dataPickers[key].label;
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
          {
            enableCreation &&
            <li
              className="datapicker-creator"
            >
              <span className="datapicker-creator-icon">+</span>
            </li>
          }
        </ul>
      </div>
    )
  }
}

DataPickerSelector.propTypes = {
  dataPickerGrids: PropTypes.object,
  onSelectGrid: PropTypes.func,
  selectedGrid: PropTypes.string,
  height: PropTypes.number,
  enableCreation: PropTypes.bool
};
