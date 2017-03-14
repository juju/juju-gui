/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

YUI.add('settings', function() {

  var Settings = function(props) {
    return (
      <div>
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Custom GUI Settings</h2>
        <span className="close" tabIndex="0" role="button">
          <juju.components.SvgIcon name="close_16"
            size="16" />
        </span>
      </div>
      <div className="content">
        <p>
          <label htmlFor="disable-cookie">
            <input type="checkbox" name="disable-cookie" id="disable-cookie"
              defaultChecked={props.disableCookie} />&nbsp;
              Disable the EU cookie warning.
            </label>
          </p>
          <p>
            <label htmlFor="force-containers">
              <input type="checkbox" name="force-containers"
                id="force-containers"
                defaultChecked={props.forceContainers} />&nbsp;
                Enable container control for this provider.
              </label>
            </p>
            <p>
              <label htmlFor="disable-auto-place">
                <input type="checkbox" name="disable-auto-place"
                  id="disable-auto-place"
                  defaultChecked={props.disableAutoPlace} />&nbsp;
                  Default to not automatically place units on commit.
                </label>
              </p>
              <p>
                <small>
                  NOTE: You will need to reload for changes to take effect.
                </small>
              </p>
              <input type="button" className="button--positive"
                name="save-settings"
                id="save-settings" value="Save"/>
            </div>
          </div>
    );
  };

  Settings.propTypes = {
    disableAutoPlace: React.PropTypes.bool,
    disableCookie: React.PropTypes.bool,
    forceContainers: React.PropTypes.bool
  };

  juju.components.Settings = Settings;

}, '0.1.0', { requires: [
  'svg-icon'
]});
