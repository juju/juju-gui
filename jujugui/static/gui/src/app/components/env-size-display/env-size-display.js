/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

    getInitialState: function() {
      return {
        activeComponent: this.props.getAppState(
            'current', 'sectionB', 'component')
      };
    },

    /**
      Click handler for the service | machine links which calls the changeState
      event emitter with the clicked link.

      @method _changeEnvironmentView
      @param {Object} e The click event handler
    */
    _changeEnvironmentView: function(e) {
      var view = e.currentTarget.dataset.view;
      var component = (view === 'machine') ? 'machine' : null;
      var changeState = {
        sectionB: {
          component: component,
          metadata: {}
        }
      };
      this.props.changeState(changeState);
      this.setState({activeComponent: component});
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
      var active = false;
      if ((section === 'service') && !this.state.activeComponent) {
        active = true;
      } else if (section === this.state.activeComponent) {
        active = true;
      }
      return classNames(
        'tab',
        {
          active: active
        }
      );
    },

    render: function() {
      return (
        <div className="env-size-display">
          <ul>
              <li className={this._genClasses('service')}>
                  <a data-view="service" onClick={this._changeEnvironmentView}>
                    {this.props.serviceCount} services
                  </a>
              </li>
              <li className="spacer">|</li>
              <li className={this._genClasses('machine')}>
                  <a data-view="machine" onClick={this._changeEnvironmentView}>
                    {this.props.machineCount} machines
                  </a>
              </li>
          </ul>
        </div>
      );
    }
  });

}, '0.1.0', {requires: []});
