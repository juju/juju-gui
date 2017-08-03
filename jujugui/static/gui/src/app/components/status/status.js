/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/** Status React component used to display Juju status. */
class Status extends React.Component {

  /**
    Render the component.
  */
  render() {
    return (
      <juju.components.Panel
        instanceName="status-view"
        visible={true}>
        <div className="status-view__content">
          {this.renderStatus()}
        </div>
      </juju.components.Panel>
    );
  }

  /**
    Render the current model status.
    @returns {Object} The resulting element.
  */
  renderStatus() {
    const elements = [];
    const db = this.props.db;
    const model = this.props.model;
    if (!model.environmentName) {
      // No need to go further: we are not connected to a model.
      return 'Cannot show the status: the GUI is not connected to a model.';
    }
    elements.push(this._renderModel(model));
    if (db.remoteServices.size()) {
      elements.push(this._renderRemoteApplications(db.remoteServices));
    }
    if (db.services.size()) {
      elements.push(
        this._renderApplications(db.services),
        this._renderUnits(db.services)
      );
    }
    if (db.machines.size()) {
      elements.push(this._renderMachines(db.machines));
    }
    if (db.relations.size()) {
      elements.push(this._renderRelations(db.relations));
    }
    return elements;
  }

  /**
    Render the model fragment of the status.
    @param {Object} model The model attributes.
    @returns {Object} The resulting element.
  */
  _renderModel(model) {
    return (
      <table key="model">
        <thead>
          <tr>
            <th>Model</th>
            <th>Cloud/Region</th>
            <th>Version</th>
            <th>SLA</th>
          </tr>
        </thead>
        <tbody>
          <tr key={model.environmentName}>
            <td>{model.environmentName}</td>
            <td>{model.cloud}/{model.region}</td>
            <td>{model.version}</td>
            <td>{model.sla}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  /**
    Render the remote applications fragment of the status.
    @param {Object} remoteApplications The remote applications as included in
      the GUI db.
    @returns {Object} The resulting element.
  */
  _renderRemoteApplications(remoteApplications) {
    const rows = remoteApplications.map(application => {
      const app = application.getAttrs();
      const urlParts = app.url.split(':');
      return (
        <tr key={app.url}>
          <td>{app.service}</td>
          <td>{app.status.current}</td>
          <td>{urlParts[0]}</td>
          <td>{urlParts[1]}</td>
        </tr>
      );
    });
    return (
      <table key="remote-applications">
        <thead>
          <tr>
            <th>SAAS</th>
            <th>Status</th>
            <th>Store</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          {rows.sort(byKey)}
        </tbody>
      </table>
    );
  }

  /**
    Render the applications fragment of the status.
    @param {Object} applications The applications as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _renderApplications(applications) {
    const urllib = this.props.urllib;
    const rows = applications.map(application => {
      const app = application.getAttrs();
      const charm = urllib.fromLegacyString(app.charm);
      const store = charm.schema === 'cs' ? 'jujucharms' : 'local';
      const revision = charm.revision;
      // Set the revision to null so that it's not included when calling
      // charm.path() below.
      charm.revision = null;
      return (
        <tr key={app.name}>
          <td>{app.name}</td>
          <td>{app.workloadVersion}</td>
          <td className={getClass(app.status.current)}>
            {app.status.current}
          </td>
          <td>{app.units.size()}</td>
          <td>{charm.path()}</td>
          <td>{store}</td>
          <td>{revision}</td>
        </tr>
      );
    });
    return (
      <table key="applications">
        <thead>
          <tr>
            <th>Application</th>
            <th>Version</th>
            <th>Status</th>
            <th>Scale</th>
            <th>Charm</th>
            <th>Store</th>
            <th>Rev</th>
          </tr>
        </thead>
        <tbody>
          {rows.sort(byKey)}
        </tbody>
      </table>
    );
  }

  /**
    Render the units fragment of the status.
    @param {Object} applications The applications as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _renderUnits(applications) {
    const formatPorts = ranges => {
      if (!ranges) {
        return '';
      }
      return ranges.map(range => {
        if (range.from === range.to) {
          return `${range.from}/${range.protocol}`;
        }
        return `${range.from}-${range.to}/${range.protocol}`;
      }).join(', ');
    };
    const rows = [];
    applications.each(application => {
      application.get('units').each(unit => {
        rows.push(
          <tr key={unit.id}>
            <td>{unit.displayName}</td>
            <td className={getClass(unit.workloadStatus)}>
              {unit.workloadStatus}
            </td>
            <td className={getClass(unit.agentStatus)}>
              {unit.agentStatus}
            </td>
            <td>{unit.machine}</td>
            <td>{unit.public_address}</td>
            <td>{formatPorts(unit.portRanges)}</td>
            <td>{unit.workloadStatusMessage}</td>
          </tr>
        );
      });
    });
    if (!rows.length) {
      return null;
    }
    return (
      <table key="units">
        <thead>
          <tr>
            <th>Unit</th>
            <th>Workload</th>
            <th>Agent</th>
            <th>Machine</th>
            <th>Public address</th>
            <th>Ports</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {rows.sort(byKey)}
        </tbody>
      </table>
    );
  }

  /**
    Render the machines fragment of the status.
    @param {Object} machines The machines as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _renderMachines(machines) {
    const rows = machines.map(machine => {
      return (
        <tr key={machine.id}>
          <td>{machine.displayName}</td>
          <td className={getClass(machine.agent_state)}>
            {machine.agent_state}
          </td>
          <td>{machine.public_address}</td>
          <td>{machine.instance_id}</td>
          <td>{machine.series}</td>
          <td>{machine.agent_state_info}</td>
        </tr>
      );
    });
    return (
      <table key="machines">
        <thead>
          <tr>
            <th>Machine</th>
            <th>State</th>
            <th>DNS</th>
            <th>Instance ID</th>
            <th>Series</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {rows.sort(byKey)}
        </tbody>
      </table>
    );
  }

  /**
    Render the relations fragment of the status.
    @param {Array} relations The relations as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _renderRelations(relations) {
    const rows = relations.map(relation => {
      const rel = relation.getAttrs();
      let name = '';
      let provides = '';
      let consumes = '';
      let scope = '';
      rel.endpoints.forEach(endpoint => {
        const application = endpoint[0];
        const ep = endpoint[1];
        switch (ep.role) {
          case 'peer':
            name = ep.name;
            provides = application;
            consumes = application;
            scope = 'peer';
            return;
          case 'provider':
            name = ep.name;
            consumes = application;
            scope = 'regular';
            break;
          case 'requirer':
            provides = application;
            break;
        }
      });
      return (
        <tr key={rel.id}>
          <td>{name}</td>
          <td>{provides}</td>
          <td>{consumes}</td>
          <td>{scope}</td>
        </tr>
      );
    });
    return (
      <table key="relations">
        <thead>
          <tr>
            <th>Relation</th>
            <th>Provides</th>
            <th>Consumes</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.sort(byKey)}
        </tbody>
      </table>
    );
  }

};

Status.propTypes = {
  db: PropTypes.shape({
    machines: PropTypes.object.isRequired,
    relations: PropTypes.object.isRequired,
    remoteServices: PropTypes.object.isRequired,
    services: PropTypes.object.isRequired
  }).isRequired,
  model: PropTypes.shape({
    cloud: PropTypes.string,
    environmentName: PropTypes.string,
    region: PropTypes.string,
    sla: PropTypes.string,
    version: PropTypes.string
  }).isRequired,
  urllib: PropTypes.func.isRequired
};

/**
  Return an element class name suitable for the given value.
  @param {String} value The provided value.
  @returns {String} The class name ('ok', 'error' or '').
*/
const getClass = value => {
  switch (value) {
    case 'active':
    case 'idle':
    case 'started':
      return 'ok';
    case 'blocked':
    case 'down':
    case 'error':
      return 'error';
  }
  return '';
};

/**
  A compare function for sorting an array by the key property.
  @param {Object} a The first value.
  @param {Object} b The second value.
  @returns {Number} -1, 1 or 0.
*/
const byKey = (a, b) => {
  if (a.key < b.key)
    return -1;
  if (a.key > b.key)
    return 1;
  return 0;
};

YUI.add('status', function() {
  juju.components.Status = Status;
}, '', {
  requires: [
    'panel-component'
  ]
});
