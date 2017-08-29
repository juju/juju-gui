/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/** Status React component used to display Juju status. */
class Status extends React.Component {
  constructor(props) {
    super(props);
    this.STATUS_ERROR = 'error';
    this.STATUS_PENDING = 'pending';
    this.STATUS_UNCOMMITTED = 'uncommitted';
    this.STATUS_OK = 'ok';
    this.STATUS_ORDER = [
      this.STATUS_ERROR,
      this.STATUS_PENDING,
      this.STATUS_UNCOMMITTED,
      this.STATUS_OK
    ];
  }

  /**
    TODO: componentDidMount and componentDidUnmount should be removed
    when the status beta is over, it adds a class to overwrite the 'beta'
    pseudo element.
  */
  componentWillMount() {
    document.body.classList.add('u-is-status');
  }
  componentWillUnmount() {
    document.body.classList.remove('u-is-status');
  }

  /**
    Return an element class name suitable for the given value.
    @param {String} prefix The class prefix.
    @param {String} value The provided value.
    @returns {String} The class name ('ok', 'error' or '').
  */
  _getStatusClass(prefix, value) {
    if (!value) {
      // If there is no value then ignore it. This might be the case when an
      // entity's state property only has a value for pending/error states.
      return '';
    }
    if (!Array.isArray(value)) {
      value = [value];
    }
    const normalised = value.map(val => this._normaliseStatus(val));
    let status;
    // Loop through the order of priority until there is a matching status.
    this.STATUS_ORDER.some(val => {
      if (normalised.indexOf(val) > -1) {
        status = val;
        return true;
      }
    });
    return prefix + status;
  }

  /**
    Normalise the status value.
    @param status {String} The raw value.
    @returns {String} The normalised status ('ok', 'error' or 'pending').
  */
  _normaliseStatus(value) {
    let status = value;
    switch (value) {
      case 'active':
      case 'idle':
      case 'started':
        status = this.STATUS_OK;
        break;
      case 'blocked':
      case 'down':
      case 'error':
        status = this.STATUS_ERROR;
        break;
      case 'pending':
      case 'installing':
      case 'executing':
      case 'allocating':
      case 'maintenance':
        status = this.STATUS_PENDING;
        break;
    }
    return status;
  }

  /**
    Sort by the key attribute.
    @param {Object} a The first value.
    @param {Object} b The second value.
    @returns {Array} The sorted array.
  */
  _byKey(a, b) {
    if (a.key < b.key)
      return -1;
    if (a.key > b.key)
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
    // Model section.
    const model = this.props.model;
    if (!model.environmentName) {
      // No need to go further: we are not connected to a model.
      return 'Cannot show the status: the GUI is not connected to a model.';
    }
    elements.push(this._generateModel(model));
    // SAAS section.
    if (db.remoteServices.size()) {
      elements.push(this._generateRemoteApplications(db.remoteServices));
    }
    // Applications and units sections.
    const applications = db.services.filter(app => !app.get('pending'));
    if (applications.length) {
      elements.push(
        this._generateApplications(applications),
        this._generateUnits(applications)
      );
    }
    // Machines section.
    const machines = db.machines.filter(mach => mach.id.indexOf('new') !== 0);
    if (machines.length) {
      elements.push(this._generateMachines(machines));
    }
    // Relations section.
    const relations = db.relations.filter(rel => !rel.get('pending'));
    if (relations.length) {
      elements.push(this._generateRelations(relations));
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
        headers={[{
          content: 'Model',
          columnSize: 3
        }, {
          content: 'Cloud/Region',
          columnSize: 3
        }, {
          content: 'Version',
          columnSize: 3
        }, {
          content: 'SLA',
          columnSize: 3
        }]}
        key="model"
        rows={[{
          columns: [{
            columnSize: 3,
            content: model.environmentName
          }, {
            columnSize: 3,
            content: `${model.cloud}/${model.region}`
          }, {
            columnSize: 3,
            content: model.version
          }, {
            columnSize: 3,
            content: model.sla
          }],
          key: 'model'
        }]} />);
  }

  /**
    Navigate to the chosen application.
    @param appId {String} The id of the application to display.
  */
  _navigateToApplication(appId) {
    // Navigate to the app in the inspector, clearing the state so that the
    // app overview is shown.
    this.props.changeState({
      gui: {
        inspector: {
          id: appId,
          activeComponent: undefined,
          unit: null,
          unitStatus: null
        }
      }
    });
  }

  /**
    Navigate to the chosen charm.
    @param charmURL {String} The id of the charm to display.
  */
  _navigateToCharm(charmURL) {
    this.props.changeState({store: charmURL});
  }

  /**
    Navigate to the chosen unit.
    @param unitName {String} The name of the unit to display in the format
      'app-id/unit-number'.
  */
  _navigateToUnit(unitName) {
    const unitParts = unitName.split('/');
    this.props.changeState({
      gui: {
        inspector: {
          id: unitParts[0],
          unit: unitParts[1],
          activeComponent: 'unit'
        }
      }
    });
  }

  /**
    Navigate to the chosen machine.
    @param machineId {String} The id of the machine to display.
    @param evt {Object} The click event.
  */
  _navigateToMachine(machineId, evt) {
    // Because the changeState below results in this component being removed
    // from the document there is a React error for some reason if this event
    // propogates.
    evt.stopPropagation();
    this.props.changeState({
      gui: {
        machines: machineId,
        status: null
      }
    });
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
      return {
        columns: [{
          columnSize: 3,
          content: app.service
        }, {
          columnSize: 3,
          content: app.status.current
        }, {
          columnSize: 3,
          content: urlParts[0]
        }, {
          columnSize: 3,
          content: urlParts[1]
        }],
        key: app.url
      };
    });
    return (
      <juju.components.BasicTable
        headerClasses={['status-view__table-header']}
        headerColumnClasses={['status-view__table-header-column']}
        headers={[{
          content: 'SAAS',
          columnSize: 3
        }, {
          content: 'Status',
          columnSize: 3
        }, {
          content: 'Store',
          columnSize: 3
        }, {
          content: 'URL',
          columnSize: 3
        }]}
        key="remote-applications"
        rowClasses={['status-view__table-row']}
        rowColumnClasses={['status-view__table-column']}
        rows={rows}
        sort={this._byKey}
        tableClasses={['status-view__table']} />);
  }

  /**
    A predicate function that can be used to filter units so that uncommitted
    and unplaced units are excluded.
    @param {Object} unit A unit as included in the database.
    @returns {Boolean} Whether the unit is real or not.
  */
  _realUnitsPredicate(unit) {
    // Unplaced units have no machine defined. Subordinate units have an empty
    // string machine.
    return unit.machine !== undefined && unit.machine.indexOf('new') !== 0;
  }

  /**
    Generate the applications fragment of the status.
    @param {Array} applications The applications as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateApplications(applications) {
    const urllib = this.props.urllib;
    const rows = applications.map((application, i) => {
      const app = application.getAttrs();
      const charm = urllib.fromLegacyString(app.charm);
      const store = charm.schema === 'cs' ? 'jujucharms' : 'local';
      const revision = charm.revision;
      const charmId = charm.path();
      const units = app.units.filter(this._realUnitsPredicate);
      // Set the revision to null so that it's not included when calling
      // charm.path() below.
      charm.revision = null;
      return {
        classes: [this._getStatusClass(
          'status-view__table-row--',
          !app.pending ? app.status.current : 'uncommitted')],
        columns:[{
          columnSize: 2,
          content: (
            <span className="status-view__link"
              onClick={this._navigateToApplication.bind(this, app.id)}>
              <img className="status-view__icon"
                src={app.icon} />
              {app.name}
            </span>)
        }, {
          columnSize: 2,
          content: app.workloadVersion
        }, {
          columnSize: 2,
          content: (
            <span
              className={this._getStatusClass(
                'status-view__status--', app.status.current)}
              key={'status' + i}>
              {app.status.current || (<span>&nbsp;</span>)}
            </span>)
        }, {
          columnSize: 1,
          content: units.length
        }, {
          columnSize: 2,
          content: (
            <span className="status-view__link"
              onClick={this._navigateToCharm.bind(this, charmId)}>
              {charm.path()}
            </span>)
        }, {
          columnSize: 2,
          content: store
        }, {
          columnSize: 1,
          content: revision
        }],
        key: app.name
      };
    });
    return (
      <juju.components.BasicTable
        headerClasses={['status-view__table-header']}
        headerColumnClasses={['status-view__table-header-column']}
        headers={[{
          content: 'Application',
          columnSize: 2
        }, {
          content: 'Version',
          columnSize: 2
        }, {
          content: 'Status',
          columnSize: 2
        }, {
          content: 'Scale',
          columnSize: 1
        }, {
          content: 'Charm',
          columnSize: 2
        }, {
          content: 'Store',
          columnSize: 2
        }, {
          content: 'Rev',
          columnSize: 1
        }]}
        key="applications"
        rowClasses={['status-view__table-row']}
        rowColumnClasses={['status-view__table-column']}
        rows={rows}
        sort={this._byKey}
        tableClasses={['status-view__table']} />);
  }

  /**
    Generate the units fragment of the status.
    @param {Array} applications The applications as included in the GUI db.
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
    applications.forEach(application => {
      const units = application.get('units').filter(this._realUnitsPredicate);
      units.forEach((unit, i) => {
        rows.push({
          classes: [this._getStatusClass(
            'status-view__table-row--',
            unit.agentStatus || unit.workloadStatus ?
              [unit.agentStatus, unit.workloadStatus] : 'uncommitted')],
          columns: [{
            columnSize: 2,
            content: (
              <span className="status-view__link"
                onClick={this._navigateToUnit.bind(this, unit.id)}>
                <img className="status-view__icon"
                  src={application.get('icon')} />
                {unit.displayName}
              </span>)
          }, {
            columnSize: 2,
            content: (
              <span
                className={this._getStatusClass(
                  'status-view__status--', unit.workloadStatus)}
                key={'workload' + i}>
                {unit.workloadStatus || (<span>&nbsp;</span>)}
              </span>)
          }, {
            columnSize: 2,
            content: (
              <span
                className={this._getStatusClass(
                  'status-view__status--', unit.agentStatus)}
                key={'agent' + i}>
                {unit.agentStatus || (<span>&nbsp;</span>)}
              </span>)
          }, {
            columnSize: 1,
            content: (
              <span className="status-view__link"
                onClick={this._navigateToMachine.bind(this, unit.machine)}>
                {unit.machine || (<span>&nbsp;</span>)}
              </span>)
          }, {
            columnSize: 2,
            content: unit.public_address
          }, {
            columnSize: 1,
            content: formatPorts(unit.portRanges)
          }, {
            columnSize: 2,
            content: unit.workloadStatusMessage
          }],
          key: unit.id
        });
      });
    });
    if (!rows.length) {
      return null;
    }
    return (
      <juju.components.BasicTable
        headerClasses={['status-view__table-header']}
        headerColumnClasses={['status-view__table-header-column']}
        headers={[{
          content: 'Unit',
          columnSize: 2
        }, {
          content: 'Workload',
          columnSize: 2
        }, {
          content: 'Agent',
          columnSize: 2
        }, {
          content: 'Machine',
          columnSize: 1
        }, {
          content: 'Public address',
          columnSize: 2
        }, {
          content: 'Ports',
          columnSize: 1
        }, {
          content: 'Message',
          columnSize: 2
        }]}
        key="units"
        rowClasses={['status-view__table-row']}
        rowColumnClasses={['status-view__table-column']}
        rows={rows.sort(this._byKey.bind(this, 0))}
        sort={this._byKey}
        tableClasses={['status-view__table']} />);
  }

  /**
    Generate the machines fragment of the status.
    @param {Array} machines The machines as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateMachines(machines) {
    const rows = machines.map((machine, i) => {
      return {
        classes: [this._getStatusClass(
          'status-view__table-row--',
          machine.commitStatus === 'uncommitted' ?
            'uncommitted' : machine.agent_state)],
        columns: [{
          columnSize: 2,
          content: (
            <span className="status-view__link"
              onClick={this._navigateToMachine.bind(this, machine.id)}>
              {machine.displayName}
            </span>)
        }, {
          columnSize: 2,
          content: (
            <span
              className={this._getStatusClass(
                'status-view__status--', machine.agent_state)}
              key={'agent' + i}>
              {machine.agent_state || (<span>&nbsp;</span>)}
            </span>)
        }, {
          columnSize: 2,
          content: machine.public_address
        }, {
          columnSize: 2,
          content: machine.instance_id
        }, {
          columnSize: 2,
          content: machine.series
        }, {
          columnSize: 2,
          content: machine.agent_state_info
        }],
        key: machine.id
      };
    });
    return (
      <juju.components.BasicTable
        headerClasses={['status-view__table-header']}
        headerColumnClasses={['status-view__table-header-column']}
        headers={[{
          content: 'Machine',
          columnSize: 2
        }, {
          content: 'State',
          columnSize: 2
        }, {
          content: 'DNS',
          columnSize: 2
        }, {
          content: 'Instance ID',
          columnSize: 2
        }, {
          content: 'Series',
          columnSize: 2
        }, {
          content: 'Message',
          columnSize: 2
        }]}
        key="machines"
        rowClasses={['status-view__table-row']}
        rowColumnClasses={['status-view__table-column']}
        rows={rows.sort(this._byKey.bind(this, 0))}
        sort={this._byKey}
        tableClasses={['status-view__table']} />);
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
      return {
        classes: [this._getStatusClass(
          'status-view__table-row--', rel.pending ? 'uncommitted' : null)],
        columns: [{
          columnSize: 3,
          content: name
        }, {
          columnSize: 3,
          content: (
            <span className="status-view__link"
              onClick={this._navigateToApplication.bind(this, provides)}>
              {provides}
            </span>)
        }, {
          columnSize: 3,
          content: (
            <span className="status-view__link"
              onClick={this._navigateToApplication.bind(this, consumes)}>
              {consumes}
            </span>)
        }, {
          columnSize: 3,
          content: scope
        }],
        key: rel.id
      };
    });
    return (
      <juju.components.BasicTable
        headerClasses={['status-view__table-header']}
        headerColumnClasses={['status-view__table-header-column']}
        headers={[{
          content: 'Relation',
          columnSize: 3
        }, {
          content: 'Provides',
          columnSize: 3
        }, {
          content: 'Consumes',
          columnSize: 3
        }, {
          content: 'Type',
          columnSize: 3
        }]}
        key="relations"
        rowClasses={['status-view__table-row']}
        rowColumnClasses={['status-view__table-column']}
        rows={rows.sort(this._byKey.bind(this, 0))}
        sort={this._byKey}
        tableClasses={['status-view__table']} />);
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
  changeState: PropTypes.func.isRequired,
  db: shapeup.shape({
    machines: shapeup.shape({
      filter: PropTypes.func.isRequired
    }).isRequired,
    relations: shapeup.shape({
      filter: PropTypes.func.isRequired
    }).isRequired,
    remoteServices: shapeup.shape({
      map: PropTypes.func.isRequired,
      size: PropTypes.func.isRequired
    }).isRequired,
    services: shapeup.shape({
      filter: PropTypes.func.isRequired
    }).isRequired
  }).frozen.isRequired,
  model: shapeup.shape({
    cloud: PropTypes.string,
    environmentName: PropTypes.string,
    region: PropTypes.string,
    sla: PropTypes.string,
    version: PropTypes.string
  }).frozen.isRequired,
  urllib: shapeup.shape({
    fromLegacyString: PropTypes.func.isRequired
  }).frozen.isRequired
};

YUI.add('status', function() {
  juju.components.Status = Status;
}, '', {
  requires: [
    'basic-table',
    'panel-component'
  ]
});
