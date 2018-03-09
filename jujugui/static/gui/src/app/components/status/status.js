/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const shapeup = require('shapeup');

const BasicTable = require('../basic-table/basic-table');
const Panel = require('../panel/panel');

/** Status React component used to display Juju status. */
class Status extends React.Component {
  constructor(props) {
    super(props);
    this.STATUS_ERROR = 'error';
    this.STATUS_PENDING = 'pending';
    this.STATUS_OK = 'ok';
    this.STATUS_ORDER = [
      this.STATUS_ERROR,
      this.STATUS_PENDING,
      this.STATUS_OK
    ];
    // This property is used to store the new highest status during a render or
    // state change and the value is then stored in state in componentDidUpdate.
    this.newHighest = null;
    this.state = {
      highestStatus: this.STATUS_OK,
      statusFilter: null
    };
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

  componentWillReceiveProps() {
    // Reset to the lowest status so that when the apps, units etc. are looped
    // through the highest status can be stored.
    this.setState({highestStatus: this.STATUS_OK});
  }

  componentDidUpdate() {
    // Update the state with the new status now that all status changes/renders
    // are complete.
    if (this.newHighest && (this.state.highestStatus !== this.newHighest)) {
      this.setState({highestStatus: this.newHighest});
      this.newHighest = null;
    }
  }

  /**
    Set the highest status if the passed status is higher than the current.
    @param status {String} A status.
  */
  _setHighestStatus(status) {
    const normalised = this._normaliseStatus(status);
    if (this.STATUS_ORDER.indexOf(normalised) <
      this.STATUS_ORDER.indexOf(this.state.highestStatus)) {
      // Store the new state instead of updating state directly as this change
      // may have been triggered by a state update or render and you can't
      // update state during a state update or render.
      this.newHighest = normalised;
    }
  }

  /**
    Get the highest status from a list of statuses.
    @param statuses {Ȧrray} A list of statuses.
    @returns {String} The status.
  */
  _getHighestStatus(statuses) {
    const normalised = statuses.map(status => this._normaliseStatus(status));
    let status;
    // Loop through the order of priority until there is a matching status.
    this.STATUS_ORDER.some(val => {
      if (normalised.indexOf(val) > -1) {
        status = val;
        return true;
      }
    });
    return status;
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
    return prefix + this._getHighestStatus(normalised);
  }

  /**
    Normalise the status value.
    @param status {String} The raw value.
    @returns {String} The normalised status ('ok', 'error' or 'pending').
  */
  _normaliseStatus(value) {
    let status = this.STATUS_OK;
    switch(value) {
      case 'active':
      case 'idle':
      case 'started':
      case 'waiting':
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
    Generate a status for display.
    @param status {String} The status to display.
    @returns {Object} The status markup.
  */
  _generateStatusDisplay(status) {
    // If the status provided from a model property it might have no value.
    if (!status) {
      return null;
    }
    return (
      <span className={this._getStatusClass('status-view__status--', status)}>
        {status}
      </span>);
  }

  /**
    Sort by the key attribute.
    @param {Object} a The first value.
    @param {Object} b The second value.
    @returns {Array} The sorted array.
  */
  _byKey(a, b) {
    if (a.key < b.key) {
      return -1;
    }
    if (a.key > b.key) {
      return 1;
    }
    return 0;
  }

  /**
    Filter a row by the status.
    @param row {Object} The row values.
    @returns {Boolean} Whether the row matches the status.
  */
  _filterByStatus(row) {
    if (!this.state.statusFilter) {
      return true;
    }
    return row.extraData === this.state.statusFilter;
  }

  /**
    Generate the current model status.
    @returns {Object} The resulting element.
  */
  _generateStatus() {
    const elements = [];
    const db = this.props.db;
    const applications = db.services.filter(app => !app.get('pending'));
    const machines = db.machines.filter(mach => mach.id.indexOf('new') !== 0);
    const relations = db.relations.filter(rel => !rel.get('pending'));
    const counts = {
      applications: applications.length,
      machines: machines.length,
      relations: relations.length,
      remoteApplications: db.remoteServices && db.remoteServices.size() || 0,
      units: db.units && db.units.size() || 0
    };
    // Model section.
    const model = this.props.model;
    if (!model.modelUUID) {
      // No need to go further: we are not connected to a model.
      return 'Cannot show the status: the GUI is not connected to a model.';
    }
    elements.push(this._generateModel(model, counts));
    // SAAS section.
    if (counts.remoteApplications) {
      elements.push(this._generateRemoteApplications(db.remoteServices));
    }
    // Applications and units sections.
    if (counts.applications) {
      elements.push(
        this._generateApplications(applications),
        this._generateUnits(applications)
      );
    }
    // Machines section.
    if (counts.machines) {
      elements.push(this._generateMachines(machines));
    }
    // Relations section.
    if (counts.relations) {
      elements.push(this._generateRelations(relations));
    }
    return elements;
  }

  /**
    Handle filter changes and store the new status in state.
    @param evt {Object} The change event
  */
  _handleFilterChange(evt) {
    let filter = evt.currentTarget.value;
    if (filter === 'none') {
      filter = null;
    }
    this._changeFilterStatus(filter);
  }

  /**
    Set the filter status.
    @param status {String} A status.
  */
  _changeFilterStatus(status) {
    this.setState({statusFilter: status});
  }

  /**
    Generate the filter select box.
    @returns {Object} The select box element to render.
  */
  _generateFilters() {
    const options = ['none'].concat(this.STATUS_ORDER).map(status => {
      return (
        <option className="status-view__filter-option"
          key={status}
          value={status}>
          {status}
        </option>);
    });
    return (
      <select className="status-view__filter-select"
        onChange={this._handleFilterChange.bind(this)}
        value={this.state.statusFilter || 'none'}>
        {options}
      </select>);
  }

  /**
    Generate the model fragment of the status.
    @param {Object} model The model attributes.
    @param {Object} counts The counts of applications, units, machines etc.
    @returns {Object} The resulting element.
  */
  _generateModel(model, counts) {
    const highestStatus = this.state.highestStatus;
    let title = 'Everything is OK';
    switch (highestStatus) {
      case this.STATUS_OK:
        title = 'Everything is OK';
        break;
      case this.STATUS_PENDING:
        title = 'Items are pending';
        break;
      case this.STATUS_ERROR:
        title = 'Items are in error';
        break;
    }
    return (
      <div key="model">
        <div className="twelve-col no-margin-bottom">
          <div className="eight-col">
            <h2>
              {model.environmentName}
              <span
                className={'status-view__traffic-light ' +
                  `status-view__traffic-light--${highestStatus}`}
                onClick={this._changeFilterStatus.bind(this, highestStatus)}
                role="button"
                tabIndex="0"
                title={title}>
              </span>
            </h2>
          </div>
          <div className="status-view__filter-label two-col">
            Filter status:
          </div>
          <div className="status-view__filter two-col last-col">
            {this._generateFilters()}
          </div>
        </div>
        <BasicTable
          headers={[{
            content: 'Cloud/Region',
            columnSize: 2
          }, {
            content: 'Version',
            columnSize: 2
          }, {
            content: 'SLA',
            columnSize: 1
          }, {
            content: 'Applications',
            columnSize: 2
          }, {
            content: 'Remote applications',
            columnSize: 2
          }, {
            content: 'Units',
            columnSize: 1
          }, {
            content: 'Machines',
            columnSize: 1
          }, {
            content: 'Relations',
            columnSize: 1
          }]}
          rows={[{
            columns: [{
              columnSize: 2,
              content: `${model.cloud}/${model.region}`
            }, {
              columnSize: 2,
              content: model.version
            }, {
              columnSize: 1,
              content: model.sla
            }, {
              columnSize: 2,
              content: counts.applications
            }, {
              columnSize: 2,
              content: counts.remoteApplications
            }, {
              columnSize: 1,
              content: counts.units
            }, {
              columnSize: 1,
              content: counts.machines
            }, {
              columnSize: 1,
              content: counts.relations
            }],
            key: 'model'
          }]} />
      </div>);
  }

  /**
    Generate the state to navigate to an application.
    @param appId {String} The id of the application to display.
  */
  _generateApplicationClickState(appId) {
    // Navigate to the app in the inspector, clearing the state so that the
    // app overview is shown.
    return {
      gui: {
        inspector: {
          id: appId,
          activeComponent: undefined,
          unit: null,
          unitStatus: null
        }
      }
    };
  }

  /**
    Navigate to the chosen application.
    @param appId {String} The id of the application to display.
    @param evt {Object} The click event.
  */
  _navigateToApplication(appId, evt) {
    evt.preventDefault();
    // Navigate to the app in the inspector, clearing the state so that the
    // app overview is shown.
    this.props.changeState(this._generateApplicationClickState(appId));
  }

  /**
    Generate the state to navigate to a charm.
    @param charmURL {String} The id of the charm to display.
  */
  _generateCharmClickState(charmURL) {
    return {store: charmURL};
  }

  /**
    Navigate to the chosen charm.
    @param charmURL {String} The id of the charm to display.
    @param evt {Object} The click event.
  */
  _navigateToCharm(charmURL, evt) {
    evt.preventDefault();
    this.props.changeState(this._generateCharmClickState(charmURL));
  }

  /**
    Generate the state to navigate to a unit.
    @param unitName {String} The name of the unit to display in the format
      'app-id/unit-number'.
  */
  _generateUnitClickState(unitName) {
    const unitParts = unitName.split('/');
    return {
      gui: {
        inspector: {
          id: unitParts[0],
          unit: unitParts[1],
          activeComponent: 'unit'
        }
      }
    };
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
    evt.preventDefault();
    this.props.changeState(this._generateMachineClickState(machineId));
  }

  /**
    Generate the state to navigate to a machine.
    @param machineId {String} The id of the machine to display.
    @returns {Object} The machine state.
  */
  _generateMachineClickState(machineId) {
    return {
      gui: {
        machines: machineId,
        status: null
      }
    };
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
        extraData: this._normaliseStatus(app.status.current),
        key: app.url
      };
    });
    return (
      <BasicTable
        filterPredicate={this._filterByStatus.bind(this)}
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
    const rows = applications.map(application => {
      const app = application.getAttrs();
      const charm = urllib.fromLegacyString(app.charm);
      const store = charm.schema === 'cs' ? 'jujucharms' : 'local';
      const revision = charm.revision;
      const charmId = charm.path();
      const units = app.units.filter(this._realUnitsPredicate);
      // Set the revision to null so that it's not included when calling
      // charm.path() below.
      charm.revision = null;
      this._setHighestStatus(app.status.current);
      return {
        classes: [this._getStatusClass(
          'status-view__table-row--', app.status.current)],
        clickState: this._generateApplicationClickState(app.id),
        columns: [{
          columnSize: 2,
          content: (
            <span>
              <img className="status-view__icon"
                src={app.icon} />
              {app.name}
            </span>)
        }, {
          columnSize: 2,
          content: app.workloadVersion
        }, {
          columnSize: 2,
          content: this._generateStatusDisplay(app.status.current)
        }, {
          columnSize: 1,
          content: units.length
        }, {
          columnSize: 2,
          content: (
            <a className="status-view__link"
              href={this.props.generatePath(
                this._generateCharmClickState(charmId))}
              onClick={this._navigateToCharm.bind(this, charmId)}>
              {charm.path()}
            </a>)
        }, {
          columnSize: 2,
          content: store
        }, {
          columnSize: 1,
          content: revision
        }],
        extraData: this._normaliseStatus(app.status.current),
        key: app.name
      };
    });
    return (
      <BasicTable
        changeState={this.props.changeState}
        filterPredicate={this._filterByStatus.bind(this)}
        generatePath={this.props.generatePath}
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
      const appExposed = application.get('exposed');
      const units = application.get('units').filter(this._realUnitsPredicate);
      units.forEach(unit => {
        this._setHighestStatus(this._getHighestStatus(
          [unit.agentStatus, unit.workloadStatus]));
        let publicAddress = unit.public_address;
        if (appExposed && unit.portRanges.length) {
          const port = unit.portRanges[0].from;
          const label = `${unit.public_address}:${port}`;
          const protocol = port === 443 ? 'https' : 'http';
          const href = `${protocol}://${label}`;
          publicAddress = (
            <a className="status-view__link"
              href={href}
              target="_blank">
              {unit.public_address}
            </a>);
        }
        rows.push({
          classes: [this._getStatusClass(
            'status-view__table-row--',
            [unit.agentStatus, unit.workloadStatus])],
          clickState: this._generateUnitClickState(unit.id),
          columns: [{
            columnSize: 2,
            content: (
              <span>
                <img className="status-view__icon"
                  src={application.get('icon')} />
                {unit.displayName}
              </span>)
          }, {
            columnSize: 2,
            content: this._generateStatusDisplay(unit.workloadStatus)
          }, {
            columnSize: 2,
            content: this._generateStatusDisplay(unit.agentStatus)
          }, {
            columnSize: 1,
            content: (
              <a className="status-view__link"
                href={this.props.generatePath(
                  this._generateMachineClickState(unit.machine))}
                onClick={this._navigateToMachine.bind(this, unit.machine)}>
                {unit.machine}
              </a>)
          }, {
            columnSize: 2,
            content: publicAddress
          }, {
            columnSize: 1,
            content: formatPorts(unit.portRanges)
          }, {
            columnSize: 2,
            content: unit.workloadStatusMessage
          }],
          extraData: this._getHighestStatus(
            [unit.agentStatus, unit.workloadStatus]),
          key: unit.id
        });
      });
    });
    if (!rows.length) {
      return null;
    }
    return (
      <BasicTable
        changeState={this.props.changeState}
        filterPredicate={this._filterByStatus.bind(this)}
        generatePath={this.props.generatePath}
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
    const rows = machines.map(machine => {
      this._setHighestStatus(machine.agent_state);
      return {
        classes: [this._getStatusClass(
          'status-view__table-row--', machine.agent_state)],
        clickState: this._generateMachineClickState(machine.id),
        columns: [{
          columnSize: 1,
          content: machine.displayName
        }, {
          columnSize: 2,
          content: this._generateStatusDisplay(machine.agent_state)
        }, {
          columnSize: 2,
          content: machine.public_address
        }, {
          columnSize: 3,
          content: machine.instance_id
        }, {
          columnSize: 1,
          content: machine.series
        }, {
          columnSize: 3,
          content: machine.agent_state_info
        }],
        extraData: this._normaliseStatus(machine.agent_state),
        key: machine.id
      };
    });
    return (
      <BasicTable
        changeState={this.props.changeState}
        filterPredicate={this._filterByStatus.bind(this)}
        generatePath={this.props.generatePath}
        headerClasses={['status-view__table-header']}
        headerColumnClasses={['status-view__table-header-column']}
        headers={[{
          content: 'Machine',
          columnSize: 1
        }, {
          content: 'State',
          columnSize: 2
        }, {
          content: 'DNS',
          columnSize: 2
        }, {
          content: 'Instance ID',
          columnSize: 3
        }, {
          content: 'Series',
          columnSize: 1
        }, {
          content: 'Message',
          columnSize: 3
        }]}
        key="machines"
        rowClasses={['status-view__table-row']}
        rowColumnClasses={['status-view__table-column']}
        rows={rows.sort(this._byKey.bind(this, 0))}
        sort={this._byKey}
        tableClasses={['status-view__table']} />);
  }

  /**
    Generate a link to an application from a relation.
    @param name {String} An app name.
    @returns {Object} The link element.
  */
  _generateRelationAppLink(name) {
    const app = this.props.db.services.getById(name);
    if (!app) {
      // If the application is not in the DB it must be remote app so don't
      // link to it.
      return (<span>{name}</span>);
    }
    return (
      <a className="status-view__link"
        href={this.props.generatePath(
          this._generateApplicationClickState(name))}
        onClick={this._navigateToApplication.bind(this, name)}>
        <img className="status-view__icon"
          src={app.get('icon')} />
        {name}
      </a>);
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
        columns: [{
          columnSize: 3,
          content: name
        }, {
          columnSize: 3,
          content: this._generateRelationAppLink(provides)
        }, {
          columnSize: 3,
          content: this._generateRelationAppLink(consumes)
        }, {
          columnSize: 3,
          content: scope
        }],
        key: rel.id
      };
    });
    return (
      <BasicTable
        filterPredicate={this._filterByStatus.bind(this)}
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
      <Panel
        instanceName="status-view"
        visible={true}>
        <div className="status-view__content">
          {this._generateStatus()}
        </div>
      </Panel>
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
      filter: PropTypes.func.isRequired,
      getById: PropTypes.func.isRequired
    }).isRequired
  }).frozen.isRequired,
  generatePath: PropTypes.func.isRequired,
  model: shapeup.shape({
    cloud: PropTypes.string,
    environmentName: PropTypes.string,
    modelUUID: PropTypes.string,
    region: PropTypes.string,
    sla: PropTypes.string,
    version: PropTypes.string
  }).frozen.isRequired,
  urllib: shapeup.shape({
    fromLegacyString: PropTypes.func.isRequired
  }).frozen.isRequired
};

module.exports = Status;
