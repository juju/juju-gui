/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');
const { urls } = require('jaaslib');

const BasicTable = require('../basic-table/basic-table');
const Panel = require('../panel/panel');
const utils = require('../../init/utils');
const { listForApplication, listUnits } = require('../../selectors/units');

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
    @returns {Object} The resulting element.
  */
  _generateModel() {
    const { model, entities } = this.props;
    const counts = {
      applications: Object.keys(entities.applications).length,
      machines: Object.keys(entities.machines).length,
      relations: Object.keys(entities.relations).length,
      remoteApplications: Object.keys(entities['remote-applications']).length,
      units: listUnits(entities.units).length
    };
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
    @returns {Object} The resulting element.
  */
  _generateRemoteApplications() {
    const remoteApplications = this.props.entities['remote-applications'];
    if (!Object.keys(remoteApplications).length) {
      return null;
    }
    const rows = Object.keys(remoteApplications).map(key => {
      const app = remoteApplications[key];
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
    Generate the applications fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateApplications() {
    const { entities } = this.props;
    const applications = entities.applications;
    if (!Object.keys(applications).length) {
      return null;
    }
    const rows = Object.keys(applications).map(key => {
      const app = applications[key];
      const charm = urls.URL.fromLegacyString(app['charm-url']);
      const store = charm.schema === 'cs' ? 'jujucharms' : 'local';
      const revision = charm.revision;
      const charmId = charm.path();
      const units = listForApplication(entities.units, app.name);
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
                src={utils.getIconPath(app['charm-url'], false)} />
              {app.name}
            </span>)
        }, {
          columnSize: 2,
          content: app['workload-version']
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
    @returns {Object} The resulting element.
  */
  _generateUnits() {
    const { entities } = this.props;
    const units = entities.units;
    const applications = entities.applications;
    if (!listUnits(units).length) {
      return null;
    }
    const formatPorts = ranges => {
      if (!ranges) {
        return '';
      }
      return ranges.map(range => {
        if (range['from-port'] === range['to-port']) {
          return `${range['from-port']}/${range.protocol}`;
        }
        return `${range['from-port']}-${range['to-port']}/${range.protocol}`;
      }).join(', ');
    };
    const rows = listUnits(units).map(unit => {
      const application = applications[unit.application];
      const appExposed = application.exposed;
      this._setHighestStatus(this._getHighestStatus(
        [unit['agent-status'].current, unit['workload-status'].current]));
      let publicAddress = unit['public-address'];
      if (appExposed && unit['port-ranges'].length) {
        const port = unit['port-ranges'][0]['from-port'];
        const label = `${unit['public-address']}:${port}`;
        const protocol = port === 443 ? 'https' : 'http';
        const href = `${protocol}://${label}`;
        publicAddress = (
          <a className="status-view__link"
            href={href}
            target="_blank">
            {unit['public-address']}
          </a>);
      }
      return {
        classes: [this._getStatusClass(
          'status-view__table-row--',
          [unit['agent-status'].current, unit['workload-status'].current])],
        clickState: this._generateUnitClickState(unit.name),
        columns: [{
          columnSize: 2,
          content: (
            <span>
              <img className="status-view__icon"
                src={utils.getIconPath(application['charm-url'], false)} />
              {unit.name}
            </span>)
        }, {
          columnSize: 2,
          content: this._generateStatusDisplay(unit['workload-status'].current)
        }, {
          columnSize: 2,
          content: this._generateStatusDisplay(unit['agent-status'].current)
        }, {
          columnSize: 1,
          content: (
            <a className="status-view__link"
              href={this.props.generatePath(
                this._generateMachineClickState(unit['machine-id']))}
              onClick={this._navigateToMachine.bind(this, unit['machine-id'])}>
              {unit['machine-id']}
            </a>)
        }, {
          columnSize: 2,
          content: publicAddress
        }, {
          columnSize: 1,
          content: formatPorts(unit['port-ranges'])
        }, {
          columnSize: 2,
          content: unit['workload-status'].message
        }],
        extraData: this._getHighestStatus(
          [unit['agent-status'].current, unit['workload-status'].current]),
        key: unit.name
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
    @returns {Object} The resulting element.
  */
  _generateMachines() {
    const machines = this.props.entities.machines;
    if (!Object.keys(machines).length) {
      return null;
    }
    const rows = Object.keys(machines).map(key => {
      const machine = machines[key];
      this._setHighestStatus(machine['agent-status'].current);
      let publicAddress;
      machine.addresses.forEach(address => {
        if (address.scope === 'public') {
          publicAddress = address.value;
        }
      });
      return {
        classes: [this._getStatusClass(
          'status-view__table-row--', machine['agent-status'].current)],
        clickState: this._generateMachineClickState(machine.id),
        columns: [{
          columnSize: 1,
          content: machine.id
        }, {
          columnSize: 2,
          content: this._generateStatusDisplay(machine['agent-status'].current)
        }, {
          columnSize: 2,
          content: publicAddress
        }, {
          columnSize: 3,
          content: machine['instance-id']
        }, {
          columnSize: 1,
          content: machine.series
        }, {
          columnSize: 3,
          content: machine['agent-status'].message
        }],
        extraData: this._normaliseStatus(machine['agent-status'].current),
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
    const applications = this.props.entities.applications;
    const app = applications[name];
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
          src={utils.getIconPath(app['charm-url'], false)} />
        {name}
      </a>);
  }

  /**
    Generate the relations fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateRelations() {
    const relations = this.props.entities.relations;
    if (!Object.keys(relations).length) {
      return null;
    }
    const rows = Object.keys(relations).map(key => {
      const rel = relations[key];
      let name = '';
      let provides = '';
      let consumes = '';
      let scope = '';
      rel.endpoints.forEach(endpoint => {
        const application = endpoint['application-name'];
        switch (endpoint.relation.role) {
          case 'peer':
            name = endpoint.relation.name;
            provides = application;
            consumes = application;
            scope = 'peer';
            return;
          case 'provider':
            name = endpoint.relation.name;
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
        key: rel.id.toString()
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
    const { model } = this.props;
    let content;
    if (!model.modelUUID) {
      // No need to go further: we are not connected to a model.
      content = 'Cannot show the status: the GUI is not connected to a model.';
    } else {
      content = (
        <React.Fragment>
          {this._generateModel()}
          {this._generateRemoteApplications()}
          {this._generateApplications()}
          {this._generateUnits()}
          {this._generateMachines()}
          {this._generateRelations()}
        </React.Fragment>);
    }
    return (
      <Panel
        instanceName="status-view"
        visible={true}>
        <div className="status-view__content">
          {content}
        </div>
      </Panel>
    );
  }
};

Status.propTypes = {
  changeState: PropTypes.func.isRequired,
  entities: shapeup.shape({
    annotations: PropTypes.object.isRequired,
    applications: PropTypes.object.isRequired,
    machines: PropTypes.object.isRequired,
    relations: PropTypes.object.isRequired,
    'remote-applications': PropTypes.object.isRequired,
    units: PropTypes.object.isRequired
  }),
  generatePath: PropTypes.func.isRequired,
  model: shapeup.shape({
    cloud: PropTypes.string,
    environmentName: PropTypes.string,
    modelUUID: PropTypes.string,
    region: PropTypes.string,
    sla: PropTypes.string,
    version: PropTypes.string
  }).frozen.isRequired
};

module.exports = Status;
