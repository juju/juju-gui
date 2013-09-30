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


YUI.add('viewlet-service-config', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = Y.namespace('juju.views').Templates,
      plugins = Y.namespace('juju.plugins'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');


  ns.config = {
    name: 'config',
    template: templates['service-configuration'],
    bindings: {
      config: {
        // On update make sure undefined isn't sent to the user as viewable
        // input.
        'update': function(node, val) {
          if (node.getAttribute('type') === 'checkbox') {
            if (val !== node.get('checked')) {
              node.set('checked', val);
              // We cannot simulate a change event here to trigger the textual
              // value to update or else we'll cause databinding to think
              // there's a conflict the next time this is changed via anyone
              // else.
              // We manually set the html content in order to avoid this.
              node.ancestor('.toggle').one('.textvalue').set('text',
                                                             val);
            }
          } else {
            if (val === undefined) {
              val = '';
            }
            node.set('value', val);

            if (node.resizingTextarea) {
              // We're hacking into the private method because the extension
              // wasn't designed with the idea that there could be a
              // non-user interface driven change. If the databinding value
              // changes we need to update/resize things and we can't simulate
              // a valueChange event.
              node.resizingTextarea._run_change(val);
            }
          }
        }
      }
    },

    /**
     * Viewlet standard render call.
     *
     * @method render
     * @param {Service} service the model of the service in the inspector.
     * @param {Object} viewContainerAttrs an object of helper data from the
     * viewlet manager.
     *
     */
    render: function(service, viewContainerAttrs) {
      var settings = [];
      var db = viewContainerAttrs.db;
      var charm = db.charms.getById(service.get('charm'));
      var templatedSettings = utils.extractServiceSettings(
          charm.get('options'), service.get('config'));

      if (!this.container) {
        this.container = Y.Node.create(this.templateWrapper);
      }

      this.container.setHTML(
          this.template({
            service: service,
            settings: templatedSettings,
            exposed: service.get('exposed')}));
      this.container.all('textarea.config-field').plug(
          plugins.ResizingTextarea, {
            max_height: 200,
            min_height: 18,
            single_line: 18
          }
      );
      this.attachExpandingTextarea();
    },

    /**
      Ensures that all resizing textareas are attached.

      @method attachExpandingTextarea
    */
    attachExpandingTextarea: function() {
      this.container.all('textarea.config-field').each(function(n) {
        if (n.resizingTextarea) {
          n.resizingTextarea.resize();
        }
      });
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
      this.attachExpandingTextarea();
    }

  };
}, '0.0.1', {
  requires: [
    'event-simulate',
    'juju-charm-models',
    'juju-view',
    'node',
    'resizing-textarea'
  ]
});
