/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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
 * Provide code for the ServiceInpsector bits.
 *
 * @module views
 * @submodule views.inspector
 */

YUI.add('juju-view-inspector', function(Y) {
  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      models = Y.namespace('juju.models'),
      plugins = Y.namespace('juju.plugins'),
      utils = Y.namespace('juju.views.utils'),
      viewletNS = Y.namespace('juju.viewlets'),
      ns = Y.namespace('juju.views.inspector');

  /**
   * @class exposeButtonMixin
   */
  ns.exposeButtonMixin = {
    events: {
      '.unexposeService': {mousedown: 'unexposeService'},
      '.exposeService': {mousedown: 'exposeService'}
    },

    /**
     * Unexpose the service stored in this view.
     * Pass this._unexposeServiceCallback as callback to be called when
     * the response is returned by the backend.
     *
     * @method unexposeService
     * @return {undefined} Nothing.
     */
    unexposeService: function() {
      var dataSource = this.viewletManager;
      var service = dataSource.get('model'),
          env = dataSource.get('env');
      env.unexpose(service.get('id'),
          Y.bind(this._unexposeServiceCallback, this));
    },

    /**
     * Callback called when the backend returns a response to a service
     * unexpose call. Update the service model instance or, if an error
     * occurred, add a failure notification.
     *
     * @method _unexposeServiceCallback
     * @param {Object} ev An event object (with "err" and "service_name"
     *  attributes).
     * @return {undefined} Nothing.
     */
    _unexposeServiceCallback: function(ev) {
      var dataSource = this.viewletManager;
      var service = dataSource.get('model'),
          db = dataSource.get('db');
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error un-exposing service',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              link: undefined, // XXX See note below about getModelURL.
              modelId: service
            })
        );
      } else {
        service.set('exposed', false);
        db.fire('update');
      }
    },

    /**
     * Expose the service stored in this view.
     * Pass this._exposeServiceCallback as callback to be called when
     * the response is returned by the backend.
     *
     * @method exposeService
     * @return {undefined} Nothing.
     */
    exposeService: function() {
      var dataSource = this.viewletManager;
      var service = dataSource.get('model'),
          env = dataSource.get('env');
      env.expose(service.get('id'),
          Y.bind(this._exposeServiceCallback, this));
    },

    /**
     * Callback called when the backend returns a response to a service
     * expose call. Update the service model instance or, if an error
     * occurred, add a failure notification.
     *
     * @method _exposeServiceCallback
     * @param {Object} ev An event object (with "err" and "service_name"
     *  attributes).
     * @return {undefined} Nothing.
     */
    _exposeServiceCallback: function(ev) {
      var dataSource = this.viewletManager;
      var service = dataSource.get('model'),
          db = dataSource.get('db');
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error exposing service',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              link: undefined, // XXX See note below about getModelURL.
              modelId: service
            })
        );
      } else {
        service.set('exposed', true);
        db.fire('update');
      }
    }
  };



  /**
    A collection of methods and properties which will be mixed into the
    prototype of the viewlet manager controller to add the functionality for
    the ghost inspector interactions.

    @property serviceInspector
    @submodule juju.controller
    @type {Object}
  */
  Y.namespace('juju.controller').serviceInspector = {
    'getName': function() {
      return this.viewletManager.getName();
    },
    'bind': function(model, viewlet) {
      this.viewletManager.bindingEngine.bind(model, viewlet);
      return this;
    },
    'render': function() {
      this.viewletManager.render();
      return this;
    },

    /**
      Handles exposing the service.

      @method toggleExpose
      @param {Y.EventFacade} e An event object.
      @return {undefined} Nothing.
    */
    toggleExpose: function(e) {
      var service = this.viewletManager.get('model');
      if (service.get('exposed')) {
        this.unexposeService();
      } else {
        this.exposeService();
      }
    },

    /**
      Show a unit within the left-hand panel.
      Note that, due to the revived model below, this model can potentially
      be out of date, as the POJO from the LazyModelList is the one kept up
      to date.  This is just a first-pass and will be changed later.

      @method showUnitDetails
      @param {object} ev The click event.
      @return {undefined} Nothing.
     */
    showUnitDetails: function(ev) {
      ev.halt();
      var db = this.viewletManager.get('db');
      var unitName = ev.currentTarget.getData('unit');
      var service = db.services.getById(unitName.split('/')[0]);
      var unit = service.get('units').getById(unitName);
      this.viewletManager.showViewlet('UnitDetails', unit);
      this.viewletManager.fire('inspectorTakeoverStarting');
    },

    /**
      Upgrades a service to the one specified in the event target's upgradeto
      data attribute.

      @method upgradeService
      @param {Y.EventFacade} ev Click event object.
    */
    upgradeService: function(ev) {
      ev.halt();
      var viewletManager = this.viewletManager,
          db = viewletManager.get('db'),
          env = viewletManager.get('env'),
          store = viewletManager.get('store'),
          service = this.model,
          upgradeTo = ev.currentTarget.getData('upgradeto');
      if (!upgradeTo) {
        return;
      }
      if (!env.setCharm) {
        db.notifications.add(new db.models.Notification({
          title: 'Environment does not support setCharm',
          message: 'Your juju environment does not support setCharm/' +
              'upgrade-charm through the API; please try from the ' +
              'command line.',
          level: 'error'
        }));
        console.warn('Environment does not support setCharm.');
      }
      env.setCharm(service.get('id'), upgradeTo, false, function(result) {
        if (result.err) {
          db.notifications.create({
            title: 'Error setting charm.',
            message: result.err,
            level: 'error'
          });
          return;
        }
        env.get_charm(upgradeTo, function(data) {
          if (data.err) {
            db.notifications.create({
              title: 'Error retrieving charm.',
              message: data.err,
              level: 'error'
            });
          }
          // Set the charm on the service.
          service.set('charm', upgradeTo);
          store.promiseUpgradeAvailability(data.result, db.charms).then(
              function(latestId) {
                // Redraw(?) the inspector.
                service.set('upgrade_available', !!latestId);
                service.set('upgrade_to', !!latestId ? 'cs:' + latestId : '');
              },
              function(error) {
                db.notifications.create({
                  title: 'Error retrieving charm.',
                  message: error,
                  level: 'error'
                });
              });
        });
      });
    },

    /**
      Reloads the inspector in order to ensure that data is up-to-date. in the
      case of added/removed fields.

      @method reloadInspector
    */
    reloadInspector: function() {
      // Ensure that any flags which would lead to a reload notification are
      // unset.
      this.model.set('charmChanged', false);

      // Reload the inspector itself.
      this.viewletManager.after('destroy', function() {
        this.get('environment').createServiceInspector(this.get('model'));
      });
      this.viewletManager.destroy();
    },

    /**
      Toggles the close-unit class on the unit-list-wrapper which triggers
      the css close and open animations.

      @method toggleUnitHeader
      @param {Y.EventFacade} e Click event object.
    */
    toggleUnitHeader: function(e) {
      e.currentTarget.siblings('.status-unit-content')
                     .toggleClass('close-unit');
      e.currentTarget.toggleClass('closed-unit-list');
    },

    /**
      Toggles the checked status of all of the units in the unit status
      category

      @method toggleSelectAllUnits
      @param {Y.EventFacade} e Click event object.
    */
    toggleSelectAllUnits: function(e) {
      var currentTarget = e.currentTarget,
          units = currentTarget.ancestor('.status-unit-content')
                               .all('input[type=checkbox]');
      if (currentTarget.getAttribute('checked')) {
        units.removeAttribute('checked');
      } else {
        units.setAttribute('checked', 'checked');
      }
    },

    /**
      Directs the unit action button click event to
      the appropriate handler.

      @method _unitActionButtonClick
      @param {Y.EventFacade} e button click event.
    */
    _unitActionButtonClick: function(e) {
      e.halt();
      var handlers = {
        resolve: this._sendUnitResolve,
        retry: this._sendUnitRetry,
        remove: this._sendUnitRemove
      };

      var units = e.currentTarget.ancestor('form').all('input[type=checkbox]');
      var unitNames = [];
      units.each(function(unit) {
        if (unit.get('checked')) {
          var siblings = unit.siblings('a');
          if (siblings.size() > 0) {
            unitNames.push(siblings.item(0).get('innerHTML'));
          }
        }
      });

      var env = this.viewletManager.get('env'),
          handlerName = e.currentTarget.getData('type'),
          handlerFn = handlers[handlerName];

      if (Y.Lang.isFunction(handlerFn)) {
        handlerFn(unitNames, env);
      } else {
        console.error('No handler assigned to', handlerName);
      }

      return; // ignoring all other button clicks passed to this method
    },

    /**
      Sends the resolve command to the env to resolve the
      selected unit in the inspector unit list.

      @method _sendUnitResolve
      @param {Array} unitNames A list of unit names.
      @param {Object} env The current environment (Go/Python).
    */
    _sendUnitResolve: function(unitNames, env) {
      unitNames.forEach(function(unitName) {
        env.resolved(unitName, null);
      });
    },

    /**
      Sends the retry command to the env to retry the
      selected unit in the inspector unit list.

      @method _sendUnitRetry
      @param {Array} unitNames A list of unit names.
      @param {Object} env The current environment (Go/Python).
    */
    _sendUnitRetry: function(unitNames, env) {
      unitNames.forEach(function(unitName) {
        env.resolved(unitName, null, true);
      });
    },

    /**
      Sends the required commands to the env to remove
      the selected unit in the inspector unit list.

      @method _sendUnitRemove
      @param {Array} unitNames A list of unit names.
      @param {Object} env The current environment (Go/Python).
    */
    _sendUnitRemove: function(unitNames, env) {
      // The Go backend can take an array of unitNames but the python one cannot
      // XXX Remove this loop when we drop python support.
      if (env.name === 'go-env') {
        env.remove_units(unitNames);
      } else {
        unitNames.forEach(function(unitName) {
          env.remove_units(unitName);
        });
      }
    },

    /**
     Loads the charm details view for the inspector.

     @method onShowCharmDetails
     @param {Event} ev the click event from the overview viewlet.

     */
    onShowCharmDetails: function(ev) {
      ev.halt();
      var db = this.viewletManager.get('db');
      var charmId = ev.currentTarget.getData('charmid');
      var charm = db.charms.getById(charmId);
      this.viewletManager.showViewlet('charmDetails', charm);
      this.viewletManager.fire('inspectorTakeoverStarting');
    },

    /**
      Display the "do you really want to destroy this service?" prompt.

      @method showDestroyPrompt
      @param {Y.Node} container The container of the prompt.
    */
    showDestroyPrompt: function(container) {
      container.one('.destroy-service-prompt').removeClass('closed');
    },

    /**
      Hide the "do you really want to destroy this service?" prompt.

      @method hideDestroyPrompt
      @param {Y.Node} container The container of the prompt.
    */
    hideDestroyPrompt: function(container) {
      var prompt = container.one('.destroy-service-prompt');
      if (prompt) {
        prompt.addClass('closed');
      }
    },

    /**
      React to the user clicking on or otherwise activating the "destroy this
      service" icon.

      @method _onDestroyClick
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    _onDestroyClick: function(evt) {
      evt.halt();
      this.showDestroyPrompt(evt.container);
    },

    /**
      React to the user clicking on or otherwise activating the cancel button
      on the "destroy this service" prompt.

      @method _onCancelDestroy
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    _onCancelDestroy: function(evt) {
      evt.halt();
      this.hideDestroyPrompt(evt.container);
    },

    /**
      Start the process of destroying the service represented by this
      inspector.

      @method initiateServiceDestroy
      @return {undefined} Nothing.
    */
    initiateServiceDestroy: function() {
      var dataSource = this.viewletManager;
      var model = dataSource.get('model');
      var db = this.viewletManager.get('db');
      if (model.name === 'service' && !model.get('pending')) {
        var env = dataSource.get('env');
        env.destroy_service(model.get('id'),
            Y.bind(this._destroyServiceCallback, this, model, db));
      } else if (model.get('pending')) {
        db.services.remove(model);
        model.destroy();
      } else {
        throw new Error('Unexpected model type: ' + model.name);
      }
    },


    /**
      React to a service being destroyed (or not).

      @method _destroyServiceCallback
      @param {Object} service The service we attempted to destroy.
      @param {Object} db The database responsible for storing the service.
      @param {Object} evt The event describing the destruction (or lack
        thereof).
    */
    _destroyServiceCallback: function(service, db, evt) {
      if (evt.err) {
        // If something bad happend we need to alert the user.
        db.notifications.add(
            new models.Notification({
              title: 'Error destroying service',
              message: 'Service name: ' + evt.service_name,
              level: 'error',
              link: undefined, // XXX See note below about getModelURL.
              modelId: service
            })
        );
      } else {
        db.notifications.add({
          title: 'Destroying service',
          message: 'Service: ' + evt.service_name + ' is being destroyed.',
          level: 'important'
        });
      }
    },

    /**
      React to the user clicking on or otherwise activating the "do it now"
      button on the "destroy this service" prompt.

      @method _onInitiateDestroy
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    _onInitiateDestroy: function(evt) {
      evt.halt();
      this.initiateServiceDestroy();
      this._onCancelDestroy(evt);
      this.options.environment.topo.fire('clearState');
    },
    /**
      Keep checkboxes in sync with their textual representation.

      @method onCheckboxUpdate
      @param {Y.Event} ev the event from the change triggered.

     */
    onCheckboxUpdate: function(ev) {
      var checked = ev.currentTarget.get('checked');
      ev.currentTarget.ancestor('.toggle').one('.textvalue').set('text',
                                                                 checked);
    }
  };

  /**
    Service Inspector Viewlet Manager Controller

    @class ServiceInspector
   */
  views.ServiceInspector = (function() {
    // This variable is assigned an aggregate collection of methods and
    // properties provided by various controller objects in the
    // ServiceInspector constructor.
    var controllerPrototype = {};
    /**
      Constructor for Viewlet Manager Controller

      @method ServiceInspector
      @constructor
    */
    function ServiceInspector(model, options) {
      this.model = model;
      this.options = options;
      options = options || {};
      options.views = {};
      options.templateConfig = options.templateConfig || {};

      var container = Y.Node.create(Templates['service-inspector']());
      container.appendTo(Y.one('#content'));

      var self = this;
      options.container = container;
      options.viewletContainer = '.viewlet-container';

      // Build a collection of view/viewlets from
      // the list of required view/viewlets.
      var views = {};
      options.viewletList.forEach(function(viewletName) {
        var viewlet = viewletNS[viewletName];
        if (typeof viewlet === 'object') {
          // This branch is for viewlets.
          views[viewletName] = viewlet;
        } else if (typeof viewlet === 'function') {
          // This branch is for Y.View's.
          /* jshint -W055 */
          // A constructor name should start with an uppercase letter.
          views[viewletName] = new viewlet();
          /* jshint +W055 */
        }

      });
      // Mix in any custom viewlet configuration options provided by the config.
      options.views = Y.mix(
          views, options.views, true, undefined, 0, true);

      options.model = model;

      // Merge the various prototype objects together.  Additionally, merge in
      // mixins that provide functionality used in the inspector's events.
      var c = Y.juju.controller;
      [c.ghostInspector,
        c.serviceInspector,
        ns.exposeButtonMixin]
        .forEach(function(controller) {
            controllerPrototype = Y.mix(controllerPrototype, controller);
          });

      // Bind the viewletEvents to this class.
      Y.Object.each(options.viewletEvents, function(
          handlers, selector, collection) {
            // You can have multiple listeners per selector.
            Y.Object.each(handlers, function(callback, event, obj) {
              options.viewletEvents[selector][event] = Y.bind(
                  controllerPrototype[callback], self);
            });
          });

      // Enable databinding.
      options.enableDatabinding = true;

      options.events = Y.mix(options.events, options.viewletEvents);

      this.viewletManager = new viewletNS.ViewletManager(options);
      this.viewletManager.slots = {
        'header': '.header-slot',
        'left-hand-panel': '.left-breakout'
      };
      this.viewletManager.render();
      this.viewletManager.showViewlet('InspectorHeader', model);
      this.viewletManager.showViewlet(options.viewletList[0]);
      this.viewletManager.on('viewletSlotClosing', function() {
        this.viewletManager.fire('inspectorTakeoverEnding');
      }, this);
    }

    ServiceInspector.prototype = controllerPrototype;

    return ServiceInspector;
  })();


}, '0.1.0', {
  requires: [
    'base-build',
    'event-key',
    'event-resize',
    'handlebars',
    'json-stringify',
    'juju-databinding',
    'juju-models',
    'juju-model-controller',
    'juju-viewlet-manager',
    'juju-view-utils',
    'node',
    'panel',
    'transition',
    'view',
    // Imported viewlets
    'charm-details-view',
    'inspector-header-view',
    'inspector-overview-view',
    'service-config-view',
    'service-constraints-view',
    'service-ghost-view',
    'unit-details-view',
    'service-relations-view'
  ]
});

