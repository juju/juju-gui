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
    this.props.changeState({
      // we use fromAnyString here because juju core will set the bundleURL
      // to the legacy url format cs:bundle/wiki-simple-4 instead of the new
      // format wiki-simple/bundle/4.
      store: urls.URL.fromAnyString(this.props.bundleURL).path()
    });
  }

  /**
    Calls changeState to show the post deployment panel.
  */
  _showGetStarted() {
    this.props.changeState({
      // we use fromAnyString here because juju core will set the bundleURL
      // to the legacy url format cs:bundle/wiki-simple-4 instead of the new
      // format wiki-simple/bundle/4.
      postDeploymentPanel: urls.URL.fromAnyString(this.props.bundleURL).path()
    });
  }

  render() {
    // A bundleURL is in the format elasticsearch-cluster/bundle/17 unless it
    // has been imported from a local file then it'll be the file name without
    // the extension.
    let name = '';
    const bundleURL = this.props.bundleURL;

    try {
      const url = urls.URL.fromAnyString(bundleURL);
      name = url.name.replace('-', ' ');
    } catch (e) {
      // The bundleURL is probably a local file import.
      name = bundleURL;
    }

    return (
      <li className="inspector-view__label-item">
        <div className="inspector-view__label-name">{name}</div>
        <ul className="inspector-view__label-link-list">
          <li onClick={this._showReadme.bind(this)}>Bundle details</li>
          <li onClick={this._showGetStarted.bind(this)}>Get started</li>
        </ul>
      </li>
    );
  }
}

AddedServicesLabel.propTypes = {
  bundleURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired
};

module.exports = AddedServicesLabel;
