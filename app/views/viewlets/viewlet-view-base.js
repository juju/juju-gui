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


YUI.add('viewlet-view-base', function(Y) {
  var ns = Y.namespace('juju.viewlets');

  /**
    Extension for any Y.View's which are to be viewlets so that they have
    show and hide methods that the viewlet manager can use. This also provides
    a default render method which will likely be overridden in many Views.

    @class ViewletBaseView
  */
  function ViewletBaseView() {}

  ViewletBaseView.prototype = {
    /**
     Model change events handles associated with this viewlet.

     @property _eventHandles
     @type {Array}
     @default empty array
     @private
    */
    _eventHandles: [],
    /**
      Used for conflict resolution. When the user changes a value on a bound
      viewlet we store a reference of the element key here so that we know to
      offer a conflict resolution.

      @property changedValues
      @type {Object}
      @default empty object
    */
    changedValues: {},
    /**
      Shows the container of the view

      @method show
    */
    show: function() {
      this.get('container').show();
    },
    /**
      Hides the container of the view

      @method hide
    */
    hide: function() {
      this.get('container').hide();
    },
    /**
      Renders the template into the container

      @method render
    */
    render: function() {
      this.get('container').append(this.template(this.get('model')));
    }
  };

  ns.ViewletBaseView = ViewletBaseView;

}, '', {
  requires: [
    'view'
  ]
});
