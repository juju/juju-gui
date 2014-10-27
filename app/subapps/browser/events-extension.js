/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2014 Canonical Ltd.

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

/**
  Separate browser event handling into its own extension for cleaner
  code and testing.

  @module juju.browser
*/

YUI.add('subapp-browser-events', function(Y) {
  var browser = Y.namespace('juju.browser');

  /**
    Event handling for the browser subapp.

    @method BrowserEventsExtension
  */
  function BrowserEventsExtension() {}

  BrowserEventsExtension.prototype = {
    /**
      Handle changes in state, typically navigation requests.

      @method _onChangeState
      @param {Object} e The event facade.
    */
    _onChangeState: function(e) {
      // Cancel the inspectorRetryTimer, if there is one.
      // The user may be navigating away from the inspector, but first
      // triggered the inspector's retry mechanism. This makes sure the timer
      // won't suddenly have the inspector show up after the user navigates
      // away.
      var timer = this.get('inspectorRetryTimer');
      if (timer) {
        timer.cancel();
        this.set('inspectorRetries', 0);
      }
      this.state.set('allowInspector', true);
      var state = e.details[0];
      var url = this.state.generateUrl(state);
      this.navigate(url);
    },

    /**
      Handle service deploys by opening up the appropriate inspector.

      @method _onServiceDeployed
      @param {Object} e The event facade.
    */
    _onServiceDeployed: function(e) {
      var activeInspector = this._inspector;
      if (activeInspector && !activeInspector.get('destroyed')) {
        var activeClientId = activeInspector.get('model')
          .get('clientId');
        // Because multiple services can be deployed at once we only want to
        // switch to a deployed inspector if there is currently one open.
        // And we only want to switch to that specific inspector.
        if (activeClientId === e.clientId) {
          this.fire('changeState', {
            sectionA: {
              component: 'inspector',
              metadata: { id: e.serviceName }
            }});
        }
      }
    },

    /**
      Handle highlight events for services/units.

      @method _onHighlight
      @param {Object} e The event facade.
    */
    _onHighlight: function(e) {
      var serviceName = e.serviceName;
      var db = this.get('db');
      this.get('topo').fire('highlight', { serviceName: serviceName,
        highlightRelated: e.highlightRelated });
      var changedMachines = [];
      db.units.each(function(unit) {
        if (unit.displayName.split('/')[0] !== serviceName) {
          unit.hide = true;
          db.units.fire('change', {
            changed: {machine: {newVal: unit.machine}},
            instance: unit
          });
          if (changedMachines.indexOf(unit.machine) === -1) {
            changedMachines.push(unit.machine);
          }
        }
      });
      changedMachines.forEach(function(machineId) {
        db.machines.fire('change', {
          changed: true,
          instance: db.machines.getById(machineId)
        });
      });
    },

    /**
      Handle unhighlight events for services/units.

      @method _onUnhighlight
      @param {Object} e The event facade.
    */
    _onUnhighlight: function(e) {
      var db = this.get('db');
      var serviceName = e.serviceName;
      this.get('topo').fire('unhighlight', { serviceName: serviceName,
        unhighlightRelated: e.unhighlightRelated });
      var changedMachines = [];
      db.units.each(function(unit) {
        if (unit.displayName.split('/')[0] !== serviceName) {
          unit.hide = false;
          db.units.fire('change', {
            changed: {machine: {newVal: unit.machine}},
            instance: unit
          });
          if (changedMachines.indexOf(unit.machine) === -1) {
            changedMachines.push(unit.machine);
          }
        }
      });
      changedMachines.forEach(function(machineId) {
        db.machines.fire('change', {
          changed: true,
          instance: db.machines.getById(machineId)
        });
      });
    },

    /**
      Handle fade events for services/units.

      @method _onFade
      @param {Object} e The event facade.
    */
    _onFade: function(e) {
      var serviceNames = e.serviceNames;
      var fadeLevels = {
        'dim': '0.6',
        'hidden': '0.2'
      };
      var db = this.get('db');
      this.get('topo').fire('fade', { serviceNames: serviceNames,
        alpha: fadeLevels[e.fadeLevel] });
      db.units.each(function(unit) {
        if (serviceNames.indexOf(unit.displayName.split('/')[0]) !== -1) {
          unit.fade = true;
          db.units.fire('change', {
            changed: {machine: {newVal: unit.machine}},
            instance: unit
          });
        }
      });
    },

    /**
      Handle show events for services/units.

      @method _onShow
      @param {Object} e The event facade.
    */
    _onShow: function(e) {
      var serviceNames = e.serviceNames;
      var db = this.get('db');
      this.get('topo').fire('show', { serviceNames: serviceNames });
      db.units.each(function(unit) {
        if (serviceNames.indexOf(unit.displayName.split('/')[0]) !== -1) {
          unit.fade = false;
          db.units.fire('change', {
            changed: {machine: {newVal: unit.machine}},
            instance: unit
          });
        }
      });
    }
  };

  browser.BrowserEventsExtension = BrowserEventsExtension;

});
