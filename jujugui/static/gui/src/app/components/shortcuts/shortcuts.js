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

YUI.add('shortcuts', function() {

  juju.components.Shortcuts = React.createClass({

    propTypes: {
      bindings: React.propTypes.array.isRequired,
      keybindings: React.propTypes.object.isRequired
    },

    /**

    @return {Array} An array of the bindings to create ul
    */
    _generateBindings: function() {
      let bindings = [];
      Object.keys(this.props.keybindings).forEach(k => {
        const v = this.props.keybindings[k];
        if (v.help && (v.condition === undefined ||
                       v.condition.call(this) === true)) {
          // TODO: translate keybindings to
          // human <Alt> m
          // <Control> <Shift> N (note caps)
          // also 'g then i' style
          bindings.push({key: k, label: v.label || k, help: v.help});
        }
      }, this);

      return bindings;
    },

    _generateList: function() {
      const bindings = this._generateBindings();

      const components = bindings.map((binding) => {
        return(
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
    },

    render: function() {
      return (
        <div>
          <div className="twelve-col no-margin-bottom">
            <h2 className="bordered">Keyboard Shortcuts</h2>
            <span className="close" tabIndex="0" role="button">
              <juju.components.SvgIcon name="close_16"
                size="16" />
            </span>
          </div>
          <div className="twelve-col">
            <div className="content">
              {this._generateList()}
            </div>
          </div>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'svg-icon'
]});
