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


YUI.add('inspector-header-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      templates = Y.namespace('juju.views').Templates,
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  var name = 'inspector-header';

  ns.InspectorHeader = Y.Base.create(name, Y.View, [ns.ViewletBaseView], {
    slot: 'header',
    template: templates['inspector-header'],
    events: {
      'input[name=service-name]': { valuechange: 'updateGhostName' },
      'span[dismiss]': { click: '_dismissMessage' }
    },
    bindings: {
      charmChanged: {
        'update': function(node, value) {
          // Check if the Y.Node actually has a DOM node attached; this may
          // not be the case in the instance of reloding the inspector after
          // the charm has changed.
          if (node.getDOMNode()) {
            if (value) {
              node.removeClass('hidden');
            } else {
              node.addClass('hidden');
            }
          }
        }
      },
      life: {
        'update': function(node, value) {
          // Show/hide the "service being destroyed" message in the inspector
          // header based on the current life-cycle status of the service.
          if (value === 'dying') {
            node.removeClass('hidden');
          } else {
            node.addClass('hidden');
          }
        }
      }
    },

    /**
      Renders the view into it's container.

      @method render
      @param {Object} charm the charm model to display the details of.
      @param {Object} viewletManagerAttrs the attributes passed to the
        viewlet manager.
    */
    render: function(model, viewContainerAttrs) {
      var pojoModel = model.getAttrs();
      pojoModel.charmUrl = pojoModel.charm;
      // Manually add the icon url for the charm since we don't have access to
      // the browser handlebars helper at this location.
      pojoModel.icon = utils.getCharmIconUrl(
          pojoModel.charmUrl, viewContainerAttrs.store,
          viewContainerAttrs.env);
      if (pojoModel.pending) {
        // Check if there is already a service using the default name to
        // trigger the name ux.
        // This regex simply removes the outer parentheses from the
        // displayName that is set in the ghost-inspector.js updateGhostName
        // method.  If the regex doesn't match, blow up.  It should match.
        var name = pojoModel.displayName.match(/^\(([^)]*)\)$/)[1];
        if (utils.checkForExistingService(name, viewContainerAttrs.db)) {
          pojoModel.invalidName = 'invalid';
        } else {
          pojoModel.invalidName = 'valid';
        }
      }
      var container = this.get('container');
      container.setHTML(this.template(pojoModel));
      if (window.flags && window.flags.mv && pojoModel.pending) {
        container.one('.ghost-message').removeClass('hidden');
      }
    },

    /**
      Updates the ghost service name when the user changes it in the inspector.
      Also update the display name of the corresponding ghost units.

      @method updateGhostName
      @param {Y.EventFacade} evt event object from valuechange.
    */
    updateGhostName: function(evt) {
      // The render method expects these parentheses around the model
      // displayName.  If you change this format, or this code, make sure you
      // look at that method too.  Hopefully the associated tests will catch it
      // as well. Also see(grep for) the resetCanvas method too.
      var name = evt.newVal;
      var options = this.options;
      var db = options.db;
      var model = options.model;
      // Validate the service name.
      var isValid = utils.validateServiceName(name, db);
      if (isValid) {
        model.set('name', name);
        // Change the display name of all the ghost units belonging to this
        // service.
        var modelId = model.get('id');
        db.units.filter(function(unit) {
          return unit.service === modelId;
        }).forEach(function(unit) {
          unit.displayName = name + '/' + unit.number;
        });
      }
      model.set('displayName', name);
      this.serviceNameInputStatus(isValid, evt.currentTarget);
    },

    /**
      Updates the status of the service name input.

      @method serviceNameInputStatus
      @param {Boolean} valid status of the service name check.
      @param {Y.Node} input a reference to the input node instance.
    */
    serviceNameInputStatus: function(valid, input) {
      if (valid) {
        input.removeClass('invalid');
        input.addClass('valid'); // add checkmark
      } else {
        input.removeClass('valid');
        input.addClass('invalid'); // add x
      }
    },

    /**
      Hides the ghost-message element

      @method _dismissMessage
      @param {Object} e The click event facade.
    */
    _dismissMessage: function(e) {
      e.preventDefault();
      e.currentTarget.get('parentElement').addClass('hidden');
    }
  });

}, '0.0.1', {
  requires: [
    'node',
    'juju-charm-models',
    'juju-templates',
    'viewlet-view-base',
    'juju-view'
  ]
});
