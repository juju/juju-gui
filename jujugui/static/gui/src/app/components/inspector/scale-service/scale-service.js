/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../button-row/button-row');
const Constraints = require('../../constraints/constraints');

class ScaleService extends React.Component {
  constructor() {
    super();
    this.state = {
      constraints: null,
      constraintsVisibility: false
    };
  }

  /**
    Update the state with the new constraints values.

    @method _updateConstraints
    @param {Object} constraints The new constraints values.
  */
  _updateConstraints(constraints) {
    this.setState({constraints: constraints});
  }

  /**
    Event handler for the radio button selection which should show or
    hide the constraint options.

    @method _toggleConstraints
    @param {Object} e The change event.
  */
  _toggleConstraints(e) {
    var id = e.currentTarget.id;
    this.setState({ constraintsVisibility: id === 'auto-place-units'});
  }

  /**
    Generates the classes for each render for the constraints element.

    @method _generateClasses
  */
  _generateClasses() {
    return classNames(
      'scale-service--constraints',
      {
        hidden: !this.state.constraintsVisibility
      }
    );
  }

  /**
    When an input element value is changed by the user we update state
    so that we don't have to query the DOM again when they submit.

    @method _udpateState
    @param {Object} e The change event.
  */
  _updateState(e) {
    var currentTarget = e.currentTarget;
    var state = {};
    state[currentTarget.name] = currentTarget.value;
    this.setState(state);
  }

  /**
    Handles calling the appropriate methods to scale up the service.

    @method _scaleUpService
    @param {Object} e An event object.
  */
  _scaleUpService(e) {
    if (e) {
      e.preventDefault();
    }
    const state = this.state;
    const appState = {
      gui: {
        inspector: {id: this.props.serviceId, activeComponent: 'units'}
      }
    };
    const numUnits = this.state['num-units'];
    // Constraints will not be shown if the user wants to manually place.
    if (!state.constraintsVisibility) {
      // db, env, and service have already been bound to this function in
      // the app.js definition.
      this.props.addGhostAndEcsUnits(numUnits);
      appState.gui.machines = '';
    } else {
      const constraints = this.state.constraints;
      delete constraints.series;
      this.props.createMachinesPlaceUnits(numUnits, constraints);
    }
    this.props.changeState(appState);
  }

  render() {
    const props = this.props;
    const disabled = props.acl.isReadOnly();
    const buttons = [{
      disabled: disabled,
      title: 'Confirm',
      submit: true
    }];

    return (
      <form className="scale-service"
        onSubmit={this._scaleUpService.bind(this)}>
        <div className="scale-service--units">
          <input
            autoComplete="off"
            className="scale-service--units__input"
            disabled={disabled}
            min="0"
            name="num-units"
            onChange={this._updateState.bind(this)}
            ref="numUnitsInput"
            step="1"
            type="number" />
          <span className="scale-service--units__span">units</span>
        </div>
        <div className="scale-service--selector">
          <div>
            <input
              className="scale-service--selector__radio"
              disabled={disabled}
              id="auto-place-units" name="placement"
              onChange={this._toggleConstraints.bind(this)}
              ref="autoPlaceUnitsToggle"
              type="radio" />
            <label htmlFor="auto-place-units">1 unit per machine</label>
          </div>
          <div>
            <input
              className="scale-service--selector__radio"
              defaultChecked={true}
              disabled={disabled} id="manually-place-units"
              name="placement"
              onChange={this._toggleConstraints.bind(this)}
              type="radio" />
            <label htmlFor="manually-place-units">Manually place</label>
          </div>
        </div>
        <div className={this._generateClasses()} ref="constraintsContainer">
          <Constraints
            disabled={disabled}
            hasUnit={true}
            providerType={props.providerType}
            valuesChanged={this._updateConstraints.bind(this)} />
        </div>
        <ButtonRow buttons={buttons} />
      </form>
    );
  }

  componentDidMount() {
    this.refs.numUnitsInput.focus();
  }
};

ScaleService.propTypes = {
  acl: PropTypes.object.isRequired,
  addGhostAndEcsUnits: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  createMachinesPlaceUnits: PropTypes.func.isRequired,
  providerType: PropTypes.string,
  serviceId: PropTypes.string.isRequired
};

module.exports = ScaleService;
