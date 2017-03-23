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
      containerType: React.PropTypes.string,
      disabled: React.PropTypes.bool,
      hasUnit: React.PropTypes.bool,
      providerType: React.PropTypes.string,
      series: React.PropTypes.array,
      valuesChanged: React.PropTypes.func.isRequired
    },

    getDefaultProps: () => {
      return {disabled: false, hasUnit: false, providerType: '', series: []};
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
      const refs = this.refs;
      const defaultRef = {value: null};
      const arch = refs.archConstraintSelect || defaultRef;
      const cpu = refs.cpuConstraintInput || defaultRef;
      const cores = refs.coresConstraintInput || defaultRef;
      const mem = refs.memConstraintInput || defaultRef;
      const disk = refs.diskConstraintInput || defaultRef;
      const series = refs.seriesConstraintSelect || defaultRef;
      this.props.valuesChanged({
        'arch': arch.value,
        'cpu-power': cpu.value,
        cores: cores.value,
        mem: mem.value,
        'root-disk': disk.value,
        // Even if series are not technically a constraint in Juju, we include
        // them as part of constraints. When adding the machine the series is
        // extracted and handled separately in the API call.
        series: series.value
      });
    },

    render: function() {
      const props = this.props;
      const disabled = props.disabled;
      let series;
      // Only allow selecting a series if there is no unit already assigned.
      // If there is a unit, the machine must have the same series as the unit.
      if (!props.hasUnit && props.series.length) {
        // Generate a list of series options.
        const seriesOptions = props.series.map(ser => {
          return <option key={ser} value={ser}>{ser}</option>;
        });
        series = (
          <select
            className="constraints__select"
            ref="seriesConstraintSelect"
            disabled={disabled}
            key="seriesConstraintSelect"
            id="series-constraint"
            name="series-constraint"
            onChange={this._handleValueChanged}>
            <option key="default" value="">Optionally choose a series</option>
            {seriesOptions}
          </select>
        );
      }
      // Compose constraints fragments based on current provider type.
      // See <https://jujucharms.com/docs/2.0/reference-constraints>.
      const arch = (
        <select
          className="constraints__select"
          ref="archConstraintSelect"
          disabled={disabled}
          key="archConstraintSelect"
          id="arch-constraint"
          name="arch-constraint"
          onChange={this._handleValueChanged}>
          <option key="default" value="">
            Optionally choose an architecture
          </option>
          <option key="amd64" value="amd64">amd64</option>
          <option key="i386" value="i386">i386</option>
        </select>
      );
      const cpu = (
        <div key="cpu-constraint-div">
          <label htmlFor="cpu-constraint" className="constraints__label">
            CPU (GHZ)
          </label>
          <input type="text"
            className="constraints__input"
            disabled={disabled}
            id="cpu-constraint"
            name="cpu-constraint"
            onChange={this._handleValueChanged}
            ref="cpuConstraintInput"
          />
        </div>
      );
      const cores = (
        <div key="cores-constraint-div">
          <label htmlFor="cores-constraint" className="constraints__label">
            Cores
          </label>
          <input type="text"
            className="constraints__input"
            disabled={disabled}
            id="cores-constraint"
            name="cores-constraint"
            onChange={this._handleValueChanged}
            ref="coresConstraintInput"
          />
        </div>
      );
      const mem = (
        <div key="mem-constraint-div">
          <label htmlFor="mem-constraint" className="constraints__label">
            Ram (MB)
          </label>
          <input type="text"
            className="constraints__input"
            disabled={disabled}
            id="mem-constraint"
            name="mem-constraint"
            onChange={this._handleValueChanged}
            ref="memConstraintInput"
          />
        </div>
      );
      const disk = (
        <div key="disk-constraint-div">
          <label htmlFor="disk-constraint" className="constraints__label">
            Disk (MB)
          </label>
          <input type="text"
            className="constraints__input"
            disabled={disabled}
            id="disk-constraint"
            name="disk-constraint"
            onChange={this._handleValueChanged}
            ref="diskConstraintInput"
          />
        </div>
      );
      let parts = [arch, cpu, cores, mem, disk];
      if (props.containerType) {
        // This is a container machine.
        switch (props.containerType) {
          case 'kvm':
            parts = [cores, mem, disk];
            break;
          case 'lxc':
            parts = [];
            break;
          case 'lxd':
            parts = [];
            break;
        }
      } else {
        // This is a top level machine, constraints are supported based on the
        // current provider type.
        switch (props.providerType) {
          case 'azure':
            parts = [cores, mem, disk];
            break;
          case 'ec2':
            parts = [arch, cpu, cores, mem, disk];
            break;
          case 'gce':
            parts = [arch, cpu, cores, mem, disk];
            break;
          case 'joyent':
            parts = [arch, cores, mem, disk];
            break;
          case 'local':
            parts = [];
            break;
          case 'lxd':
            parts = [];
            break;
          case 'maas':
            parts = [cores, mem, disk];
            break;
          case 'manual':
            parts = [cores, mem, disk];
            break;
          case 'openstack':
            parts = [arch, cores, mem, disk];
            break;
          case 'vsphere':
            parts = [arch, cpu, cores, mem, disk];
            break;
        }
      }
      return (
        <div className="constraints">
          {series}
          {parts}
        </div>
      );
    }
  });

}, '0.1.0', { requires: [] });
