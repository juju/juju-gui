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
  Added Services button view and extension.
*/
YUI.add('added-services-button', function(Y) {

  var views = Y.namespace('juju.views');

  /**
    Adds the added services button render method.

    @method AddedServicesButtonExtension
  */
  function AddedServicesButtonExtension() {}

  AddedServicesButtonExtension.prototype = {
    /**
      Renders the added services button to the element in the parents container
      with the class 'added-services-button '.'

      @method _renderAddedServicesButton
    */
    _renderAddedServicesButton: function() {}
  };

  views.AddedServicesButtonExtension = AddedServicesButtonExtension;

  /**
    Provides the added services switcher button.

    @class views.AddedServicesButton
    @extends {Y.View}
  */
  var AddedServicesButton = Y.Base.create('added-services-button', Y.View, [], {

    /**
      Sets up the added services button.

      @method initializer
    */
    initializer: function() {},

    /**
      Property tears down the added services button.

      @method destructor
    */
    destructor: function() {}

  });

  views.AddedServicesButton = AddedServicesButton;

}, '', {
  requires: [
    'base-build',
    'view'
  ]
});
