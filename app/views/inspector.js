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
    // XXX Makyo - this will need to be removed when the serviceInspector flag
    // goes away.
    events: {
      '.num-units-control': {
        keydown: 'modifyUnits',
        blur: 'resetUnits'
      }
    },

    /*
     * XXX Makyo - all instances of testing for the flag will go away once
     * the inspector becomes the default, rather than internal pages.
     */
    /**
     * No-Op function to replace getModelURL for the time being.
     * XXX Makyo - remove when inspector becomes the default.
     *
     * @method noop
     * @return {undefined} Nothing.
     */
    noop: function() { return; },

    resetUnits: function() {
      var container, model, flags = window.flags;
      if (flags.serviceInspector) {
        container = this.viewletManager.get('container');
        model = this.viewletManager.get('model');
      } else {
        container = this.get('container');
        model = this.get('model');
      }
      var field = container.one('.num-units-control');
      field.set('value', model.get('unit_count'));
      field.set('disabled', false);
    },

    modifyUnits: function(ev) {
      if (ev.keyCode !== ESC && ev.keyCode !== ENTER) {
        return;
      }
      var container, flags = window.flags, currentUnits;
      if (flags.serviceInspector) {
        container = this.viewletManager.get('container');
        currentUnits = this.viewletManager.get('model').get('unit_count');
      } else {
        container = this.get('container');
      }
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
        if (flags.serviceInspector && numUnits > currentUnits) {
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
      var container, env, flags = window.flags;
      if (flags.serviceInspector) {
        container = this.viewletManager.get('container');
        env = this.viewletManager.get('env');
      } else {
        container = this.get('container');
        env = this.get('env');
      }

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
        var db;
        if (flags.serviceInspector) {
          db = this.viewletManager.get('db');
        } else {
          db = this.get('db');
        }
        var units = db.units.get_units_for_service(service),
            unit_ids_to_remove = [];

        for (var i = units.length - 1;
            unit_ids_to_remove.length < delta;
            i -= 1) {
          unit_ids_to_remove.push(units[i].id);
        }
        env.remove_units(
            unit_ids_to_remove,
            Y.bind(this._removeUnitCallback, this)
        );
      }
      if (!flags.serviceInspector) {
        field.set('disabled', true);
      }
    },

    _addUnitCallback: function(ev) {
      var service, getModelURL, db, flags = window.flags;
      if (flags.serviceInspector) {
        service = this.viewletManager.get('model');
        getModelURL = this.noop;
        db = this.viewletManager.get('db');
      } else {
        service = this.get('model');
        getModelURL = this.get('getModelURL');
        db = this.get('db');
      }
      var unit_names = ev.result || [];
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error adding unit',
              message: ev.num_units + ' units',
              level: 'error',
              link: getModelURL(service),
              modelId: service
            })
        );
      } else {
        db.units.add(
            Y.Array.map(unit_names, function(unit_id) {
              return {id: unit_id,
                agent_state: 'pending'};
            }));
        service.set(
            'unit_count', service.get('unit_count') + unit_names.length);
      }
      db.fire('update');
      // View is redrawn so we do not need to enable field.
    },

    _removeUnitCallback: function(ev) {
      var service, getModelURL, db, flags = window.flags;
      if (flags.serviceInspector) {
        service = this.viewletManager.get('model');
        getModelURL = this.noop;
        db = this.viewletManager.get('db');
      } else {
        service = this.get('model');
        getModelURL = this.get('getModelURL');
        db = this.get('db');
      }
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
              link: getModelURL(service),
              modelId: service
            })
        );
      } else {
        Y.Array.each(unit_names, function(unit_name) {
          db.units.remove(db.units.getById(unit_name));
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
      var svcInspector = window.flags && window.flags.serviceInspector;
      var dataSource = svcInspector ? this.viewletManager : this;
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
      var svcInspector = window.flags && window.flags.serviceInspector;
      var dataSource = svcInspector ? this.viewletManager : this;
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
      var svcInspector = window.flags && window.flags.serviceInspector;
      var dataSource = svcInspector ? this.viewletManager : this;
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
      var svcInspector = window.flags && window.flags.serviceInspector;
      var dataSource = svcInspector ? this.viewletManager : this;
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
      var svcInspector = window.flags && window.flags.serviceInspector;
      // When the above flag is removed we won't need the dataSource variable
      // any more and can refactor this accordingly.
      var dataSource = svcInspector ? this.viewletManager : this;
      var model = dataSource.get('model');
      var db = this.viewletManager.get('db');
      if (model.name === 'service') {
        var env = dataSource.get('env');
        env.destroy_service(model.get('id'),
            Y.bind(this._destroyServiceCallback, this, model, db));
      } else if (model.name === 'browser-charm') {
        db.services.remove(this.options.ghostService);
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
        // If the removal succeeded on the server side, we need to remove the
        // service from the database.  (Why wouldn't we get an update from the
        // server side that would do this for us?).
        db.services.remove(service);
        db.relations.remove(db.relations.filter(
            function(r) {
              return Y.Array.some(r.get('endpoints'), function(ep) {
                return ep[0] === service.get('id');
              });
            }));
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
      this.closeInspector();
      this.initiateServiceDestroy();
      this.options.environment.topo.fire('clearState');
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
      container.all('.settings-wrapper').hide();
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
      container.all('.settings-wrapper').show();
      // Replace the file input node.  There does not appear to be any way
      // to reset the element, so the only option is this rather crude
      // replacement.  It actually works well in practice.
      container.one('input[type=file]')
               .replace(Y.Node.create('<input type="file"/>'));
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

      var newVals = utils.getElementsValuesMapping(container, '.config-field');
      var errors = utils.validate(newVals, schema);

      if (Y.Object.isEmpty(errors)) {
        env.set_config(
            service.get('id'),
            newVals,
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
      @param {Y.EventFacade} e yui event object.
    */
    _setConfigCallback: function(container, e) {
      container.one('.controls .confirm').removeAttribute('disabled');
      // If the user has conflicted fields and still choose to
      // save then we will be overwriting the values in Juju.
      var bindingEngine = this.viewletManager.bindingEngine;
      bindingEngine.clearChangedValues('config');
      var db = this.viewletManager.get('db');
      if (e.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error setting service config',
              message: 'Service name: ' + e.service_name,
              level: 'error'
            })
        );
      } else {
        // XXX show saved notification
        // we have no story for this yet
        db.notifications.add(
            new models.Notification({
              title: 'Config saved successfully ',
              message: e.service_name + ' config set successfully.',
              level: 'info'
            })
        );
      }
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
      var callback = Y.bind(this._saveConstraintsCallback, this, container);
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
    _saveConstraintsCallback: function(container, ev) {
      var inspector = this.viewletManager;
      var bindingEngine = inspector.bindingEngine;
      bindingEngine.clearChangedValues('constraints');
      var db = inspector.get('db');
      var service = inspector.get('model');
      if (ev.err) {
        // Notify an error occurred while updating constraints.
        db.notifications.add(
            new models.Notification({
              title: 'Error setting service constraints',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              modelId: service
            })
        );
      } else {
        // XXX frankban: show success notification.
        // We have no story for this yet.
        db.notifications.add(
            new models.Notification({
              title: 'Constraints saved successfully',
              message: ev.service_name + ' constraints set successfully.',
              level: 'info'
            })
        );
      }
      container.one('.save-constraints').removeAttribute('disabled');
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
      var unit = db.units.getById(ev.currentTarget.getData('unit'));
      this.viewletManager.showViewlet('unitDetails', unit);
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
          db = this.viewletManager.get('db'),
          env = this.viewletManager.get('env'),
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
          db.notifications.add(new db.models.Notification({
            title: 'Error setting charm.',
            message: result.err,
            level: 'error'
          }));
          return;
        }
        // TODO Makyo Aug 28 - figure out if there's an upgrade available for
        // the service with the new charm, set info as needed - juju will not
        // report new charm URL properly with GetService. - Bug: #1218447
      });
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
          unitNames.push(unit.siblings('a').get('innerHTML'));
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
      unitNames.forEach(function(unitName) {
        env.remove_units(unitName);
      });
    }
  };

  var ConflictMixin = {
    'changed': function(node, key, field) {
      var modelValue = this.model.get(key);
      var fieldValue = field.get(node);
      if (modelValue !== fieldValue) {
        node.addClass('modified');
      } else {
        node.removeClass('modified');
      }
    },
    'conflict': function(node, model, viewletName, resolve, binding) {
      /**
       Calls the databinding resolve method
       @method sendResolve
      */
      var key = node.getData('bind');
      var modelValue = model.get(key);
      var field = binding.field;
      var wrapper = node.ancestor('.settings-wrapper');
      var resolver = wrapper.one('.resolver');
      var option = resolver.one('.config-field');
      var handlers = [];

      /**
       User selects one of the two conflicting values.
       @method sendResolve
       */
      function sendResolve(e) {
        e.halt(true);
        var formValue = field.get(node);
        handlers.forEach(function(h) { h.detach();});
        node.removeClass('modified');
        node.removeClass('conflict');
        resolver.addClass('hidden');

        if (e.currentTarget.hasClass('conflicted-env')) {
          resolve(node, viewletName, modelValue);
        } else {
          resolve(node, viewletName, formValue);
        }
      }

      /**
       User selects a conflicting field, show the resolution UI

       @method setupResolver
      */
      function setupResolver(e) {
        e.halt(true);
        node.removeClass('conflict-pending');
        node.addClass('conflict');
        option.addClass('conflict');
        option.setStyle('width', node.get('offsetWidth'));
        option.setHTML(modelValue);
        resolver.removeClass('hidden');
      }

      // On conflict just indicate.
      node.removeClass('modified');
      node.addClass('conflict-pending');

      handlers.push(wrapper.delegate('click', setupResolver,
          '.conflict-pending', this));

      handlers.push(wrapper.delegate('click', sendResolve,
          '.conflict', this));
    },
    'unsyncedFields': function(dirtyFields) {
      this.container.one('.controls .confirm').setHTML('Overwrite');
    },
    'syncedFields': function() {
      this.container.one('.controls .confirm').setHTML('Save Changes');
      this.container.all('.modified').removeClass('modified');
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
    var juju = Y.namespace('juju');
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
    'juju-view-service',
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
    'viewlet-unit-details'
  ]
});

