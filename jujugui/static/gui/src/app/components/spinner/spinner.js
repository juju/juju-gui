/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

require('./_spinner.scss');

class Spinner extends React.PureComponent {
  render() {
    return (
      <div className="spinner-container">
        <div className="spinner-loading">Loading...</div>
      </div>
    );
  }
};

module.exports = Spinner;
