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

  var views = Y.namespace('juju.views'),
      templates = views.Templates;

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
    _renderAddedServicesButton: function(serviceCount, closed) {
      if (!this._addedServicesButton) {
        this._addedServicesButton = new views.AddedServicesButton();
        this._addedServicesButton.addTarget(this);
      }
      this._addedServicesButton.setAttrs({
        serviceCount: serviceCount || 0,
        closed: closed || false
      });
      this.get('container').one('.added-services-button').setHTML(
          this._addedServicesButton.render().get('container'));
    }
  };

  views.AddedServicesButtonExtension = AddedServicesButtonExtension;

  /**
    Provides the added services switcher button.

    @class views.AddedServicesButton
    @extends {Y.View}
  */
  var AddedServicesButton = Y.Base.create('added-services-button', Y.View, [], {

    template: templates['added-services-button'],

    /**
      Sets up the added services button.

      @method initializer
    */
    initializer: function() {
      this._clickEvent = this.get('container')
                             .on('click', this._clickHandler, this);
    },

    /**
      Click event handler for the container. Fires a 'toggleAddedServices' event
      with a payload about whether it should show or hide the Added Services.

      @method _clickHandler
      @param {Object} e The click event facade.
    */
    _clickHandler: function(e) {
      e.preventDefault();
      this.fire('changeState', {
        sectionA: {
          component: this.get('closed') ? 'services' : 'charmbrowser'
        }
      });
    },

    /**
      Renders the Added Services Button to the views container. Render is
      idempotent.

      @method render
      @return {Object} reference to the view.
    */
    render: function() {
      this.get('container').setHTML(this.template({
        count: this.get('serviceCount'),
        closed: this.get('closed')
      }));
      return this;
    },

    /**
      Properly tears down the added services button.

      @method destructor
    */
    destructor: function() {
      this._clickEvent.detach();
    }

  }, {
    ATTRS: {
      /**
        The number of services the user has in their environment.

        @attribute serviceCount
        @type {Integer}
        @default 0
      */
      serviceCount: {
        value: 0
      },
      /**
        Used to indicate whether or not the added services view is shown or not.

        @attribute closed
        @type {Boolean}
        @default false
      */
      closed: {
        value: false
      }
    }
  });

  views.AddedServicesButton = AddedServicesButton;

}, '', {
  requires: [
    'base-build',
    'event',
    'juju-templates',
    'view'
  ]
});
