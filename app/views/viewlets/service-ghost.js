



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
      'options': {
        'update': function(node, val) {
          var newVal = (val['default'] === undefined) ? '' : val['default'];
          node.set('value', newVal);
        }
      }
    },
    'render': function(model, viewletMgrAttrs) {
      this.container = Y.Node.create(this.templateWrapper);

      // This is to allow for data binding on the ghost settings
      // while using a shared template across both inspectors
      var templateOptions = model.getAttrs();

      // XXX - Jeff
      // not sure this should be done like this
      // but this will allow us to use the old template.
      templateOptions.settings = utils.extractServiceSettings(
          model.get('options'));

      templateOptions.constraints = utils.getConstraints(
          // no current constraints in play.
          {},
          viewletMgrAttrs.env.genericConstraints);

      // Signalling to the shared templates that this is the ghost view.
      templateOptions.ghost = true;
      this.container.setHTML(this.template(templateOptions));

      var ResizingTextarea = plugins.ResizingTextArea;
      this.container.all('textarea.config-field').plug(ResizingTextarea, {
        max_height: 200,
        min_height: 18,
        single_line: 18
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
