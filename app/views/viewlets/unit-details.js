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


YUI.add('viewlet-unit-details', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = views.Templates,
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  ns.unitDetails = {
    name: 'unitDetails',
    templateWrapper: templates['left-breakout-panel'],
    template: templates.unitOverview,
    slot: 'left-hand-panel',

    // Return the template context for the unit detail view.
    'getContext': function(db, service, unit) {
      var ipDescriptionChunks = [];
      if (unit.public_address) {
        ipDescriptionChunks.push(unit.public_address);
      }
      if (unit.private_address) {
        ipDescriptionChunks.push(unit.private_address);
      }
      if (unit.open_ports) {
        ipDescriptionChunks.push(unit.open_ports.join(', '));
      }
      var unitIPDescription;
      if (ipDescriptionChunks.length) {
        unitIPDescription = ipDescriptionChunks.join(' | ');
      }
      // Ignore relations errors.
      var state = utils.simplifyState(unit, true);
      var relation_errors = unit.relation_errors || {},
          relations = utils.getRelationDataForService(db, service);
      Y.each(relations, function(rel) {
        var match = relation_errors[rel.near.name],
            far = rel.far || rel.near;
        rel.has_error = !!(match && match.indexOf(far.service) > -1);
      });
      return {
        unit: unit,
        unitIPDescription: unitIPDescription,
        relations: relations,
        landscapeURL: utils.getLandscapeURL(db.environment, unit)
      };
    },

    'render': function(unit, viewletManagerAttrs) {
      var db = viewletManagerAttrs.db;
      var service = db.services.getById(unit.service);
      var context = this.getContext(db, service, unit);
      this.container = Y.Node.create(this.templateWrapper({}));
      this.container.one('.content').setHTML(this.template(context));
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
