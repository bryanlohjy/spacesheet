import React from 'react';
import PropTypes from 'prop-types';

export default class Application extends React.Component {
  constructor(props) {
    super(props);
  };
  render () {
    return (
      <div className="section-container">
        Hey, hi, hello!
      </div>
    );
  }
}
Application.propTypes = {};
