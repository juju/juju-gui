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

YUI.add('entity-extension', function(Y) {
  var ns = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

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
      Parse the owner from the ID.
      @method ownerFromId
      @return {String} the charm owner.
     */
    ownerFromId: function() {
      var id = this.get('id'),
          owner = id.split('/')[0];
      if (owner.indexOf('~') === 0) {
        return owner.replace('~', '');
      } else {
        return 'charmers';
      }
    },

    /**
      Produces a POJO useful as a display object.
      @method toEntity
      @return {Object} a plain Javascript object containing attributes.
    */
    toEntity: function() {
      var attrs = this.getAttrs(),
          type = attrs.entityType;
      var entity = {
        description: attrs.description,
        displayName: attrs.name.replace('-', ' '),
        downloads: attrs.downloads,
        id: attrs.id,
        storeId: attrs.storeId,
        name: attrs.name,
        owner: attrs.owner || this.ownerFromId(),
        promulgated: attrs.is_approved,
        revision_id: attrs.revision_id,
        revisions: attrs.revisions,
        special: attrs.special,  // XXX Not currently implemented.
        type: type,
        url: attrs.url
      };
      if (type === 'bundle') {
        entity.iconPath = utils.getIconPath(entity.id, true);
        entity.applications = this.parseBundleServices(
          this.get('applications'));
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

}, '', {
  requires: ['juju-view-utils']
});
