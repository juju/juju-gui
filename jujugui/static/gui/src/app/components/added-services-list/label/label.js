/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const AddedServicesLabel = props =>
  <li className="inspector-view__list-item" key={props.name}>{props.name}</li>;

AddedServicesLabel.propTypes = {
  name: PropTypes.string.isRequired
};

module.exports = AddedServicesLabel;
