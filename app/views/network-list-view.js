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


YUI.add('juju-view-networklist', function(Y) {

  var utils = Y.namespace('juju.views').utils;

  // Incrementer for keeping placeholder names and IDs unique when testing
  var nameIncrementer = 0;

  var NetworkListView = Y.Base.create('networkListView', Y.View, [], {

    events: {
      '.add-network': { click: 'addNetwork' },
      '.network': { click: 'fadeServices' }
    },

    /**
      Renders the network list viewport.

      @method render
      @param {Object} node The element that we render this view into.
    */
    render: function(node) {
      var container = this.get('container');
      var networks = [];

      this.get('db').networks.each(function(net) {
        networks.push(net.getAttrs());
      });

      container.setHTML(Y.juju.views.Templates['network-list'](
          {networks: networks}));
      Y.one('.network-list').setHTML(container);

      this.fire('render');
    },

    /**
      Add a network.

      @method addNetwork
    */
    addNetwork: function(evt) {
      var inputs = utils.getElementsValuesMapping(
          this.get('container'),
          '.input');

      var networkName = inputs['network-name'];

      // If the user doesn's specify a network name, generate one.
      // Otherwise use the given name.
      if (networkName === '') {
        networkName = 'net' + nameIncrementer;
      }
      this.get('db').networks.create({
        'name': networkName,
        'cidr': inputs['network-cidr'],
        'networkId': '985hq3784d834dh78q3qo84dnq' + nameIncrementer
      });
      nameIncrementer += 1;
      this.render();
    },

    /**
      Fade the services that aren't in the network
      that has been clicked

      @method fadeServices
      @param {Object} evt The evt fired from hitting the network button
    */
    fadeServices: function(evt) {
      var networkid = evt.currentTarget.getAttribute('data-network');
      this.fire('fadeNotNetworks', {
        networks: [networkid]
      });
    }

  }, {
    ATTRS: {
      /**
        The Juju environment backend.

        @attribute env
        @type {Object}
      */
      env: {},
      /**
        The Juju database.

        @attribute db
        @type {Object}
      */
      db: {}
    }
  });

  Y.namespace('juju.views').NetworkListView = NetworkListView;

});
