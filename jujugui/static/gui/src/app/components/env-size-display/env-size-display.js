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

    _changeEnvironmentView: function(e) {
      var view = e.currentTarget.dataset.view
      var changeState = {
        sectionB: {
          component: (view === 'machine') ? 'machine' : null,
          metadata: {}
        }
      };
      this.props.changeState(changeState);
    },

    render: function() {
      return (
        <div className="env-size-display">
          <ul>
              <li className="tab services">
                  <a data-view="service" onClick={this._changeEnvironmentView}>
                    {this.props.serviceCount} services
                  </a>
              </li>
              <li className="spacer">|</li>
              <li className="tab machines">
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
