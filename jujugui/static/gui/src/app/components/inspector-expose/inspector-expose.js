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

YUI.add('inspector-expose', function() {

  juju.components.InspectorExpose = React.createClass({

    /**
      The callable to be passed to the unit items for navigating to the unit
      details.

      @method _unitItemAction
      @param {Object} e The click event.
    */
    _unitItemAction: function(e) {
      var unitId = e.currentTarget.getAttribute('data-id').split('/')[1];
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.service.get('id'),
            unit: unitId,
            activeComponent: 'unit'
          }
        }
      });
    },

    /**
      Generate a list of units for the service

      @method _generateUnits
      @returns {Array} A list of units.
    */
    _generateUnits: function() {
      var units = [];
      this.props.units.toArray().forEach(function(unit) {
        units.push(
          <juju.components.InspectorExposeUnit
            key={unit.id}
            action={this._unitItemAction}
            unit={unit} />);
      }, this);
      return units;
    },

    /**
      Display a list of units if the service is exposed.

      @method _displayUnitList
      @returns {Object} A list of units.
    */
    _displayUnitList: function() {
      if (!this.props.service.get('exposed')) {
        return;
      }
      return <ul className="inspector-expose__units">
          {this._generateUnits()}
        </ul>;
    },

    /**
      Expose the service when toggled.

      @method _handleExposeChange
    */
    _handleExposeChange: function() {
      var service = this.props.service;
      var serviceId = service.get('id');
      if (service.get('exposed')) {
        this.props.unexposeService(serviceId,
            this._exposeServiceCallback, {});
      } else {
        this.props.exposeService(serviceId,
            this._exposeServiceCallback, {});
      }
    },

    /**
      Callback to handle errors when exposing a service.

      @method _exposeServiceCallback
      @param {object} e The expose event
    */
    _exposeServiceCallback: function(e) {
      if (e.err) {
        console.error(e.err);
        this.props.addNotification({
          title: 'Exposing charm failed',
          message: 'The charm failed to expose:' + e.err,
          level: 'error'
        });
      }
    },

    render: function() {
      var toggle = {
        key: 'expose-toggle'
      };
      return (
        <div className="inspector-expose">
            <div className="inspector-expose__control">
              <juju.components.BooleanConfig
                key={toggle.key}
                ref={toggle.key}
                option={toggle}
                onChange={this._handleExposeChange}
                label="Expose service"
                config={this.props.service.get('exposed')} />
            </div>
            <p className="inspector-expose__warning">
              Exposing this service may make it publicly accessible from
              the web
            </p>
            {this._displayUnitList()}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'boolean-config',
  'inspector-expose-unit'
]});
