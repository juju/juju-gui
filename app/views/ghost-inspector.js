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
  The ghost inspector is the view-container implementation of the ghost
  configuration view

  @module views
  @submodule views.ghostInspector
 */

YUI.add('juju-ghost-inspector', function(Y) {

  var juju = Y.juju,
      views = juju.views,
      Templates = views.Templates,
      models = juju.models,
      utils = views.utils;

  /**
    JujuGUI app extension to add the ghost deployer method.

    @class GhostDeployer
    @extension App
  */
  function GhostDeployer() {}

  GhostDeployer.prototype = {
    /**
      A collection of the open ghost inspectors.

      @property _ghostInspectors
      @private
      @type {Array}
    */
    _ghostInspectors: [],

    /**
      Show the deploy/configuration panel for a charm.

      @method deployService
      @param {Y.Model} charm model to add to the charms database.
    */
    deployService: function(charm) {
      // XXX - Jeff 25/06/2013
      // Is this flag still required? Don't the modelController promises pull
      // these in fully populated now?
      charm.loaded = true;

      var ghostService = this.db.services.ghostService(charm);
      var self = this;
      var ghostInspector = new Y.juju.GhostInspector(charm, {
        // Because this is an extension `this` points to the JujuApp
        db: this.db,
        env: this.env,
        ghostService: ghostService
      });

      this._ghostInspectors.push(ghostInspector);

      ghostInspector.inspector.after('destroy', function(e) {
        // This loops through the instantiated ghostInspectors to find one
        // which matches the one which has fired the destroy event notifying
        // that it's been destroyed so we can remove it from the collection
        this._ghostInspectors.forEach(function(inspector, index) {
          if (e.currentTarget === inspector.inspector) {
            self._ghostInspectors.splice(index, 1);
          }
        });
      }, this);

    }
  };

  Y.namespace('juju').GhostDeployer = GhostDeployer;

  /**
    Ghost Inspector View Container Controller

    @class GhostInspector
    @constructor
  */
  function GhostInspector(model, options) {
    options = options || {};
    this.options = options;
    this.configFileContent = null;

    var viewlets = {
      configuration: {
        name: 'configuration',
        template: Templates['ghost-config-viewlet'],
        'render': function(model) {
          this.container = Y.Node.create(this.templateWrapper);

          var options = model.getAttrs();
          // XXX - Jeff
          // not sure this should be done like this
          // but this will allow us to use the old template.
          options.settings = utils.extractServiceSettings(options.options);

          this.container.setHTML(this.template(options));
        }
      }
    };

    options.viewlets = viewlets;
    options.template = Templates['ghost-config-wrapper'];
    options.model = model;
    options.events = {
      '.close' : { 'click': 'destroy' },
      '.cancel': { 'click': 'destroy' },
      '.deploy': { 'click': Y.bind(this.deployCharm, this) },
      'input.config-file-upload': {
        'change': Y.bind(this._handleFileUpload, this) },
      'span.config-file-upload': {
        'click': Y.bind(this._showFileDialogue, this) },
      'input[name=service-name]': {
        'valuechange': Y.bind(this.updateGhostName, this) }
    };
    options.templateConfig = {
      packageName: model.get('package_name'),
      id: model.get('id')
    };
    var container = Y.Node.create('<div>')
        .addClass('panel yui3-juju-inspector')
        .appendTo(Y.one('#content'));
    var dd = new Y.DD.Drag({ node: container });
    options.container = container;
    options.viewletContainer = '.viewlet-container';

    this.inspector = new views.ViewContainer(options);
    this.inspector.render();
    this.inspector.showViewlet('configuration');
  }

  GhostInspector.prototype = {
    /**
      Handles deployment of the charm.

      @method handleDeploy
    */
    deployCharm: function() {
      var options = this.options,
          container = options.container,
          serviceName = container.one('input[name=service-name]').get('value'),
          numUnits = parseInt(
              container.one('input[name=number-units]').get('value'), 10),
          config;

      if (this.checkForExistingService(serviceName)) {
        options.db.notifications.add(
            new models.Notification({
              title: 'Attempting to deploy service ' + serviceName,
              message: 'A service with that name already exists.',
              level: 'error'
            }));
        return;
      }

      // Check if a file has been uploaded and use that config.
      if (this.configFileContent) {
        config = null;
      } else {
        config = utils.getElementsValuesMapping(
            container, '.service-config .config-field');
      }

      options.env.deploy(
          this.options.model.get('id'),
          serviceName, config, this.configFileContent,
          numUnits, Y.bind(
              this._deployCallbackHandler, this, serviceName, config));
    },

    /**
      Checks the database for an existing service with the same name.

      @method checkForExistingService
      @param {String} serviceName of the new service to deploy.
      @return {Boolean} true if it exists, false if doesn't.
    */
    checkForExistingService: function(serviceName) {
      var existingService = this.options.db.services.getById(serviceName);
      return (existingService) ? true : false;
    },

    /**
      Destroys the inspector.

      @method closeInspector
    */
    closeInspector: function() {
      this.inspector.destroy();
    },

    /**
      Updates the ghost service name when the user changes it in the inspector.

      @method updateGhostName
      @param {Y.EventFacade} e event object from valuechange.
    */
    updateGhostName: function(e) {
      this.options.ghostService.set(
          'id', '(' + e.currentTarget.get('value') + ')');
    },

    /**
      Shows the file dialogue.

      XXX it's a noop because we don't have a ux story for this yet.

      @method _showFileDialogue
    */
    _showFileDialogue: function() {
      if (this.configFileContent) {
        var a = null; // tricking the linter
        // intentionally left blank as we don't have a UX for this
        // functionality yet
      }
    },

    /**
      Handles the file upload.

      XXX It's a noop because we don't have a ux story for this yet.

      @method _handleFileUpload
    */
    _handleFileUpload: function() {},

    /**
      The callback handler from the env.deploy() of the charm.

      @method _deployCallbackHandler
      @param {String} serviceName The service name.
      @param {Object} config The configuration oject of the service.
      @param {Y.EventFacade} e The event facade from the deploy event.
    */
    _deployCallbackHandler: function(serviceName, config, e) {
      var options = this.options,
          db = options.db,
          ghostService = options.ghostService;

      if (e.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error deploying ' + serviceName,
              message: 'Could not deploy the requested service.',
              level: 'error'
            }));
        return;
      }

      db.notifications.add(
          new models.Notification({
            title: 'Deployed ' + serviceName,
            message: 'Successfully deployed the requested service.',
            level: 'info'
          }));

      // Update the annotations with the box's x/y coordinates if
      // they have been set by dragging the ghost.
      if (ghostService.get('dragged')) {
        options.env.update_annotations(
            serviceName, 'service',
            { 'gui-x': ghostService.get('x'),
              'gui-y': ghostService.get('y') },
            function() {
              // Make sure that annotations are set on the ghost
              // service before they come back from the delta to
              // prevent the service from jumping to the middle of
              // the canvas and back.
              var annotations = ghostService.get('annotations');
              if (!annotations) {
                annotations = {};
              }
              Y.mix(annotations, {
                'gui-x': ghostService.get('x'),
                'gui-y': ghostService.get('y')
              });
              ghostService.set('annotations', annotations);
              // The x/y attributes need to be removed to prevent
              // lingering position problems after the service is
              // positioned by the update code.
              ghostService.removeAttr('x');
              ghostService.removeAttr('y');
            });
      }

      ghostService.setAttrs({
        id: serviceName,
        pending: false,
        loading: false,
        config: config
      });

      this.closeInspector();
    }

  };

  Y.namespace('juju').GhostInspector = GhostInspector;

});
