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
    */
    _scaleUpService: function() {
      var state = this.state;
      var appState = {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.serviceId,
            activeComponent: 'units'
          }}};
      var numUnits = this.state['num-units'];
      // Constraints will not be shown if the user wants to manually place.
      if (!state.constraintsVisibility) {
        // db, env, and service have already been bound to this function in
        // the app.js definition.
        this.props.addGhostAndEcsUnits(numUnits);
        appState.sectionB = {
          component: 'machine'
        };
      } else {
        var constraints = this.state.constraints;
        this.props.createMachinesPlaceUnits(numUnits, {
          'cpu-power': constraints.cpu,
          'cpu-cores': constraints.cores,
          'mem': constraints.mem,
          'root-disk': constraints.disk
        });
      }
      this.props.changeState(appState);
    },

    render: function() {
      var buttons = [{
        title: 'Confirm',
        action: this._scaleUpService
      }];

      return (
        <div className="scale-service">
          <div className="scale-service--units">
            <input
              className="scale-service--units__input"
              type="text"
              name="num-units"
              onChange={this._updateState}
              ref="numUnitsInput"/>
            <span className="scale-service--units__span">units</span>
          </div>
          <div className="scale-service--selector">
            <div>
              <input
                className="scale-service--selector__radio"
                name="placement" type="radio"
                onChange={this._toggleConstraints}
                id="auto-place-units"
                ref="autoPlaceUnitsToggle" />
              <label htmlFor="auto-place-units">1 unit per machine</label>
            </div>
            <div>
              <input
                className="scale-service--selector__radio"
                name="placement" type="radio"
                onChange={this._toggleConstraints}
                defaultChecked={true}
                id="manually-place-units" />
              <label htmlFor="manually-place-units">Manually place</label>
            </div>
          </div>
          <div className={this._generateClasses()} ref="constraintsContainer">
            <juju.components.Constraints
              valuesChanged={this._updateConstraints} />
          </div>
          <juju.components.ButtonRow buttons={buttons} />
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'constraints'
] });
