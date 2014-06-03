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

YUI.add('inspector-base', function(Y) {
  var ns = Y.namespace('juju.views'),
      viewlets = Y.namespace('juju.viewlets');

  /**
    Base class for any inspectors.

    @class Inspector
    @constructor
    @extends {juju.viewlets.ViewletManager}
  */
  ns.Inspector = Y.Base.create('inspector-base', viewlets.ViewletManager, [], {

    viewletContainer: '.viewlet-container',

    template: '<div class="viewlet-container"></div>',

    /**
      Renders the view's container into the DOM.

      @method _insertContainer
    */
    _insertContainer: function() {
      var node;
      node = Y.one('#bws-sidebar .bws-content');
      if (!node) {
        // mocha + chai + simulate captures any errors thrown here making them
        // impossible to debug, this will help any future us find it.
        console.error('Inspector container is not yet rendered');
      }
      this.get('container').appendTo(node);
    }

  }, {
    ATTRS: {
      container: {
        'valueFn': function() {
          return Y.Node.create(ns.Templates['service-inspector']());
        }
      }
    }
  });

}, '', {
  requires: [
    'juju-viewlet-manager',
    'juju-templates'
  ]
});
