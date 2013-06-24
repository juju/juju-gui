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
    JujuGUI app extension to add the ghost deployer method

    @class GhostDeployer
    @extension App
  */
  function GhostDeployer() {}

  GhostDeployer.prototype = {
    /**
      A collection of the open ghost inspectors

      @property _ghostInspectors
      @private
      @type {Array}
    */
    _ghostInspectors: [],

    /**
      Show the deploy/configuration panel for a charm.

      @method deployService
      @param {Y.Model} charm model to add to the charms database
    */
    deployService: function(charm) {
      // XXX Is this still required???
      charm.loaded = true;
      this._ghostInspectors.push(new Y.juju.GhostInspector(charm, {
        // this is an extension `this` points to the JujuApp
        db: this.db,
        env: this.env
      }));
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

    var viewlets = {
      configuration: {
        name: 'configuration',
        template: Templates['ghost-config-viewlet'],
        render: function(model) {
          this.container = Y.Node.create(this.templateWrapper);

          if (typeof this.template === 'string') {
            this.template = Y.Handlebars.compile(this.template);
          }
          var options = model.getAttrs();
          // XXX not sure this should be done like this
          // but this will allow us to use the old template
          options.settings = utils.extractServiceSettings(options.options);

          this.container.setHTML(this.template(options));
        },
      }
    };

    options.viewlets = viewlets;
    options.template = Templates['ghost-config-wrapper'];
    options.model    = model;
    options.events   = {
      '.close' : { 'click': 'destroy' },
      '.cancel': { 'click': 'destroy' },
      '.deploy': { 'click': Y.bind(this.deployCharm, this) },
      'input.config-file-upload': { 'change': 'handleFileUpload' },
      'span.config-file-upload': { 'click': 'showFileDialogue' }
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

    // Create ghost
  }

  GhostInspector.prototype = {
    /**
      Deploys the charm

      @method handleDeploy
    */
    deployCharm: function() {
      var options = this.options,
          container = options.container,
          serviceName = container.one('input[name=service-name]').get('value'),
          numUnits = container.one('input[name=number-units]').get('value'),
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

      // Check if a file has been uploaded and use that config
      if (this.configFileContent) {
        config = null;
      } else {
        config = utils.getElementsValuesMapping(
            container, '.service-config .config-field');
      }

      this.options.env.deploy(
          this.options.model.get('id'),
          serviceName, config, this.configFileContent,
          numUnits, Y.bind(this._deployCallbackHandler, this));
    },

    /**
      Checks the database for an existing service with the same name

      @method checkForExistingService
      @param {String} serviceName of the new service to deploy.
      @return {Boolean} true if it exists, false if doesn't.
    */
    checkForExistingService: function(serviceName) {
      var existingService = this.options.db.services.getById(serviceName);
      // Will need to check if it mathes the Ghost once Ben's code has been
      // merged in
      return (existingService) ? true : false;
    },

    showFileDialogue: function() {
      if (this.configFileContent) {
        // remove the old file that was selected
      }
    },

    _deployCallbackHandler: function(e) {
      var db = this.options.db;
      if (e.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error deploying ' + serviceName,
              message: 'Could not deploy the requested service.',
              level: 'error'
            }));
      } else {
        db.notifications.add(
            new models.Notification({
              title: 'Deployed ' + serviceName,
              message: 'Successfully deployed the requested service.',
              level: 'info'
            }));
      }

      // update the UI
    }

  };

  Y.namespace('juju').GhostInspector = GhostInspector;

});
