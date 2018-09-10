/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const {urls} = require('jaaslib');

class AddedServicesLabel extends React.Component {

  /**
    Calls changeState to show the readme.
  */
  _showReadme() {
    this.props.changeState({store: this.props.bundleURL});
  }

  /**
    Calls changeState to show the post deployment panel.
  */
  _showGetStarted() {
    this.props.changeState({postDeploymentPanel: this.props.bundleURL});
  }

  render() {
    // A bundleURL is in the format elasticsearch-cluster/bundle/17
    const url = urls.URL.fromAnyString(this.props.bundleURL);
    const name = url.name.replace('-', ' ');
    return (
      <li className="inspector-view__label-item">
        <div className="inspector-view__label-name">{name}</div>
        <ul className="inspector-view__label-link-list">
          <li onClick={this._showReadme.bind(this)}>Bundle details</li>
          <li onClick={this._showGetStarted.bind(this)}>Get started</li>
        </ul>
      </li>);
  }
}

AddedServicesLabel.propTypes = {
  bundleURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired
};

module.exports = AddedServicesLabel;
