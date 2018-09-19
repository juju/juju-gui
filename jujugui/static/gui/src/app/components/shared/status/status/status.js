/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const StatusApplicationList = require('../application-list/application-list');
const StatusModel = require('../model/model');
const StatusMachineList = require('../machine-list/machine-list');
const StatusRemoteApplicationList = require(
  '../remote-application-list/remote-application-list');
const StatusRelationList = require('../relation-list/relation-list');
const StatusUnitList = require('../unit-list/unit-list');
const Panel = require('../../../panel/panel');
const utils = require('../../utils');

/** Status React component used to display Juju status. */
class Status extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      highestStatus: utils.STATUSES.OK,
      statusFilter: null
    };
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
    const {entities} = this.props;
    let statuses = [];
    entities.applications.forEach(application => {
      const app = application.getAttrs();
      statuses.push(app.status.current);
    });
    entities.units.forEach(unit => {
      statuses.push(utils.getHighestStatus([unit.agentStatus, unit.workloadStatus]));
    });
    entities.machines.map(machine => {
      statuses.push(machine.agent_state);
    });
    const highest = utils.getHighestStatus(statuses);
    if (highest && (this.state.highestStatus !== highest)) {
      this.setState({highestStatus: highest});
    }
  }

  /**
    Set the filter status.
    @param status {String} A status.
  */
  _changeFilterStatus(status) {
    this.setState({statusFilter: status});
  }

  /**
    Generate the model fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateModel() {
    const {entities} = this.props;
    const {model} = entities;
    const counts = {
      applications: entities.applications.length,
      machines: entities.machines.length,
      relations: entities.relations.length,
      remoteApplications: entities.remoteApplications.length,
      units: entities.units.length
    };
    return (
      <StatusModel
        changeFilter={this._changeFilterStatus.bind(this)}
        counts={counts}
        highestStatus={this.state.highestStatus}
        model={model}
        statusFilter={this.state.statusFilter} />);
  }

  /**
    Generate the remote applications fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateRemoteApplications() {
    const {remoteApplications} = this.props.entities;
    if (remoteApplications.length === 0) {
      return null;
    }
    return (
      <StatusRemoteApplicationList
        remoteApplications={remoteApplications}
        statusFilter={this.state.statusFilter} />);
  }

  /**
    Generate the applications fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateApplications() {
    const {applications} = this.props.entities;
    if (applications.length === 0) {
      return null;
    }
    return (
      <StatusApplicationList
        applications={applications}
        generateApplicationOnClick={this.props.generateApplicationOnClick}
        generateApplicationURL={this.props.generateApplicationURL}
        generateCharmURL={this.props.generateCharmURL}
        onCharmClick={this.props.navigateToCharm}
        statusFilter={this.state.statusFilter} />);
  }

  /**
    Generate the units fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateUnits() {
    const {units} = this.props.entities;
    if (units.length === 0) {
      return null;
    }
    return (
      <StatusUnitList
        applications={this.props.entities.applications}
        generateMachineURL={this.props.generateMachineURL}
        generateUnitOnClick={this.props.generateUnitOnClick}
        generateUnitURL={this.props.generateUnitURL}
        onMachineClick={this.props.navigateToMachine}
        statusFilter={this.state.statusFilter}
        units={units} />);
  }

  /**
    Generate the machines fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateMachines() {
    const {machines} = this.props.entities;
    if (machines.length === 0) {
      return null;
    }
    return (
      <StatusMachineList
        generateMachineOnClick={this.props.generateMachineOnClick}
        generateMachineURL={this.props.generateMachineURL}
        machines={machines}
        statusFilter={this.state.statusFilter} />);
  }

  /**
    Generate the relations fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateRelations() {
    const {relations} = this.props.entities;
    if (relations.length === 0) {
      return null;
    }
    return (
      <StatusRelationList
        applications={this.props.entities.applications}
        generateApplicationURL={this.props.generateApplicationURL}
        onApplicationClick={this.props.navigateToApplication}
        relations={relations}
        statusFilter={this.state.statusFilter} />);
  }

  render() {
    let content;
    const {entities} = this.props;
    if (!entities.model || !entities.model.modelUUID) {
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
        </React.Fragment>
      );
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
  entities: PropTypes.shape({
    applications: PropTypes.array.isRequired,
    machines: PropTypes.array.isRequired,
    model: shapeup.shape({
      cloud: PropTypes.string,
      environmentName: PropTypes.string,
      modelUUID: PropTypes.string,
      region: PropTypes.string,
      sla: PropTypes.string,
      version: PropTypes.string
    }),
    relations: PropTypes.array.isRequired,
    remoteApplications: PropTypes.array.isRequired,
    units: PropTypes.array.isRequired
  }),
  generateApplicationOnClick: PropTypes.func.isRequired,
  generateApplicationURL: PropTypes.func.isRequired,
  generateCharmURL: PropTypes.func.isRequired,
  generateMachineOnClick: PropTypes.func.isRequired,
  generateMachineURL: PropTypes.func.isRequired,
  generateUnitOnClick: PropTypes.func.isRequired,
  generateUnitURL: PropTypes.func.isRequired,
  navigateToApplication: PropTypes.func.isRequired,
  navigateToCharm: PropTypes.func.isRequired,
  navigateToMachine: PropTypes.func.isRequired
};

module.exports = Status;
