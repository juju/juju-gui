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
      pojoModel.icon = viewContainerAttrs.store.iconpath(pojoModel.charmUrl);
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
      this.get('container').setHTML(this.template(pojoModel));
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
