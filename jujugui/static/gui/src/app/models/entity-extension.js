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
          displayName: attrs.name.replace('-', ' '),
          downloads: attrs.downloads,
          id: attrs.id,
          name: attrs.name,
          owner: attrs.owner || this.ownerFromId(),
          promulgated: attrs.is_approved,
          revisions: attrs.revisions,
          special: attrs.special,  // XXX Not currently implemented.
          type: type,
          url: attrs.url
      };
      if (type === 'bundle') {
        entity.iconPath = '/juju-ui/assets/images/non-sprites/bundle.svg';
        var srvcs = this.get('services');
        entity.services = this.parseBundleServices(srvcs);
      } else {
        entity.iconPath = utils.getIconPath(attrs.id, false);
        entity.series = attrs.series;
        entity.tags = [];
        var categories = attrs.categories,
            idx;
        for (idx in categories) {
          entity.tags.push(categories[idx]);
        }
      }
      return entity;
    }
  };

  ns.EntityExtension = EntityExtension;

}, '', {
  requires: ['juju-view-utils']
});
