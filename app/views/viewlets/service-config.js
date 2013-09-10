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
      exposed: {
        'update': function(node, val) {
          debugger;
        }
      },
      config: {
        // On update make sure undefined isn't sent to the user as viewable
        // input.
        'update': function(node, val) {
          if (val === undefined) {
            val = '';
          }
          node.set('value', val);
        }
      }
    },
    /**
     * Bind DOM related events to keep checkboxes in sync with their textual
     * reprensetation.
     *
     * @method _bindDOMEvents
     *
     */
    _bindDOMEvents: function() {
      // Keep the textual representation of the checkbox in sync with the
      // input node.
      this.events.push(
          this.container.all('.hidden-checkbox').on('change', function(ev) {
            var checked = ev.target.get('checked');
            ev.target.ancestor('.toggle').one('.textvalue').set('text',
                                                                checked);
          })
      );
    },
    /**
     * Viewlet standard render call.
     *
     * @method rener
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
          charm.get('options'));

      this.container = Y.Node.create(this.templateWrapper);

      this.container.setHTML(
          this.template({
            service: service,
            settings: templatedSettings,
            exposed: service.get('exposed')}));
      this.container.all('textarea.config-field')
          .plug(plugins.ResizingTextarea,
                { max_height: 200,
                  min_height: 18,
                  single_line: 18});
      this._bindDOMEvents();
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
