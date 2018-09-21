/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const propTypes = require('../../maraca/prop-types');
const SharedStatus = require('../shared/status/status/status');

/** Status React component used to display Juju status. */
class Status extends React.Component {

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
    Generate the URL for clicking on a unit.
    @param unitId {String} A unit id.
    @returns {String} The unit url.
  */
  _generateUnitURL(unitId) {
    return this.props.generatePath(
      this._generateUnitClickState(unitId));
  }

  /**
    Generate a function to be called when clicking on an application.
    @param applicationName {String} An application id.
    @returns {Function} A function to call on click.
  */
  _generateApplicationOnClick(applicationName) {
    return this.props.changeState.bind(
      this, this._generateApplicationClickState(applicationName));
  }

  /**
    Generate a function to be called when clicking on a unit.
    @param unitId {String} A unit id.
    @returns {Function} A function to call on click.
  */
  _generateUnitOnClick(unitId) {
    return this.props.changeState.bind(
      this, this._generateUnitClickState(unitId));
  }

  /**
    Generate a function to be called when clicking on a machine.
    @param machineId {String} A machine id.
    @returns {Function} A function to call on click.
  */
  _generateMachineOnClick(machineId) {
    return this.props.changeState.bind(
      this, this._generateMachineClickState(machineId));
  }

  render() {

    return (
      <SharedStatus
        generateApplicationOnClick={this._generateApplicationOnClick.bind(this)}
        generateApplicationURL={this._generateApplicationURL.bind(this)}
        generateCharmURL={this._generateCharmURL.bind(this)}
        generateMachineOnClick={this._generateMachineOnClick.bind(this)}
        generateMachineURL={this._generateMachineURL.bind(this)}
        generateUnitOnClick={this._generateUnitOnClick.bind(this)}
        generateUnitURL={this._generateUnitURL.bind(this)}
        model={this.props.model}
        navigateToApplication={this._navigateToApplication.bind(this)}
        navigateToCharm={this._navigateToCharm.bind(this)}
        navigateToMachine={this._navigateToMachine.bind(this)}
        valueStore={this.props.valueStore} />
    );
  }
};

Status.propTypes = {
  changeState: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  model: shapeup.shape({
    cloud: PropTypes.string,
    environmentName: PropTypes.string,
    modelUUID: PropTypes.string,
    region: PropTypes.string,
    sla: PropTypes.string,
    version: PropTypes.string
  }).frozen.isRequired,
  valueStore: shapeup.shape({
    applications: propTypes.applications,
    machines: propTypes.machines,
    relations: propTypes.relations,
    remoteApplications: propTypes.remoteApplications,
    units: propTypes.units
  })
};

module.exports = Status;
