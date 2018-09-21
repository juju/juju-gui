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
const maracaPropTypes = require('../../../../maraca/prop-types');
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
    const {applications, machines, units} = this.props.valueStore;
    let statuses = [];
    Object.keys(applications).forEach(key => {
      const app = applications[key];
      statuses.push(app.status.current);
    });
    Object.keys(units).forEach(key => {
      const unit = units[key];
      statuses.push(utils.getHighestStatus(
        [unit.agentStatus.current, unit.workloadStatus.current]));
    });
    Object.keys(machines).map(key => {
      const machine = machines[key];
      statuses.push(machine.agentStatus.current);
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
    const {valueStore} = this.props;
    const {model} = this.props;
    const counts = {
      applications: Object.keys(valueStore.applications).length,
      machines: Object.keys(valueStore.machines).length,
      relations: Object.keys(valueStore.relations).length,
      remoteApplications: Object.keys(valueStore.remoteApplications).length,
      units: Object.keys(valueStore.units).length
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
    const {remoteApplications} = this.props.valueStore;
    if (!Object.keys(remoteApplications).length) {
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
    const {applications} = this.props.valueStore;
    if (!Object.keys(applications).length) {
      return null;
    }
    return (
      <StatusApplicationList
        applications={applications}
        generateApplicationOnClick={this.props.generateApplicationOnClick}
        generateApplicationURL={this.props.generateApplicationURL}
        generateCharmURL={this.props.generateCharmURL}
        onCharmClick={this.props.navigateToCharm}
        statusFilter={this.state.statusFilter}
        units={this.props.valueStore.units} />);
  }

  /**
    Generate the units fragment of the status.
    @returns {Object} The resulting element.
  */
  _generateUnits() {
    const {units} = this.props.valueStore;
    if (!Object.keys(units).length) {
      return null;
    }
    return (
      <StatusUnitList
        applications={this.props.valueStore.applications}
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
    const {machines} = this.props.valueStore;
    if (!Object.keys(machines).length) {
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
    const {relations} = this.props.valueStore;
    if (!Object.keys(relations).length) {
      return null;
    }
    return (
      <StatusRelationList
        applications={this.props.valueStore.applications}
        generateApplicationURL={this.props.generateApplicationURL}
        onApplicationClick={this.props.navigateToApplication}
        relations={relations}
        statusFilter={this.state.statusFilter} />);
  }

  render() {
    let content;
    const {model} = this.props;
    if (!model || !model.modelUUID) {
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
  generateApplicationOnClick: PropTypes.func.isRequired,
  generateApplicationURL: PropTypes.func.isRequired,
  generateCharmURL: PropTypes.func.isRequired,
  generateMachineOnClick: PropTypes.func.isRequired,
  generateMachineURL: PropTypes.func.isRequired,
  generateUnitOnClick: PropTypes.func.isRequired,
  generateUnitURL: PropTypes.func.isRequired,
  model: shapeup.shape({
    cloud: PropTypes.string,
    environmentName: PropTypes.string,
    modelUUID: PropTypes.string,
    region: PropTypes.string,
    sla: PropTypes.string,
    version: PropTypes.string
  }),
  navigateToApplication: PropTypes.func.isRequired,
  navigateToCharm: PropTypes.func.isRequired,
  navigateToMachine: PropTypes.func.isRequired,
  valueStore: PropTypes.shape({
    applications: maracaPropTypes.applications,
    machines: maracaPropTypes.machines,
    relations: maracaPropTypes.relations,
    remoteApplications: maracaPropTypes.remoteApplications,
    units: maracaPropTypes.units
  })
};

module.exports = Status;
