/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

class EnvSizeDisplay extends React.Component {
  /**
    Click handler for the service | machine links which calls the changeState
    event emitter with the clicked link.

    @method _changeEnvironmentView
    @param {Object} e The click event handler
  */
  _changeEnvironmentView(e) {
    const view = e.currentTarget.dataset.view;
    this.props.appState.changeState({
      gui: {
        machines: view === 'machine' ? '' : null,
        status: view === 'status' ? '' : null
      }
    });
  }

  /**
    Returns the supplied classes with the 'active' class applied if the
    component is the one which is active.

    @method _generateClasses
    @param {String} section The section you want to check if it needs to be
      active.
    @returns {String} The collection of class names.
  */
  _genClasses(section) {
    const guiState = this.props.appState.current.gui;
    return classNames(
      'env-size-display__list-item',
      {
        'is-active': guiState && guiState[section]
      }
    );
  }

  /**
    Generates the status link if required.

    @returns {Object} The status markup.
  */
  _generateStatus() {
    if (!this.props.showStatus) {
      return;
    }
    return (
      <li className={this._genClasses('status')}>
        <a data-view="status"
          onClick={this._changeEnvironmentView.bind(this)}
          className="env-size-display__link">
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
            <a data-view="application"
              onClick={this._changeEnvironmentView.bind(this)}
              className="env-size-display__link">
              {serviceCount}&nbsp;
              {pluralize('application', serviceCount)}
            </a>
          </li>
          <li className={this._genClasses('machine')}>
            <a data-view="machine"
              onClick={this._changeEnvironmentView.bind(this)}
              className="env-size-display__link">
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
  serviceCount: PropTypes.number.isRequired,
  showStatus: PropTypes.bool
};

YUI.add('env-size-display', function() {
  juju.components.EnvSizeDisplay = EnvSizeDisplay;
}, '0.1.0', {requires: [
  'svg-icon'
]});
