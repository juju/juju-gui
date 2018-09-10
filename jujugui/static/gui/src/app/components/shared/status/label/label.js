/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const classNames = require('classnames');

const { getStatusClass } = require('../../utils');

/** Status React component used to display Juju status. */
const StatusLabel = props => {
  const status = props.status;
  const classes = classNames(
    'status-label',
    getStatusClass('status-label--', status));
  return (
    <span className={classes}>
      {status}
    </span>
  );
};

StatusLabel.propTypes = {
  status: PropTypes.string.isRequired
};

module.exports = StatusLabel;
