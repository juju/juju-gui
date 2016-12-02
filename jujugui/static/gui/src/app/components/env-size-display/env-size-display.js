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

YUI.add('env-size-display', function() {

  juju.components.EnvSizeDisplay = React.createClass({

    propTypes: {
      appState: React.PropTypes.object.isRequired,
      machineCount: React.PropTypes.number.isRequired,
      pluralize: React.PropTypes.func.isRequired,
      serviceCount: React.PropTypes.number.isRequired
    },

    /**
      Click handler for the service | machine links which calls the changeState
      event emitter with the clicked link.

      @method _changeEnvironmentView
      @param {Object} e The click event handler
    */
    _changeEnvironmentView: function(e) {
      const activeComponent =
        (e.currentTarget.dataset.view === 'machine') ? '' : null;
      this.props.appState.changeState({
        gui: {
          machines: activeComponent
        }
      });
      this.setState({activeComponent});
    },

    /**
      Returns the supplied classes with the 'active' class applied if the
      component is the one which is active.

      @method _generateClasses
      @param {String} section The section you want to check if it needs to be
        active.
      @returns {String} The collection of class names.
    */
    _genClasses: function(section) {
      const guiState = this.props.appState.current.gui;
      return classNames(
        'env-size-display__list-item',
        {
          'is-active': guiState && guiState[section]
        }
      );
    },

    render: function() {
      var props = this.props;
      var serviceCount = props.serviceCount;
      var machineCount = props.machineCount;
      var pluralize = props.pluralize;
      return (
        <div className="env-size-display">
          <ul className="env-size-display__list">
              <li className={this._genClasses('application')}>
                  <a data-view="application"
                    onClick={this._changeEnvironmentView}
                    className="env-size-display__link">
                    <juju.components.SvgIcon name="relations"
                      className="env-size-display__icon" size="16" />
                    {serviceCount}&nbsp;
                    {pluralize('application', serviceCount)}
                  </a>
              </li>
              <li className={this._genClasses('machine')}>
                  <a data-view="machine" onClick={this._changeEnvironmentView}
                    className="env-size-display__link">
                    <juju.components.SvgIcon name="changes-machine-created"
                      className="env-size-display__icon" size="16" />
                    {machineCount}&nbsp;
                    {pluralize('machine', machineCount)}
                  </a>
              </li>
          </ul>
        </div>
      );
    }
  });

}, '0.1.0', {requires: [
  'svg-icon'
]});
