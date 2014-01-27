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
  var ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
  var ESC = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.esc;

  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      models = Y.namespace('juju.models'),
      plugins = Y.namespace('juju.plugins'),
      utils = Y.namespace('juju.views.utils'),
      viewletNS = Y.namespace('juju.viewlets'),
      ns = Y.namespace('juju.views.inspector');

  /**
   * @class manageUnitsMixin
   */
  ns.manageUnitsMixin = {
    // Mixin attributes
    resetUnits: function() {
      var container, model;
      container = this.viewletManager.get('container');
      model = this.viewletManager.get('model');
      var field = container.one('.num-units-control');
      field.set('value', model.get('unit_count'));
      field.set('disabled', false);
    },

    modifyUnits: function(ev) {
      if (ev.keyCode !== ESC && ev.keyCode !== ENTER) {
        return;
      }
      var container, currentUnits;
      container = this.viewletManager.get('container');
      currentUnits = this.viewletManager.get('model').get('unit_count');
      var field = container.one('.num-units-control');

      if (ev.keyCode === ESC) {
        this.resetUnits();
      }
      if (ev.keyCode !== ENTER) { // If not Enter keyup...
        return;
      }
      ev.halt(true);

      var numUnits = field.get('value');

      if (/^\d+$/.test(numUnits)) {
        numUnits = parseInt(numUnits, 10);
        if (numUnits > currentUnits) {
          this._confirmUnitConstraints(numUnits);
        } else {
          this._modifyUnits(numUnits);
        }
      } else {
        this.resetUnits();
      }
    },

    /**
      Shows the UX below the unit input box for the user to confirm the
      constraints for the new units.

      @method _confirmUnitConstraints
      @param {Number} requestedUnitCount the number of units to create.
    */
    _confirmUnitConstraints: function(requestedUnitCount) {
      var container = this.viewletManager.viewlets.overview.container,
          genericConstraints = this.options.env.genericConstraints,
          confirm = container.one('.unit-constraints-confirm'),
          srvConstraints = this.model.get('constraints') || {};

      confirm.setHTML(Templates['service-overview-constraints']({
        srvConstraints: srvConstraints,
        constraints: utils.getConstraints(srvConstraints, genericConstraints)
      }));
      confirm.removeClass('closed');
    },

    /**
      Closes the unit confirm constraints dialogue.

      @method _closeUnitConfirm
    */
    _closeUnitConfirm: function(e) {
      var container = this.viewletManager.viewlets.overview.container,
          confirm = container.one('.unit-constraints-confirm');

      // If this was from the user clicking cancel
      if (e && e.halt) {
        e.halt();
        this.resetUnits();
      }

      // editing class added if the user clicked 'edit'
      confirm.removeClass('editing');
      confirm.addClass('closed');
      this.overviewConstraintsEdit = false;
    },

    /**
      Calls the _modifyUnits method with the unit count when the user
      accepts the constraints

      @method _confirmUnitChange
    */
    _confirmUnitChange: function(e) {
      e.halt();
      var container = this.viewletManager.viewlets.overview.container,
          unitCount = container.one('input.num-units-control').get('value'),
          service = this.model;

      // If the user chose to edit the constraints
      if (this.overviewConstraintsEdit) {
        var constraints = utils.getElementsValuesMapping(
                                  container, '.constraint-field');
        var cb = Y.bind(this._modifyUnits, this, unitCount);
        this.options.env.set_constraints(service.get('id'), constraints, cb);
      } else {
        this._modifyUnits(unitCount);
      }
      this._closeUnitConfirm();
    },

    /**
      Shows the unit constraints when the user wants to edit them
      while increasing the total number of units

      @method _showEditUnitConstraints
    */
    _showEditUnitConstraints: function(e) {
      e.halt();
      var container = this.viewletManager.viewlets.overview.container;
      container.all('.hide-on-edit').hide();
      container.one('.editable-constraints').show();
      container.one('.unit-constraints-confirm').addClass('editing');
      this.overviewConstraintsEdit = true;
    },

    _modifyUnits: function(requested_unit_count) {
      var container = this.viewletManager.get('container');
      var env = this.viewletManager.get('env');

      var service = this.model || this.get('model');
      var unit_count = service.get('unit_count');
      var field = container.one('.num-units-control');

      if (requested_unit_count < 1) {
        field.set('value', unit_count);
        return;
      }

      var delta = requested_unit_count - unit_count;
      if (delta > 0) {
        // Add units!
        env.add_unit(
            service.get('id'), delta,
            Y.bind(this._addUnitCallback, this));
      } else if (delta < 0) {
        delta = Math.abs(delta);
        var units = service.get('units'),
            unit_ids_to_remove = [];

        for (var i = units.size() - 1;
            unit_ids_to_remove.length < delta;
            i -= 1) {
          unit_ids_to_remove.push(units.item(i).id);
        }
        env.remove_units(
            unit_ids_to_remove,
            Y.bind(this._removeUnitCallback, this)
        );
      }
      field.set('disabled', true);
    },

    _addUnitCallback: function(ev) {
      var container = this.viewletManager.get('container');
      var field = container.one('.num-units-control');
      var service, db;
      service = this.viewletManager.get('model');
      db = this.viewletManager.get('db');
      var unit_names = ev.result || [];
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error adding unit',
              message: ev.num_units + ' units',
              level: 'error',
              modelId: service
            })
        );
      } else {
        service.get('units').add(
            Y.Array.map(unit_names, function(unit_id) {
              return {id: unit_id,
                agent_state: 'pending'};
            }));
        service.set(
            'unit_count', service.get('unit_count') + unit_names.length);
      }
      db.fire('update');
      field.set('disabled', false);
    },

    _removeUnitCallback: function(ev) {
      var service = this.viewletManager.get('model');
      var db = this.viewletManager.get('db');
      var unit_names = ev.unit_names;

      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: (function() {
                if (!ev.unit_names || ev.unit_names.length < 2) {
                  return 'Error removing unit';
                }
                return 'Error removing units';
              })(),
              message: (function() {
                if (!ev.unit_names || ev.unit_names.length === 0) {
                  return '';
                }
                if (ev.unit_names.length > 1) {
                  return 'Unit names: ' + ev.unit_names.join(', ');
                }
                return 'Unit name: ' + ev.unit_names[0];
              })(),
              level: 'error',
              modelId: service
            })
        );
      } else {
        Y.Array.each(unit_names, function(unit_name) {
          var service = db.services.getById(unit_name.split('/')[0]);
          var units = service.get('units');
          units.remove(units.getById(unit_name));
        });
        service.set(
            'unit_count', service.get('unit_count') - unit_names.length);
      }
      db.fire('update');
      // View is redrawn so we do not need to enable field.
    }
  };

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
      container.one('.destroy-service-prompt').addClass('closed');
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

    /* Event handlers for service/ghost destroy UI */

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
      Handles the click on the file input and dispatches to the proper function
      depending if a file has been previously loaded or not.

      @method handleFileClick
      @param {Y.EventFacade} e An event object.
    */
    handleFileClick: function(e) {
      if (e.currentTarget.getHTML().indexOf('Remove') === -1) {
        // Because we can't style file input buttons properly we style a normal
        // element and then simulate a click on the real hidden input when our
        // fake button is clicked.
        e.container.one('input[type=file]').getDOMNode().click();
      } else {
        this.onRemoveFile(e);
      }
    },

    /**
      Handle the file upload click event. Creates a FileReader instance to
      parse the file data.


      @method onFileChange
      @param {Y.EventFacade} e An event object.
    */
    handleFileChange: function(e) {
      var file = e.currentTarget.get('files').shift(),
          reader = new FileReader();
      reader.onerror = Y.bind(this.onFileError, this);
      reader.onload = Y.bind(this.onFileLoaded, this, file.name);
      reader.readAsText(file);
    },

    /**
      Callback called when an error occurs during file upload.
      Hide the charm configuration section.

      @method onFileError
      @param {Object} e An event object (with a "target.error" attr).
    */
    onFileError: function(e) {
      var error = e.target.error, msg;
      switch (error.code) {
        case error.NOT_FOUND_ERR:
          msg = 'File not found';
          break;
        case error.NOT_READABLE_ERR:
          msg = 'File is not readable';
          break;
        case error.ABORT_ERR:
          break; // noop
        default:
          msg = 'An error occurred reading this file.';
      }
      if (msg) {
        var db = this.viewletManager.get('db');
        db.notifications.add(
            new models.Notification({
              title: 'Error reading configuration file',
              message: msg,
              level: 'error'
            }));
      }
    },

    /**
      Callback called when a file is correctly uploaded.
      Hide the charm configuration section.

      @method onFileLoaded
      @param {Object} e An event object.
    */
    onFileLoaded: function(filename, e) {
      // Add a link for the user to remove this file now that it's loaded.
      var button = this.viewletManager.get('container').one('.fakebutton');
      button.setHTML(filename + ' - Remove file');
      //set the configFileContent on the viewlet-manager so we can have access
      //to it when the user submit their config.
      this.viewletManager.configFileContent = e.target.result;
      if (!this.viewletManager.configFileContent) {
        // Some file read errors do not go through the error handler as
        // expected but instead return an empty string.  Warn the user if
        // this happens.
        var db = this.viewletManager.get('db');
        db.notifications.add(
            new models.Notification({
              title: 'Configuration file error',
              message: 'The configuration file loaded is empty.  ' +
                  'Do you have read access?',
              level: 'error'
            }));
      }
      var container = this.viewletManager.get('container');
      container.all('.charm-settings, .settings-wrapper.toggle').hide();
    },

    /**
      Handle the file remove click event by clearing out the input
      and resetting the UI.

      @method onRemoveFile
      @param {Y.EventFacade} e an event object from click.
    */
    onRemoveFile: function(e) {
      var container = this.viewletManager.get('container');
      this.viewletManager.configFileContent = null;
      container.one('.fakebutton').setHTML('Import config file...');
      container.all('.charm-settings, .settings-wrapper.toggle').show();
      // Replace the file input node.  There does not appear to be any way
      // to reset the element, so the only option is this rather crude
      // replacement.  It actually works well in practice.
      container.one('input[type=file]')
               .replace(Y.Node.create('<input type="file"/>'));
    },

    /**
      Highlight modified fields to show they have been saved.
      Note that the "modified" class is removed in the syncedFields method.

      @method _highlightSaved
      @param {Y.Node} container The affected viewlet container.
      @return {undefined} Nothing.
    */
    _highlightSaved: function(container) {
      var modified = container.all('.modified');
      modified.addClass('change-saved');
      // If you don't remove the class later, the animation runs every time
      // you switch back to the tab with these fields. Unfortunately,
      // animationend handlers don't work reliably, once you hook them up with
      // the associated custom browser names (e.g. webkitAnimationEnd) on the
      // raw DOM node, so we don't even bother with them.  We just make a
      // timer to remove the class.
      var parentContainer = this.viewletManager.get('container');
      Y.later(1000, modified, function() {
        // Use the modified collection that we originally found, but double
        // check that our expected context is still around.
        if (parentContainer.inDoc() &&
            !container.all('.change-saved').isEmpty()) {
          this.removeClass('change-saved');
        }
      });
    },

    /**
      Pulls the content from each configuration field and sends the values
      to the environment

      @method saveConfig
    */
    saveConfig: function() {
      var inspector = this.viewletManager,
          env = inspector.get('env'),
          db = inspector.get('db'),
          service = inspector.get('model'),
          charmUrl = service.get('charm'),
          charm = db.charms.getById(charmUrl),
          schema = charm.get('options'),
          container = this.viewletManager.viewlets.config.container,
          button = container.one('button.confirm');

      button.set('disabled', 'disabled');

      var config = utils.getElementsValuesMapping(container, '.config-field');
      var errors = utils.validate(config, schema);

      if (Y.Object.isEmpty(errors)) {
        env.set_config(
            service.get('id'),
            config,
            null,
            service.get('config'),
            Y.bind(this._setConfigCallback, this, container)
        );
      } else {
        db.notifications.add(
            new models.Notification({
              title: 'Error saving service config',
              message: 'Error saving service config',
              level: 'error'
            })
        );
        // We don't have a story for passing the full error messages
        // through so will log to the console for now.
        console.log('Error setting config', errors);
      }
    },

    /**
      Handles the success or failure of setting the new config values

      @method _setConfigCallback
      @param {Y.Node} container of the viewlet-manager.
      @param {Y.EventFacade} evt YUI event object with the following attrs:
        - err: whether or not an error occurred;
        - service_name: the name of the service;
        - newValues: an object including the modified config options.
    */
    _setConfigCallback: function(container, evt) {
      // If the user has conflicted fields and still chooses to
      // save, then we will be overwriting the values in Juju.
      if (evt.err) {
        var db = this.viewletManager.get('db');
        db.notifications.add(
            new models.Notification({
              title: 'Error setting service configuration',
              message: 'Service name: ' + evt.service_name,
              level: 'error'
            })
        );
      } else {
        this._highlightSaved(container);
        var service = this.viewletManager.get('model');
        // Mix the current config (stored in the db) with the modified options.
        var config = Y.mix(service.get('config'), evt.newValues, true);
        service.set('config', config);
        var bindingEngine = this.viewletManager.bindingEngine;
        bindingEngine.resetDOMToModel('config');
      }
      container.one('.controls .confirm').removeAttribute('disabled');
    },

    /**
      Cancel any configuration changes.

      @method cancelConfig
      @param {Y.EventFacade} e An event object.
      @return {undefined} Nothing.
    */
    cancelConfig: function(e) {
      this.viewletManager.bindingEngine.resetDOMToModel('config');
    },

    /**
      Handle saving the service constraints.
      Make the corresponding environment call, passing _saveConstraintsCallback
      as callback (see below).

      @method saveConstraints
      @param {Y.EventFacade} ev An event object.
      @return {undefined} Nothing.
    */
    saveConstraints: function(ev) {
      var inspector = this.viewletManager;
      var container = inspector.viewlets.constraints.container;
      var env = inspector.get('env');
      var service = inspector.get('model');
      // Retrieve constraint values.
      var constraints = utils.getElementsValuesMapping(
          container, '.constraint-field');
      // Disable the "Save" button while the RPC call is outstanding.
      container.one('.save-constraints').set('disabled', 'disabled');
      // Set up the set_constraints callback and execute the API call.
      var callback = Y.bind(
          this._saveConstraintsCallback, this, container, constraints);
      env.set_constraints(service.get('id'), constraints, callback);
    },

    /**
      Callback for saveConstraints.
      React to responses arriving from the API server.

      @method _saveConstraintsCallback
      @private
      @param {Y.Node} container The inspector container.
      @param {Y.EventFacade} ev An event object.
      @return {undefined} Nothing.
    */
    _saveConstraintsCallback: function(container, constraints, ev) {
      if (ev.err) {
        // Notify an error occurred while updating constraints.
        var db = this.viewletManager.get('db');
        var service = this.viewletManager.get('model');
        db.notifications.add(
            new models.Notification({
              title: 'Error setting service constraints',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              modelId: service
            })
        );
      } else {
        this._highlightSaved(container);
        this.viewletManager.get('model').set('constraints', constraints);
        var bindingEngine = this.viewletManager.bindingEngine;
        bindingEngine.resetDOMToModel('constraints');
      }
      container.one('.save-constraints').removeAttribute('disabled');
    },

    /**
      Cancel any constraint changes.

      @method cancelConstraints
      @param {Y.EventFacade} e An event object.
      @return {undefined} Nothing.
    */
    cancelConstraints: function(e) {
      this.viewletManager.bindingEngine.resetDOMToModel('constraints');
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
      this.viewletManager.showViewlet('unitDetails', unit);
      this.options.environment.topo.fire('takeoverStarting');
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
     Loads the charm details view for the inspector.

     @method onShowCharmDetails
     @param {Event} ev the click event from the overview viewlet.

     */
    onShowCharmDetails: function(ev) {
      ev.halt();
      var db = this.viewletManager.get('db');
      var charmId = ev.currentTarget.getAttribute('data-charmid');
      var charm = db.charms.getById(charmId);
      this.viewletManager.showViewlet('charmDetails', charm);
      this.options.environment.topo.fire('takeoverStarting');
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
      This handles removing the relation between two services when the user
      clicks the remove relation button in the relation tab in the inspector.

      @method _removeRelation
      @param {Object} e The event facade from clicking on the remove relation
        button.
    */
    _removeRelation: function(e) {
      var relation = this.options.db.relations.getById(
          e.currentTarget.getData('relation')).getAttrs();
      var relationModule = this.options.environment.topo.modules.RelationModule;

      relationModule.removeRelationConfirm(relation, relationModule);
    }
  };

  var ConflictMixin = {
    /**
     * Reset the given node to not be marked as 'modified' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _clearModified
     * @param {Y.Node} node of the input to clear.
     *
     */
    '_clearModified': function(node) {
      if (node.getAttribute('type') === 'checkbox') {
        var n = node.ancestor('.toggle').one('.modified');
        if (n) {
          n.remove();
        }

        // If the value isn't modified it can't be in conflict.
        this._clearConflictPending(node);
      } else {
        node.removeClass('modified');
      }
    },

    /**
     * Mark the given node to not be marked as 'modified' in the UX.
     *
     * @method _markModified
     * @param {Y.Node} node of the input to mark.
     *
     */
    '_makeModified': function(node) {
      if (node.getAttribute('type') === 'checkbox') {
        node.ancestor('.toggle').one('label').append(
            Y.Node.create('<span class="modified boolean"/>'));
        this._clearConflictPending(node);
      } else {
        node.addClass('modified');
      }
    },

    /**
     * Reset the given node to not be marked as 'conflict-pending' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _clearConflictPending
     * @param {Y.Node} node of the input to clear.
     *
     */
    '_clearConflictPending': function(node) {
      if (node.getAttribute('type') === 'checkbox') {
        var n = node.ancestor('.toggle').one('.conflict-pending');
        if (n) {
          n.remove();
        }
      } else {
        node.removeClass('conflict-pending');
      }
    },

    /**
     * Mark the given node to not be marked as 'conflict-pending' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _makeConflictPending
     * @param {Y.Node} node of the input to mark.
     *
     */
    '_makeConflictPending': function(node) {
      if (node.getAttribute('type') === 'checkbox') {
        node.get('parentNode').prepend(
            Y.Node.create('<span class="conflict-pending boolean"/>'));
      } else {
        node.addClass('conflict-pending');
      }
    },

    /**
     * Reset the given node to not be marked as 'conflict' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _clearConflict
     * @param {Y.Node} node of the input to clear.
     *
     */
    '_clearConflict': function(node) {
      // Checkboxes don't go to full conflict as there's no UX to choose a
      // value to keep.
      node.removeClass('conflict');
    },

    /**
     * Mark the given node to not be marked as 'conflict' in the UX.
     *
     * Marking checkboxes in the UI is done a little differently and requires
     * condition checking in these helpers.
     *
     * @method _makeConflict
     * @param {Y.Node} node of the input to mark.
     *
     */
    '_makeConflict': function(node) {
      node.addClass('conflict');
    },

    'changed': function(node, key, field) {
      // Not all nodes need to show the conflict ux. This is true when
      // multiple binds to a single model field are set, such as in the
      // checkbox widgets used in the inspector.
      if (node.getData('skipconflictux')) {
        return;
      }
      var controls = this.container.one('.controls');
      if (this.changedValues[key]) {
        this._makeModified(node);
        controls.removeClass('closed');
      } else {
        this._clearModified(node);
        // Databinding calls syncedFields if there are no more changed
        // values, and that method is responsible for closing the controls.
      }
    },

    'conflict': function(node, nodeValue, modelValue, resolve, binding) {
      // Not all nodes need to show the conflict ux. This is true when
      // multiple binds to a single model field are set, such as in the
      // checkbox widgets used in the inspector.
      if (node.getData('skipconflictux')) {
        // We're assuming that another node will handle resolving the
        // field.
        return;
      }
      /**
       Calls the databinding resolve method
       @method sendResolve
      */
      var option;
      var viewlet = this;
      var wrapper = node.ancestor('.settings-wrapper');
      var resolver = wrapper.one('.resolver');
      if (resolver) {
        option = resolver.one('.config-field');
      }
      var handlers = [];

      resolve.cleanup = function() {
        handlers.forEach(function(h) { h.detach();});
        viewlet._clearModified(node);
        viewlet._clearConflictPending(node);
        viewlet._clearConflict(node);
        if (resolver) {
          resolver.addClass('hidden');
        }
      };
      /**
        User selects one of the two conflicting values.

        @method sendResolve
       */
      function sendResolve(e) {
        e.halt(true);
        if (e.currentTarget.hasClass('conflicted-env')) {
          resolve(modelValue);
        } else {
          resolve(binding.field.get(node));
        }
      }

      /**
        User selects a conflicting field, show the resolution UI

        @method setupResolver
      */
      function setupResolver(e) {
        e.halt(true);
        viewlet._clearConflictPending(node);
        viewlet._makeConflict(node);
        viewlet._makeConflict(option);
        option.setStyle('width', node.get('offsetWidth'));
        option.setHTML(modelValue);
        resolver.removeClass('hidden');
      }

      // On conflict just indicate.
      this._clearModified(node);
      this._makeConflictPending(node);

      if (option) {
        handlers.push(wrapper.delegate(
            'click', setupResolver, '.conflict-pending'));
        handlers.push(wrapper.delegate('click', sendResolve, '.conflict'));
      } else {
        handlers.push(wrapper.delegate(
            'click', sendResolve, '.conflict-pending'));
      }
    },

    'unsyncedFields': function() {
      var node = this.container.one('.controls .confirm');
      if (!node.getData('originalText')) {
        node.setData('originalText', node.getHTML());
      }
      node.setHTML('Overwrite');
    },

    'syncedFields': function() {
      var controls = this.container.one('.controls');
      var node = controls.one('.confirm');
      var title = node.getData('originalText');
      if (title) {
        node.setHTML(title);
      }
      controls.addClass('closed');
    }
  };

  // Mixin Conflict Handling.
  viewletNS.config = Y.merge(viewletNS.config, ConflictMixin);
  viewletNS.constraints = Y.merge(viewletNS.constraints, ConflictMixin);


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
      options.viewlets = {};
      options.templateConfig = options.templateConfig || {};

      var container = Y.Node.create(Templates['service-inspector']());
      container.appendTo(Y.one('#content'));

      var self = this;
      options.container = container;
      options.viewletContainer = '.viewlet-container';

      // Build a collection of viewlets from the list of required viewlets.
      var viewlets = {};
      options.viewletList.forEach(function(viewlet) {
        viewlets[viewlet] = viewletNS[viewlet]; });
      // Mix in any custom viewlet configuration options provided by the config.
      options.viewlets = Y.mix(
          viewlets, options.viewlets, true, undefined, 0, true);

      options.model = model;

      // Merge the various prototype objects together.  Additionally, merge in
      // mixins that provide functionality used in the inspector's events.
      var c = Y.juju.controller;
      [c.ghostInspector,
        c.serviceInspector,
        ns.manageUnitsMixin,
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

      options.events = Y.mix(options.events, options.viewletEvents);

      this.viewletManager = new viewletNS.ViewletManager(options);
      this.viewletManager.slots = {
        'header': '.header-slot',
        'left-hand-panel': '.left-breakout'
      };
      this.viewletManager.render();
      this.viewletManager.showViewlet('inspectorHeader', model);
      this.viewletManager.showViewlet(options.viewletList[0]);
      this.viewletManager.on('viewletSlotClosing', function() {
        console.log('viewletSlotClosing -> takeoverEnding');
        self.options.environment.topo.fire('takeoverEnding');
      });
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
    'viewlet-charm-details',
    'viewlet-inspector-header',
    'viewlet-inspector-overview',
    'viewlet-service-config',
    'viewlet-service-constraints',
    'viewlet-service-ghost',
    'viewlet-unit-details',
    'viewlet-service-relations'
  ]
});

