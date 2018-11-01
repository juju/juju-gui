/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2015 Canonical Ltd.

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

const utils = require('../init/utils');

window.yui.add(
  'entity-extension',
  function(Y) {
    var ns = Y.namespace('juju.models');

    /**
     * Class extension containing functionality common to both charms and
     * bundles.
     *
     * @namespace juju.models
     * @class EntityExtension
     */
    function EntityExtension() {}

    EntityExtension.prototype = {
      /**
      Produces a POJO useful as a display object.
      @method toEntity
      @return {Object} a plain Javascript object containing attributes.
    */
      toEntity: function() {
        const attrs = this.getAttrs();
        const type = attrs.entityType;
        let displayName;
        if (attrs.name === 'canonical-kubernetes') {
          displayName = 'The Canonical Distribution Of Kubernetes';
        } else {
          displayName = attrs.name.split('-').join(' ');
        }
        const entity = {
          description: attrs.description,
          displayName: displayName,
          downloads: attrs.downloads,
          id: attrs.id,
          storeId: attrs.storeId,
          // Store a reference to the model e.g. for deploying a charm.
          model: this,
          name: attrs.name,
          owner: attrs.owner,
          price: attrs.price,
          promulgated: attrs.is_approved,
          revision_id: attrs.revision_id,
          revisions: attrs.revisions,
          special: attrs.special, // XXX Not currently implemented.
          supported: attrs.supported,
          supportedDescription: attrs.supportedDescription,
          type: type,
          url: attrs.url
        };
        if (type === 'bundle') {
          entity.iconPath = utils.getIconPath(entity.id, true);
          entity.applications = this.parseBundleServices(this.get('applications'));
          entity.serviceCount = attrs.serviceCount;
          entity.machineCount = attrs.machineCount;
          entity.unitCount = attrs.unitCount;
        } else {
          entity.iconPath = utils.getIconPath(entity.id, false);
          entity.series = attrs.series;
          entity.tags = attrs.tags || [];
        }
        return entity;
      }
    };

    ns.EntityExtension = EntityExtension;
  },
  '',
  {
    requires: []
  }
);
