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
      Inserts the container into the DOM.

      All subclasses need to call this from their render methods to add the
      wrapper into the DOM.

      @method _insertContainer
    */
    _insertContainer: function() {
      this.get('container').appendTo(Y.one('#content'));
    },

    /**
      NOOP. This method is to be overwritten by any class which extends this
      one and is called after the default render methods are called.

      @method renderUI
    */
    renderUI: function() {},

    /**
      Default render method that calls the viewlet managers render method
      and the user defined renderUI method.

      @method render
    */
    render: function() {
      this._insertContainer();
      // Call the inspector base render method.
      this.constructor.superclass.render.call(this);
      this.renderUI();
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
