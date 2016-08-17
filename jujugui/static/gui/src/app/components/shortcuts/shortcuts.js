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

YUI.add('shortcuts', function() {

  /**
    Generate a list of bindings.

    @method _generateBindings
    @param {Array} bindings A list of bindings.
    @returns {Object} The binding components to display.
  */
  function _generateBindings(bindings) {
    var components = [];
    bindings.forEach((binding) => {
      components.push(
        <div key={binding.label}>
          <div className="two-col">
            {binding.label}
          </div>
          <div className="four-col last-col">
            {binding.help}
          </div>
        </div>);
    });
    return components;
  }

  var Shortcuts = function(props) {
    return (
      <div>
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Keyboard Shortcuts</h2>
          <span className="close" tabIndex="0" role="button">
            <juju.components.SvgIcon name="close_16"
              size="16" />
          </span>
        </div>
        <div className="six-col">
          <h3 className="bordered">Actions</h3>
          <div className="content">
            {_generateBindings(props.bindings)}
          </div>
        </div>
        <div className="six-col last-col">
          <h3 className="bordered">Custom GUI Settings</h3>
          <div className="content">
            <div className="two-col">
                <input type="checkbox" name="disable-cookie" id="disable-cookie"
                  defaultChecked={props.disableCookie} />
            </div>
            <div className="three-col last-col">
              <label htmlFor="disable-cookie">
                Disable the EU cookie warning.
              </label>
            </div>
            <div className="two-col">
              <input type="checkbox" name="force-containers"
                id="force-containers"
                defaultChecked={props.forceContainers} />
            </div>
            <div className="three-col last-col">
              <label htmlFor="force-containers">
                Enable container control for this provider.
              </label>
            </div>
            <div className="two-col">
              <input type="checkbox" name="disable-auto-place"
                id="disable-auto-place"
                defaultChecked={props.disableAutoPlace} />
            </div>
            <div className="three-col last-col">
              <label htmlFor="auto-place-default">
                Default to not automatically place units on commit.
              </label>
            </div>
            <div className="two-col">
              <input type="button" className="button" name="save-settings"
                id="save-settings" value="Save"/>
            </div>
            <div className="three-col last-col">
              NOTE: saving will reload the GUI so the settings take effect.
            </div>
          </div>
        </div>
      </div>
    );
  };

  Shortcuts.propTypes = {
    bindings: React.PropTypes.array.isRequired,
    disableAutoPlace: React.PropTypes.bool,
    disableCookie: React.PropTypes.bool,
    forceContainers: React.PropTypes.bool
  };

  juju.components.Shortcuts = Shortcuts;

}, '0.1.0', { requires: [
  'svg-icon'
]});
