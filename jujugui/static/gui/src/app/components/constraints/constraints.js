/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class Constraints extends React.Component {
  /**
    Called when the component is first mounted.

    @method componentDidMount
  */
  componentDidMount() {
    // Pass the parent the initial data.
    this._handleValueChanged();
  }

  /**
    Call the parent method with the new values of the constraints.

    @method _handleValueChanged
  */
  _handleValueChanged() {
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
      'cpu-cores': cores.value,
      mem: mem.value,
      'root-disk': disk.value,
      // Even if series are not technically a constraint in Juju, we include
      // them as part of constraints. When adding the machine the series is
      // extracted and handled separately in the API call.
      series: series.value
    });
  }

  render() {
    const props = this.props;
    const disabled = props.disabled;
    const constraints = props.constraints || {};
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
          defaultValue={props.currentSeries}
          disabled={disabled}
          id="series-constraint"
          key="seriesConstraintSelect"
          name="series-constraint"
          onChange={this._handleValueChanged.bind(this)}
          ref="seriesConstraintSelect">
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
        defaultValue={constraints.arch}
        disabled={disabled}
        id="arch-constraint"
        key="archConstraintSelect"
        name="arch-constraint"
        onChange={this._handleValueChanged.bind(this)}
        ref="archConstraintSelect">
        <option key="default" value="">
          Optionally choose an architecture
        </option>
        <option key="amd64" value="amd64">amd64</option>
        <option key="i386" value="i386">i386</option>
      </select>
    );
    const cpu = (
      <div key="cpu-constraint-div">
        <label className="constraints__label" htmlFor="cpu-constraint">
          CPU (GHZ)
        </label>
        <input className="constraints__input"
          defaultValue={constraints['cpu-power']}
          disabled={disabled}
          id="cpu-constraint"
          name="cpu-constraint"
          onChange={this._handleValueChanged.bind(this)}
          ref="cpuConstraintInput"
          type="text" />
      </div>
    );
    const cores = (
      <div key="cores-constraint-div">
        <label className="constraints__label" htmlFor="cores-constraint">
          Cores
        </label>
        <input className="constraints__input"
          defaultValue={constraints['cpu-cores']}
          disabled={disabled}
          id="cores-constraint"
          name="cores-constraint"
          onChange={this._handleValueChanged.bind(this)}
          ref="coresConstraintInput"
          type="text" />
      </div>
    );
    const mem = (
      <div key="mem-constraint-div">
        <label className="constraints__label" htmlFor="mem-constraint">
          Ram (MB)
        </label>
        <input className="constraints__input"
          defaultValue={constraints.mem}
          disabled={disabled}
          id="mem-constraint"
          name="mem-constraint"
          onChange={this._handleValueChanged.bind(this)}
          ref="memConstraintInput"
          type="text" />
      </div>
    );
    const disk = (
      <div key="disk-constraint-div">
        <label className="constraints__label" htmlFor="disk-constraint">
          Disk (MB)
        </label>
        <input className="constraints__input"
          defaultValue={constraints['root-disk']}
          disabled={disabled}
          id="disk-constraint"
          name="disk-constraint"
          onChange={this._handleValueChanged.bind(this)}
          ref="diskConstraintInput"
          type="text" />
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
};

Constraints.propTypes = {
  constraints: PropTypes.object,
  containerType: PropTypes.string,
  currentSeries: PropTypes.string,
  disabled: PropTypes.bool,
  hasUnit: PropTypes.bool,
  providerType: PropTypes.string,
  series: PropTypes.array,
  valuesChanged: PropTypes.func.isRequired
};

Constraints.defaultProps = {
  disabled: false,
  hasUnit: false,
  providerType: '',
  series: []
};

module.exports = Constraints;
