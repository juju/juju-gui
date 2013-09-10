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


YUI.add('viewlet-service-relations', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = Y.namespace('juju.views').Templates,
      plugins = Y.namespace('juju.plugins'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');


  ns.relations = {
    name: 'relations',
    template: templates['service-relations-viewlet'],

    bindings: {
      aggregateRelations: {
        'update': function(node, value) {
          var db = this.viewlet.options.db;
          var service = this.viewlet.model;
          var relations = utils.getRelationDataForService(db, service);
          node.setHTML(templates['service-relations-list']({
            relations: relations
          }));
        }
      },
      aggregateRelationError: {
        'update': function(node, value) {
          // Aggregate the unit statuses here to display the relation status
        }
      }
    }
  };

}, '0.0.1', {
  requires: [
    'node',
    'juju-charm-models',
    'juju-view'
  ]
});
