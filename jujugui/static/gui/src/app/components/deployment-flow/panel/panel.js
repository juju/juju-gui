/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

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
            <juju.components.SvgIcon
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
            <juju.components.GenericButton
              action={this._handleClose.bind(this)}
              type="neutral">
              Back to canvas
            </juju.components.GenericButton>
          </div>
          <div className="deployment-panel__header-name">
            {this.props.title}
          </div>
        </div>);
    }
  }

  render() {
    return (
      <juju.components.Panel
        instanceName="deployment-flow-panel"
        visible={true}>
        <div className="deployment-panel">
          {this._generateHeader()}
          <div className="deployment-panel__content">
            {this.props.children}
          </div>
        </div>
      </juju.components.Panel>
    );
  }
};

DeploymentPanel.propTypes = {
  changeState: React.PropTypes.func.isRequired,
  children: React.PropTypes.oneOfType([
    React.PropTypes.object,
    React.PropTypes.array
  ]),
  isDirectDeploy: React.PropTypes.bool,
  loggedIn: React.PropTypes.bool,
  sendAnalytics: React.PropTypes.func,
  title: React.PropTypes.string
};

YUI.add('deployment-panel', function() {
  juju.components.DeploymentPanel = DeploymentPanel;
}, '0.1.0', {
  requires: [
    'generic-button',
    'panel-component'
  ]
});
