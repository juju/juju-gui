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


/**
   Provides the sharing overlay widget.

   @namespace juju
   @module widgets
   @submodule browser
 */
YUI.add('browser-sharing-overlay', function(Y) {
  var ns = Y.namespace('juju.widgets.browser');
  ns.SharingOverlay= Y.Base.create('SharingOverlay', Y.Widget, [], {
    TEMPLATE: Y.namespace('juju.views').Templates['sharing-overlay'],

    _handleClick: function(e) {
      if (this.get('visible')) {
        this.hide();
      } else {
        this.show();
      }
    },

    /**
       Binds the button events to the UI

       @method bindUI
     */
    bindUI: function() {
      var button = this.get('button');
      button.on('click', this._handleClick, this);
    },

    /**
       Renders the overlay.

       @method renderUI
     */
    renderUI: function() {
      var content = this.TEMPLATE();
      var container = this.get('contentBox');
      container.setHTML(content);
      this.hide();
    }
  }, {
    ATTRS: {
      button: {}
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'handlebars',
    'juju-templates',
    'widget'
  ]
});
