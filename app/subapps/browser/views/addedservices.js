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
  Sidebar added services view.

  @module juju.views
*/
YUI.add('juju-addedservices', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      Templates = views.Templates;

  ns.AddedServices = Y.Base.create('addedservices', Y.View, [
    views.SearchWidgetMgmtExtension
  ], {

    template: Templates.addedservices,

    /**
      Sets the default properties.

      @method initializer
    */
    initializer: function() {
      this.searchWidget = null;
    },

    /**
      Renders the added services list.

      This method should always be idempotent.

      @method render
    */
    render: function() {
      var container = this.get('container');
      container.setHTML(this.template());
      // Provided by 'search-widget-mgmt-extension'.
      this._renderSearchWidget();
    },

    /**
      Destroys the rendered tokens.

      @method destructor
    */
    destructor: function() {
      this.get('container').remove(true);
    }
  },
  {
    ATTRS: {
    }
  });

}, '', {
  requires: [
    'search-widget-mgmt-extension',
    'view'
  ]
});
