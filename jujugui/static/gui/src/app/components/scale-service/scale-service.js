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

YUI.add('scale-service', function() {

  juju.components.ScaleService = React.createClass({

    getInitialState: function() {
      return {
        constraintsVisibility: false
      };
    },

    _toggleConstraints: function(e) {
      var id = e.currentTarget.id;
      this.setState({ constraintsVisibility: id === 'auto-place-units'});
    },

    _generateClasses: function() {
      return classNames(
        'scale-service__constraints',
        {
          hidden: !this.state.constraintsVisibility
        }
      );
    },

    _resetScaleUp: function() {},

    _scaleUpService: function() {},

    render: function() {
      var buttons = [{
        title: 'Cancel',
        action: this._resetScaleUp
      }, {
        title: 'Confirm',
        action: this._scaleUpService
      }];

      return (
        <div className="scale-service">
          <div className="scale-service__units">
            <input type="text" name="num-units" />
            <span>units</span>
          </div>
          <div className="scale-service__selector">
            <div>
              <input
                name="placement" type="radio"
                onChange={this._toggleConstraints}
                id="auto-place-units" />
              <label htmlFor="auto-place-units">1 unit per machine</label>
            </div>
            <div>
              <input
                name="placement" type="radio"
                onChange={this._toggleConstraints}
                defaultChecked={true}
                id="manually-place-units" />
              <label htmlFor="manually-place-units">Manually place</label>
            </div>
          </div>
          <div className={this._generateClasses()}>
            <label htmlFor="cpu-constraint">CPU (GHZ)</label>
            <input type="text" id="cpu-constraint" />
            <label htmlFor="cores-constraint">Cores</label>
            <input type="text" id="cores-constraint" />
            <label htmlFor="ram-constraint">Ram (MB)</label>
            <input type="text" id="ram-constraint" />
            <label htmlFor="disk-constraint">Disk (MB)</label>
            <input type="text" id="disk-constraint" />
          </div>
          <juju.components.ButtonRow buttons={buttons} />
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row'
] });
