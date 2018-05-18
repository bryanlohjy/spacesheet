import React from 'react';
import PropTypes from 'prop-types';

import * as dl from 'deeplearn';
import { getData } from '../../lib/helpers.js';
import { lerp, slerp } from '../../lib/tensorUtils.js';

import DataPicker from './DataPicker.jsx';

export default class DataPickers extends React.Component {
  constructor(props) {
    super(props);
    this.loadGridData = this.loadGridData.bind(this);

    this.state = { // used to manage highlighter
      loaded: false,
      selectedGrid: 'V1',
    };
    this.grids = {
      V1: {
        label: 'Variety 1',
        src: './dist/data/DataPicker/variety_1.json',
      },
      V2: {
        label: 'Variety 2',
        src: './dist/data/DataPicker/variety_2.json',
      },
      STD: {
        label: 'Standard',
        src: './dist/data/DataPicker/family.json',
      },
      NOVEL: {
        label: 'Novel',
        src: './dist/data/DataPicker/novelty.json',
      },
    };
  };
  componentWillMount() {
    this.loadGridData();
  };
  loadGridData(loadedCallback) {
    const gridKeys = Object.keys(this.grids);
    const gridPromises = gridKeys.map(key => getData(this.grids[key].src));
    Promise.all(gridPromises).then(res => {
      for (let i = 0; i < res.length; i++) {
        const gridKey = gridKeys[i];
        const data = JSON.parse(res[i]);
        this.grids[gridKey].data = data;
      }
      this.setState({ loaded: true });
    });
  };
  render() {
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
        />
        <div className="datapicker-container" style={{ width: this.props.width, height: this.props.height }}>
          { this.state.loaded ?
            Object.keys(this.grids).map(key => {
              return (
                <DataPicker
                  key={key}
                  visible={key === this.state.selectedGrid}
                  width={this.props.width}
                  height={this.props.height}
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
            }) : "Loading grids."
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
      <div className="datapicker-selector">
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
                  {label}
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
};
