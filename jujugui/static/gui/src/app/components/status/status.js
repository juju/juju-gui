/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../shared/basic-table/basic-table');
const StatusApplicationList = require('../shared/status/application-list/application-list');
const StatusMachineList = require('../shared/status/machine-list/machine-list');
const StatusRemoteApplicationList = require(
  '../shared/status/remote-application-list/remote-application-list');
const StatusRelationList = require('../shared/status/relation-list/relation-list');
const StatusUnitList = require('../shared/status/unit-list/unit-list');
const Panel = require('../panel/panel');
const utils = require('../shared/utils');

/** Status React component used to display Juju status. */
class Status extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      highestStatus: utils.STATUSES.OK,
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
    this.setState({highestStatus: utils.STATUSES.OK});
  }

  componentDidMount() {
    this._setTrafficLight();
  }

  componentDidUpdate() {
    // Update the state with the new status now that all status changes/renders
    // are complete.
    this._setTrafficLight();
  }

  /**
    Generate the current model status.
    @returns {Object} The resulting element.
  */
  _setTrafficLight() {
    const db = this.props.db;
    let statuses = [];
    db.services.toArray().forEach(application => {
      const app = application.getAttrs();
      statuses.push(app.status.current);
    });
    db.units.toArray().forEach(unit => {
      statuses.push(utils.getHighestStatus([unit.agentStatus, unit.workloadStatus]));
    });
    db.machines.toArray().map(machine => {
      statuses.push(machine.agent_state);
    });
    const highest = utils.getHighestStatus(statuses);
    if (highest && (this.state.highestStatus !== highest)) {
      this.setState({highestStatus: highest});
    }
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
    const units = utils.getRealUnits(db.units);
    const remoteApplications = db.remoteServices.toArray();
    const counts = {
      applications: applications.length,
      machines: machines.length,
      relations: relations.length,
      remoteApplications: remoteApplications.length,
      units: units.length
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
      elements.push(this._generateApplications(applications));
      if (counts.units) {
        elements.push(this._generateUnits(units));
      }
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
    const options = ['none'].concat(utils.STATUS_ORDER).map(status => {
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
    let title = `Everything is ${utils.STATUSES.OK}`;
    switch (highestStatus) {
      case utils.STATUSES.OK:
        title = `Everything is ${utils.STATUSES.OK}`;
        break;
      case utils.STATUSES.PENDING:
        title = 'Items are pending';
        break;
      case utils.STATUSES.ERROR:
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
    return (
      <StatusRemoteApplicationList
        changeState={this.props.changeState}
        generatePath={this.props.generatePath}
        key="remote-applications"
        remoteApplications={remoteApplications}
        statusFilter={this.state.statusFilter} />);
  }

  /**
    Generate the URL for clicking on a charm.
    @param charmId {String} A charm id.
    @returns {String} The charm url.
  */
  _generateCharmURL(charmId) {
    return this.props.generatePath(
      this._generateCharmClickState(charmId));
  }

  /**
    Generate the URL for clicking on a machine.
    @param machineId {String} A machine id.
    @returns {String} The machine url.
  */
  _generateMachineURL(machineId) {
    return this.props.generatePath(
      this._generateMachineClickState(machineId));
  }

  /**
    Generate the URL for clicking on an application.
    @param applicationId {String} An application id.
    @returns {String} The application url.
  */
  _generateApplicationURL(applicationName) {
    return this.props.generatePath(
      this._generateApplicationClickState(applicationName));
  }

  /**
    Generate the applications fragment of the status.
    @param {Array} applications The applications as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateApplications(applications) {
    return (
      <StatusApplicationList
        applications={applications}
        changeState={this.props.changeState}
        generateApplicationClickState={this._generateApplicationClickState.bind(this)}
        generateCharmURL={this._generateCharmURL.bind(this)}
        generatePath={this.props.generatePath}
        key="applications"
        onCharmClick={this._navigateToCharm.bind(this)}
        statusFilter={this.state.statusFilter} />);
  }

  /**
    Generate the units fragment of the status.
    @param {Array} units The units as included in the GUI db.
    @param {Array} applications The applications as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateUnits(units) {
    return (
      <StatusUnitList
        applications={this.props.db.services}
        changeState={this.props.changeState}
        generateMachineURL={this._generateMachineURL.bind(this)}
        generatePath={this.props.generatePath}
        generateUnitClickState={this._generateUnitClickState.bind(this)}
        key="units"
        onMachineClick={this._navigateToMachine.bind(this)}
        statusFilter={this.state.statusFilter}
        units={units} />);
  }

  /**
    Generate the machines fragment of the status.
    @param {Array} machines The machines as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateMachines(machines) {
    return (
      <StatusMachineList
        changeState={this.props.changeState}
        generateMachineClickState={this._generateMachineClickState.bind(this)}
        generatePath={this.props.generatePath}
        key="machines"
        machines={machines}
        statusFilter={this.state.statusFilter} />);
  }

  /**
    Generate the relations fragment of the status.
    @param {Array} relations The relations as included in the GUI db.
    @returns {Object} The resulting element.
  */
  _generateRelations(relations) {
    return (
      <StatusRelationList
        applications={this.props.db.services}
        changeState={this.props.changeState}
        generateApplicationURL={this._generateApplicationURL.bind(this)}
        generatePath={this.props.generatePath}
        key="relations"
        onApplicationClick={this._navigateToApplication.bind(this)}
        relations={relations}
        statusFilter={this.state.statusFilter} />);
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
      filter: PropTypes.func.isRequired,
      toArray: PropTypes.func.isRequired
    }).isRequired,
    relations: shapeup.shape({
      filter: PropTypes.func.isRequired
    }).isRequired,
    remoteServices: shapeup.shape({
      map: PropTypes.func.isRequired,
      toArray: PropTypes.func.isRequired
    }).isRequired,
    services: shapeup.shape({
      filter: PropTypes.func.isRequired,
      getById: PropTypes.func.isRequired,
      toArray: PropTypes.func.isRequired
    }).isRequired,
    units: shapeup.shape({
      filter: PropTypes.func.isRequired,
      toArray: PropTypes.func.isRequired
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
  }).frozen.isRequired
};

module.exports = Status;
