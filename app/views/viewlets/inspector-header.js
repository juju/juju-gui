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


YUI.add('viewlet-inspector-header', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      templates = Y.namespace('juju.views').Templates,
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  ns.inspectorHeader = {
    name: 'inspectorHeader',
    template: templates['inspector-header'],
    slot: 'header',
    bindings: {
      icon: {
        'update': function(node, value) {
          // XXX: Icon is only present on services that pass through
          // the Ghost phase of the GUI. Once we have better integration
          // with the charm browser API services handling of icon
          // can be improved.
          var icon = node.one('img');
          if (icon === null && value) {
            node.append('<img>');
            icon = node.one('img');
          }
          if (value) {
            icon.set('src', value);
          }
        }
      }
    },
    'render': function(model, viewContainerAttrs) {
      this.container = Y.Node.create(this.templateWrapper);
      var pojoModel = model.getAttrs();
      if (pojoModel.scheme) {
        pojoModel.ghost = true;
      }
      if (pojoModel.charm) {
        pojoModel.charmUrl = pojoModel.charm;
      } else {
        pojoModel.charmUrl = pojoModel.id;
      }
      this.container.setHTML(this.template(pojoModel));
    }
  };

}, '0.0.1', {
  requires: [
    'node',
    'juju-charm-models',
    'juju-templates',
    'juju-view'
  ]
});
