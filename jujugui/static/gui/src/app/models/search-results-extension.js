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

YUI.add('search-result-extension', function(Y) {
  var ns = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  /**
   * Class extension that allows models to be displayed as search results.
   *
   * @namespace juju.models
   * @class SearchResult
   */
  function SearchResult() {}

  SearchResult.prototype = {

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
      Produces a search results object for rendering in the search result
      templates.
      @method toSearchResult
      @param {Object} charmstore the charmstore being searched.
      @return {Object} a plain Javascript object containing bundle attributes.
    */
    toSearchResult: function(charmstore) {
      var attrs = this.getAttrs(),
          type = attrs.entityType;
      result = {
          name: attrs.name,
          displayName: attrs.name.replace('-', ' '),
          type: type,
          special: attrs.special,  // XXX Not currently implemented.
          url: attrs.url,
          downloads: attrs.downloads,
          owner: attrs.owner || this.ownerFromId(),
          promulgated: attrs.is_approved
      };
      if (type === 'bundle') {
        var srvcs = this.get('services');
        result.services = this.parseBundleServices(srvcs, charmstore);
      } else {
        result.tags = attrs.categories;
        result.series = attrs.series;
        result.iconPath = utils.getIconPath(attrs.id, false, charmstore);
      }
      return result;
    }
  };

  ns.SearchResult = SearchResult;

}, '', {
  requires: ['juju-view-utils']
});
