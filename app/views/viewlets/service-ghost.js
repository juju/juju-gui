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


YUI.add('viewlet-service-ghost', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = Y.namespace('juju.views').Templates,
      plugins = Y.namespace('juju.plugins'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');


  ns.ghostConfig = {
    name: 'ghostConfig',
    template: templates['ghost-config-viewlet'],
    bindings: {
      config: {
        // On update make sure undefined isn't sent to the user as viewable
        // input.
        'update': function(node, val) {
          var charmModel = this.viewlet.options.charmModel;
          var option = node.getData('bind').split('.')[1];
          if (!val) {
            val = charmModel.get('options')[option];
          }
          var newVal = (val['default'] === undefined) ? '' : val['default'];
          node.set('value', newVal);
        }
      },
      constraints: {
        // Make sure that the constraints don't show undefined to the user as
        // visible input in the field.
        'update': function(node, val) {
          node.set('value', val || '');
        }
      }
    },

    /**
     * Viewlet standard render call.
     *
     * @method render
     * @param {Service} service the model of the service in the inspector.
     * @param {Object} viewletMgrAttrs an object of helper data from the
     * viewlet manager.
     *
     */
    render: function(model, viewletMgrAttrs) {
      this.container = Y.Node.create(this.templateWrapper);
      // This is to allow for data binding on the ghost settings
      // while using a shared template across both inspectors.
      var subordinate = model.get('subordinate');
      var context = {
        // Signal to the shared templates that this is the ghost view.
        ghost: true,
        subordinate: subordinate,
        settings: utils.extractServiceSettings(
            viewletMgrAttrs.charmModel.get('options'))
      };
      if (!subordinate) {
        context.constraints = utils.getConstraints(
            // There are no current constraints in play.
            {}, viewletMgrAttrs.env.genericConstraints);
        context.networks = model.get('availableNetworks');
      }
      this.container.setHTML(this.template(context));
      this.container.all('textarea.config-field').plug(
          plugins.ResizingTextarea, {
            max_height: 200,
            min_height: 18,
            single_line: 18
          }
      );
    },

    /**
     * Force resize the config textareas.
     * ResizingTextarea needs the nodes to be visible to resize properly. We
     * hook into the show() so that we can force the resize once the node is
     * made visible via its viewlet container. Note that there are dupe hidden
     * textarea nodes so we need to check if the node found has the plugin on
     * it before running resize.
     *
     * @method show
     *
     */
    show: function() {
      this.container.show();
      this.container.all('textarea.config-field').each(function(n) {
        if (n.resizingTextarea) {
          n.resizingTextarea.resize();
        }
      });
    }
  };

}, '0.0.1', {
  requires: [
    'node',
    'resizing-textarea',
    'juju-charm-models',
    'juju-view'
  ]
});
