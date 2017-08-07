/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/** Status React component used to display Juju status. */
class Status extends React.Component {
  /**
    Return an element class name suitable for the given value.
    @param {String} value The provided value.
    @returns {String} The class name ('ok', 'error' or '').
  */
  _getClass(value) {
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
  }

  /**
    Sort by the given index.
    @param index {Int} The index to sort by.
    @param {Object} a The first value.
    @param {Object} b The second value.
    @returns {Array} The sorted array.
  */
  _byIndex(index, a, b) {
    if (a[index] < b[index])
      return -1;
    if (a[index] > b[index])
      return 1;
    return 0;
  }

  /**
    Generate the current model status.
    @returns {Object} The resulting element.
  */
  _generateStatus() {
    const elements = [];
    const db = this.props.db;
    const model = this.props.model;
    if (!model.environmentName) {
      // No need to go further: we are not connected to a model.
      return 'Cannot show the status: the GUI is not connected to a model.';
    }
    elements.push(this._generateModel(model));
    if (db.remoteServices.size()) {
      elements.push(this._generateRemoteApplications(db.remoteServices));
    }
    if (db.services.size()) {
      elements.push(
        this._generateApplications(db.services),
        this._generateUnits(db.services)
      );
    }
    if (db.machines.size()) {
      elements.push(this._generateMachines(db.machines));
    }
    if (db.relations.size()) {
      elements.push(this._generateRelations(db.relations));
    }
    return elements;
  }

  /**
    Generate the model fragment of the status.
    @param {Object} model The model attributes.
    @returns {Object} The resulting element.
  */
  _generateModel(model) {
    return (
      <juju.components.BasicTable
        columns={[{
          title: 'Model',
          size: 3
        }, {
          title: 'Cloud/Region',
          size: 3
        }, {
          title: 'Version',
          size: 3
        }, {
          title: 'SLA',
          size: 3
        }]}
        key="model"
        rows={[[
          model.environmentName,
          `${model.cloud}/${model.region}`,
          model.version,
          model.sla
        ]]} />);
  }

  /**
    Generate the remote applications fragment of the status.
    @param {Object} remoteApplications The remote applications as included in
      the GUI db.
    @returns {Object} The resulting element.
  */
  _generateRemoteApplications(remoteApplications) {
    const rows = remoteApplications.map(application => {
      const app = application.getAttrs();
      const urlParts = app.url.split(':');
      return [
        app.service,
        app.status.current,
        urlParts[0],
        urlParts[1]
      ];
    });
    return (
      <juju.components.BasicTable
        columns={[{
          title: 'SAAS',
          size: 3
        }, {
          title: 'Status',
          size: 3
        }, {
          title: 'Store',
          size: 3
        }, {
          title: 'URL',
          size: 3
        }]}
        key="remote-applications"
        rows={rows} />);
  }

  /**
    Generate the applications fragment of the status.
    @param {Object} applications The applications as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateApplications(applications) {
    const urllib = this.props.urllib;
    const rows = applications.map((application, i) => {
      const app = application.getAttrs();
      const charm = urllib.fromLegacyString(app.charm);
      const store = charm.schema === 'cs' ? 'jujucharms' : 'local';
      const revision = charm.revision;
      // Set the revision to null so that it's not included when calling
      // charm.path() below.
      charm.revision = null;
      return [
        app.name,
        app.workloadVersion,
        (<span className={this._getClass(app.status.current)}
          key={'status' + i}>
          {app.status.current}
        </span>),
        app.units.size(),
        charm.path(),
        store,
        revision
      ];
    });
    return (
      <juju.components.BasicTable
        columns={[{
          title: 'Application',
          size: 2
        }, {
          title: 'Version',
          size: 2
        }, {
          title: 'Status',
          size: 2
        }, {
          title: 'Scale',
          size: 1
        }, {
          title: 'Charm',
          size: 2
        }, {
          title: 'Store',
          size: 2
        }, {
          title: 'Rev',
          size: 1
        }]}
        key="applications"
        rows={rows.sort(this._byIndex.bind(this, 0))} />);
  }

  /**
    Generate the units fragment of the status.
    @param {Object} applications The applications as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateUnits(applications) {
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
      application.get('units').each((unit, i) => {
        rows.push([
          unit.displayName,
          (<span className={this._getClass(unit.workloadStatus)}
            key={'workload' + i}>
            {unit.workloadStatus}
          </span>),
          (<span className={this._getClass(unit.agentStatus)}
            key={'agent' + i}>
            {unit.agentStatus}
          </span>),
          unit.machine,
          unit.public_address,
          formatPorts(unit.portRanges),
          unit.workloadStatusMessage
        ]);
      });
    });
    if (!rows.length) {
      return null;
    }
    return (
      <juju.components.BasicTable
        columns={[{
          title: 'Unit',
          size: 2
        }, {
          title: 'Workload',
          size: 2
        }, {
          title: 'Agent',
          size: 2
        }, {
          title: 'Machine',
          size: 1
        }, {
          title: 'Public address',
          size: 2
        }, {
          title: 'Ports',
          size: 1
        }, {
          title: 'Message',
          size: 2
        }]}
        key="units"
        rows={rows.sort(this._byIndex.bind(this, 0))} />);
  }

  /**
    Generate the machines fragment of the status.
    @param {Object} machines The machines as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateMachines(machines) {
    const rows = machines.map((machine, i) => {
      return [
        machine.displayName,
        (<span className={this._getClass(machine.agent_state)}
          key={'agent' + i}>
          {machine.agent_state}
        </span>),
        machine.public_address,
        machine.instance_id,
        machine.series,
        machine.agent_state_info
      ];
    });
    return (
      <juju.components.BasicTable
        columns={[{
          title: 'Machine',
          size: 2
        }, {
          title: 'State',
          size: 2
        }, {
          title: 'DNS',
          size: 2
        }, {
          title: 'Instance ID',
          size: 2
        }, {
          title: 'Series',
          size: 2
        }, {
          title: 'Message',
          size: 2
        }]}
        key="machines"
        rows={rows.sort(this._byIndex.bind(this, 0))} />);
  }

  /**
    Generate the relations fragment of the status.
    @param {Array} relations The relations as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateRelations(relations) {
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
      return [
        name,
        provides,
        consumes,
        scope
      ];
    });
    return (
      <juju.components.BasicTable
        columns={[{
          title: 'Relation',
          size: 3
        }, {
          title: 'Provides',
          size: 3
        }, {
          title: 'Consumes',
          size: 3
        }, {
          title: 'Type',
          size: 3
        }]}
        key="relations"
        rows={rows.sort(this._byIndex.bind(this, 0))} />);
  }

  render() {
    return (
      <juju.components.Panel
        instanceName="status-view"
        visible={true}>
        <div className="status-view__content">
          {this._generateStatus()}
        </div>
      </juju.components.Panel>
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

YUI.add('status', function() {
  juju.components.Status = Status;
}, '', {
  requires: [
    'basic-table',
    'panel-component'
  ]
});
