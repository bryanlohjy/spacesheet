import React from 'react';
import PropTypes from 'prop-types';
import DataPicker from './DataPicker/DataPicker.jsx';
import FontModel from '../Models/FontModel.js';

export default class Application extends React.Component {
  constructor(props) {
    super(props);
    this.model = new FontModel(() => {
      console.log(this.model);
    });
  };
  render () {
    return (
      <div className="section-container">
        <DataPicker
          width={ 400 }
          height={ 400 }
        />
      </div>
    );
  }
}
Application.propTypes = {};
