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

YUI.add('constraints', function() {

  juju.components.Constraints = React.createClass({
    propTypes: {
      valuesChanged: React.PropTypes.func.isRequired
    },

    /**
      Called when the component is first mounted.

      @method componentDidMount
    */
    componentDidMount: function () {
      // Pass the parent the initial data.
      this._handleValueChanged();
    },

    /**
      Call the parent method with the new values of the constraints.

      @method _handleValueChanged
    */
    _handleValueChanged: function() {
      var refs = this.refs;
      this.props.valuesChanged({
        cpu: refs.cpuConstraintInput.value,
        cores: refs.coresConstraintInput.value,
        mem: refs.memConstraintInput.value,
        disk: refs.diskConstraintInput.value
      });
    },

    render: function() {
      return (
        <div className="constraints">
          <label htmlFor="cpu-constraint"
            className="constraints__label">
            CPU (GHZ)
          </label>
          <input type="text"
            className="constraints__input"
            id="cpu-constraint"
            name="cpu-constraint"
            onChange={this._handleValueChanged}
            ref="cpuConstraintInput"/>
          <label htmlFor="cores-constraint"
            className="constraints__label">
            Cores
          </label>
          <input type="text"
            className="constraints__input"
            id="cores-constraint"
            name="cores-constraint"
            onChange={this._handleValueChanged}
            ref="coresConstraintInput"/>
          <label htmlFor="mem-constraint"
            className="constraints__label">
            Ram (MB)
          </label>
          <input type="text"
            className="constraints__input"
            id="mem-constraint"
            name="mem-constraint"
            onChange={this._handleValueChanged}
            ref="memConstraintInput"/>
          <label htmlFor="disk-constraint"
            className="constraints__label">
            Disk (MB)
          </label>
          <input type="text"
            className="constraints__input"
            id="disk-constraint"
            name="disk-constraint"
            onChange={this._handleValueChanged}
            ref="diskConstraintInput"/>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [] });
