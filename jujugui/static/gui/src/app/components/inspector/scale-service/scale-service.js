/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

YUI.add('scale-service', function() {

  juju.components.ScaleService = React.createClass({

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addGhostAndEcsUnits: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      createMachinesPlaceUnits: React.PropTypes.func.isRequired,
      providerType: React.PropTypes.string,
      serviceId: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
      return {
        constraints: null,
        constraintsVisibility: false
      };
    },

    /**
      Update the state with the new constraints values.

      @method _updateConstraints
      @param {Object} constraints The new constraints values.
    */
    _updateConstraints: function(constraints) {
      this.setState({constraints: constraints});
    },

    /**
      Event handler for the radio button selection which should show or
      hide the constraint options.

      @method _toggleConstraints
      @param {Object} e The change event.
    */
    _toggleConstraints: function(e) {
      var id = e.currentTarget.id;
      this.setState({ constraintsVisibility: id === 'auto-place-units'});
    },

    /**
      Generates the classes for each render for the constraints element.

      @method _generateClasses
    */
    _generateClasses: function() {
      return classNames(
        'scale-service--constraints',
        {
          hidden: !this.state.constraintsVisibility
        }
      );
    },

    /**
      When an input element value is changed by the user we update state
      so that we don't have to query the DOM again when they submit.

      @method _udpateState
      @param {Object} e The change event.
    */
    _updateState: function(e) {
      var currentTarget = e.currentTarget;
      var state = {};
      state[currentTarget.name] = currentTarget.value;
      this.setState(state);
    },

    /**
      Handles calling the appropriate methods to scale up the service.

      @method _scaleUpService
      @param {Object} e An event object.
    */
    _scaleUpService: function(e) {
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
    },

    render: function() {
      const props = this.props;
      const disabled = props.acl.isReadOnly();
      const buttons = [{
        disabled: disabled,
        title: 'Confirm',
        submit: true
      }];

      return (
        <form className="scale-service"
          onSubmit={this._scaleUpService}>
          <div className="scale-service--units">
            <input
              className="scale-service--units__input"
              disabled={disabled}
              type="number"
              min="0"
              step="1"
              autoComplete="off"
              name="num-units"
              onChange={this._updateState}
              ref="numUnitsInput"/>
            <span className="scale-service--units__span">units</span>
          </div>
          <div className="scale-service--selector">
            <div>
              <input
                className="scale-service--selector__radio"
                disabled={disabled}
                name="placement" type="radio"
                onChange={this._toggleConstraints}
                id="auto-place-units"
                ref="autoPlaceUnitsToggle" />
              <label htmlFor="auto-place-units">1 unit per machine</label>
            </div>
            <div>
              <input
                className="scale-service--selector__radio"
                disabled={disabled}
                name="placement" type="radio"
                onChange={this._toggleConstraints}
                defaultChecked={true}
                id="manually-place-units" />
              <label htmlFor="manually-place-units">Manually place</label>
            </div>
          </div>
          <div className={this._generateClasses()} ref="constraintsContainer">
            <juju.components.Constraints
              disabled={disabled}
              hasUnit={true}
              providerType={props.providerType}
              valuesChanged={this._updateConstraints} />
          </div>
          <juju.components.ButtonRow buttons={buttons} />
        </form>
      );
    },

    componentDidMount: function() {
      this.refs.numUnitsInput.focus();
    },
  });

}, '0.1.0', { requires: [
  'button-row',
  'constraints'
] });
