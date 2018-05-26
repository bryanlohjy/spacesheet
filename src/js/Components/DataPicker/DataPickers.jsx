import React from 'react';
import PropTypes from 'prop-types';

import * as dl from 'deeplearn';
import { getData } from '../../lib/helpers.js';
import { lerp, slerp } from '../../lib/tensorUtils.js';

import DataPicker from './DataPicker.jsx';

import V1 from '../../Data/variety_1.json';
import V2 from '../../Data/variety_2.json';
import STD from '../../Data/family.json';
import NOVEL from '../../Data/novelty.json';

export default class DataPickers extends React.Component {
  constructor(props) {
    super(props);
    this.state = { // used to manage highlighter
      selectedGrid: 'V1',
    };
    this.grids = {
      V1: {
        label: 'Variety 1',
        data: V1,
      },
      V2: {
        label: 'Variety 2',
        data: V2,
      },
      STD: {
        label: 'Standard',
        data: STD,
      },
      NOVEL: {
        label: 'Novel',
        data: NOVEL,
      },
    };
  };
  render() {
    const selectorHeight = 48;
    return (
      <div>
        <DataPickerSelector
          grids={this.grids}
          onSelectGrid={gridName => {
            if (gridName !== this.state.selectedGrid) {
              this.setState({ selectedGrid: gridName });
            }
          }}
          selectedGrid={this.state.selectedGrid}
          height={selectorHeight}
        />
        <div className="datapicker-container" style={{ width: this.props.width, height: this.props.height - selectorHeight}}>
          {
            Object.keys(this.grids).map(key => {
              return (
                <DataPicker
                  key={key}
                  visible={key === this.state.selectedGrid}
                  width={this.props.width}
                  height={this.props.height - selectorHeight}
                  data={this.grids[key].data}
                  dataPickerLabel={key}
                  outputWidth={this.props.outputWidth}
                  outputHeight={this.props.outputHeight}
                  drawFn={this.props.drawFn}
                  decodeFn={this.props.decodeFn}
                  onDataPickerInit={ dataPickerObject => {
                    this.grids[key].dataPicker = dataPickerObject;
                  }}
                  onCellClick={ this.props.onCellClick }
                />
              )
            })
          }
        </div>
      </div>
    );
  }
}
DataPickers.propTypes = {
  outputWidth: PropTypes.number.isRequired,
  outputHeight: PropTypes.number.isRequired,
  drawFn: PropTypes.func.isRequired,
  decodeFn: PropTypes.func.isRequired,
  onCellClick: PropTypes.func,
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
            Object.keys(this.props.grids).map(key => {
              const label = this.props.grids[key].label;
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
  grids: PropTypes.object,
  onSelectGrid: PropTypes.func,
  selectedGrid: PropTypes.string,
  height: PropTypes.number,
};
