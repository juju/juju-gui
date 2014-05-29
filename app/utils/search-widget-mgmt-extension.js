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

/*
  Sidebar charm browser view.

  @module juju.browser
  @submodule views
*/
YUI.add('search-widget-mgmt-extension', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      models = Y.namespace('juju.models');

  /**
    Adds the search widget functionality to a view.

    @method SearchWIdgetMgmtExtension
  */
  function SearchWidgetMgmtExtension() {}

  SearchWidgetMgmtExtension.prototype = {
    /**
      Renders the search widget into the container.

      @method _renderSearchWidget
    */
    _renderSearchWidget: function() {
      // Only render search if we have a store.
      var store = this.get('store');
      if (store) {
        this.searchWidget = new widgets.browser.Search({
          autocompleteSource: Y.bind(
              store.autocomplete,
              store),
          autocompleteDataFormatter: store.transformResults,
          categoryIconGenerator: Y.bind(store.buildCategoryIconPath, store),
          filters: this.get('filters')
        });
        this.searchWidget.render(this.get('container').one('.search-widget'));
        this._bindSearchWidgetEvents();
      }
    },

    /**
      Binds the events for the search widget

      @method _bindSearchWidgetEvents
    */
    _bindSearchWidgetEvents: function() {
      var searchWidget = this.searchWidget;
      if (searchWidget) {
        this.addEvent(
            searchWidget.on(
                searchWidget.EVT_SEARCH_CHANGED, this._searchChanged, this)
        );
        this.addEvent(
            searchWidget.on(
                searchWidget.EVT_DEPLOY, this._deployEntity, this)
        );
        this.addEvent(
            searchWidget.on(
                searchWidget.EVT_SEARCH_GOHOME, this._goHome, this)
        );

        this.after('withHomeChange', function(e) {
          var container = this.get('container'),
              withHome = 'with-home';
          if (e.newVal) {
            container.addClass(withHome);
          } else {
            container.removeClass(withHome);
          }
        }, this);
      }
    },

    /**
      When search box text has changed navigate away.

      @method _searchChanged
      @param {Event} e the form submit event.
    */
    _searchChanged: function(e) {
      if (e && e.halt) { e.halt(); }
      var change = {
        search: true,
        filter: {
          text: e.newVal
        }
      };
      // Perhaps there's more to this change than just a search change. This
      // might come from places, such as autocomplete, which are a search
      // change, but also want to select a charm id as well.
      if (e.change) {
        change = Y.merge(change, e.change);
      }
      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            component: 'charmbrowser',
            metadata: {
              search: change.filter,
              id: change.charmID
            }
          }});
      } else {
        this.fire('viewNavigate', {change: change});
      }
    },

    /**
      Force a navigate event when the search widget says "Home" was clicked.

      @method _goHome
    */
    _goHome: function() {
      if (window.flags && window.flags.il) {
        this.set('withHome', false);
        this.fire('changeState', {
          sectionA: {
            metadata: null,
            component: null
          }
        });
      } else {
        var change = {
          charmID: undefined,
          hash: undefined,
          search: false,
          filter: {
            clear: true
          }
        };
        this.fire('viewNavigate', {change: change});
      }
    },

    /**
      Deploy either a bundle or charm given by the quicksearch widget.

      @method _deployEntity
      @param {Y.Event} e The event object from the widget.
    */
    _deployEntity: function(e) {
      var entityType = e.entityType,
          entity = e.data,
          entityId = e.id,
          deployer;

      if (entityType === 'bundle') {
        deployer = this.get('deployBundle');
        var bundle = new models.Bundle(entity);
        deployer(bundle.get('data'));
      } else {
        deployer = this.get('deployService');
        var charm = new models.Charm(entity);
        var ghostAttributes;
        ghostAttributes = {
          icon: this.get('store').iconpath(charm.get('storeId'))
        };
        deployer.call(null, charm, ghostAttributes);
      }
    }
  };

  views.SearchWidgetMgmtExtension = SearchWidgetMgmtExtension;

}, '', {
  requires: [
    'browser-search-widget'
  ]
});
