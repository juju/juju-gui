


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


YUI.add('service-constraints-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = Y.namespace('juju.views').Templates,
      plugins = Y.namespace('juju.plugins'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  var name = 'constraints';
  var extensions = [ns.ViewletBaseView, ns.ConflictViewExtension];

  ns.Constraints = Y.Base.create(name, Y.View, extensions, {
    template: templates['service-constraints-viewlet'],
    events: {
      '.save-constraints': { click: 'saveConstraints' },
      '.settings-constraints button.cancel': { click: 'cancelConstraints' }
    },
    bindings: {
      'constraints': {
        'format': function(value) {
          // Display undefined constraints as empty strings.
          // This method is inherited when using all nested
          // constraints binding.
          return value || '';
        }
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
      var container = inspector.views.constraints.get('container');
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
      Typical view's render method.

      @method render
      @param {Object} viewletMgrAttrs the attributes sent to the viewlet mgr.
    */
    render: function(viewletMgrAttrs) {
      var service = this.model;
      var constraints = utils.getConstraints(
          service.get('constraints') || {},
          viewletMgrAttrs.env.genericConstraints);
      var contents = this.template({
        service: service,
        constraints: constraints
      });
      var container = this.get('container');
      container.setHTML(contents);
    }

  });

}, '0.0.1', {
  requires: [
    'node',
    'resizing-textarea',
    'juju-charm-models',
    'viewlet-base-view',
    'conflict-view-extension',
    'juju-view'
  ]
});
