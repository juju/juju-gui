/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../../generic-button/generic-button');
const Panel = require('../../panel/panel');
const SvgIcon = require('../../svg-icon/svg-icon');

class DeploymentPanel extends React.Component {
  /**
    Handle closing the panel when the close button is clicked.

    @method _handleClose
  */
  _handleClose() {
    this.props.sendAnalytics(
      'Button click',
      'Cancel deployment'
    );
    this.props.changeState({
      gui: {deploy: null},
      profile: null,
      special: {dd: null}
    });
  }

  /**
    Generate the header content based on the app state.
  */
  _generateHeader() {
    if (this.props.isDirectDeploy) {
      const classes = classNames(
        'deployment-panel__header',
        {'deployment-panel__header--dark': !this.props.loggedIn});
      return (
        <div className={classes}>
          <div className="deployment-panel__header-logo">
            <SvgIcon
              className="svg-icon"
              height="35"
              name={this.props.loggedIn ? 'juju-logo' : 'juju-logo-light'}
              width="90" />
          </div>
        </div>);
    } else {
      return (
        <div className="deployment-panel__header">
          <div className="deployment-panel__close">
            <GenericButton
              action={this._handleClose.bind(this)}
              type="neutral">
              Back to canvas
            </GenericButton>
          </div>
          <div className="deployment-panel__header-name">
            {this.props.title}
          </div>
        </div>);
    }
  }

  render() {
    return (
      <Panel
        instanceName="deployment-flow-panel"
        visible={true}>
        <div className="deployment-panel">
          {this._generateHeader()}
          <div className="deployment-panel__content">
            {this.props.children}
          </div>
        </div>
      </Panel>
    );
  }
};

DeploymentPanel.propTypes = {
  changeState: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  isDirectDeploy: PropTypes.bool,
  loggedIn: PropTypes.bool,
  sendAnalytics: PropTypes.func,
  title: PropTypes.string
};

module.exports = DeploymentPanel;
