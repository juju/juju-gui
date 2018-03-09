/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class EnvSizeDisplay extends React.Component {
  /**
    Click handler for the service | machine links which calls the changeState
    event emitter with the clicked link.

    @param {Object} e The click event handler
  */
  _changeEnvironmentView(e) {
    const view = e.currentTarget.dataset.view;
    this.props.appState.changeState({
      gui: {
        machines: view === 'machines' ? '' : null,
        status: view === 'status' ? '' : null
      }
    });
  }

  /**
    Returns the supplied classes with the 'active' class applied if the
    component is the one which is active.

    @param {String} section The section you want to check if it needs to be
      active.
    @returns {String} The collection of class names.
  */
  _genClasses(section) {
    const guiState = this.props.appState.current.gui;

    if (!guiState && section === 'application') {
      return 'env-size-display__list-item is-active';
    }

    return classNames(
      'env-size-display__list-item',
      {
        'is-active': guiState && guiState[section] !== undefined
      }
    );
  }

  /**
    Generates the status link if required.

    @returns {Object} The status markup.
  */
  _generateStatus() {
    return (
      <li className={this._genClasses('status')}>
        <a className="env-size-display__link"
          data-view="status"
          onClick={this._changeEnvironmentView.bind(this)}>
          status
        </a>
      </li>);
  }

  render() {
    var props = this.props;
    var serviceCount = props.serviceCount;
    var machineCount = props.machineCount;
    var pluralize = props.pluralize;
    return (
      <div className="env-size-display">
        <ul className="env-size-display__list">
          <li className={this._genClasses('application')}>
            <a className="env-size-display__link"
              data-view="application"
              onClick={this._changeEnvironmentView.bind(this)}>
              {serviceCount}&nbsp;
              {pluralize('application', serviceCount)}
            </a>
          </li>
          <li className={this._genClasses('machines')}>
            <a className="env-size-display__link"
              data-view="machines"
              onClick={this._changeEnvironmentView.bind(this)}>
              {machineCount}&nbsp;
              {pluralize('machine', machineCount)}
            </a>
          </li>
          {this._generateStatus()}
        </ul>
      </div>
    );
  }
};

EnvSizeDisplay.propTypes = {
  appState: PropTypes.object.isRequired,
  machineCount: PropTypes.number.isRequired,
  pluralize: PropTypes.func.isRequired,
  serviceCount: PropTypes.number.isRequired
};

module.exports = EnvSizeDisplay;
