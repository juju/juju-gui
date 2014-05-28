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
      widgets = Y.namespace('juju.widgets');

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
      // It only makes sense to render search if we have a store to use to
      // search against.
      var store = this.get('store');
      if (store && !this.searchWidget) {
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
          var searchElement = this.get('container').one('.search-widget'),
              withHome = 'with-home';
          if (e.newVal) {
            searchElement.addClass(withHome);
          } else {
            searchElement.removeClass(withHome);
          }
        }, this);
      }
    }
  };

  views.SearchWidgetMgmtExtension = SearchWidgetMgmtExtension;

});
