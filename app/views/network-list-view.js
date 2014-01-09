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

  // Incrementer for keeping placeholder names and IDs unique when testing
  var nameIncrementer = 0;

  var NetworkListView = Y.Base.create('networkListView', Y.View, [], {

    events: {
      '.add-network': { click: 'addNetwork' }
    },

    initializer: function() {},

    render: function() {
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
      this.get('db').networks.create({
        'name': 'net' + nameIncrementer,
        'cidr': '192.168.0.128/25',
        'networkId': '985hq3784d834dh78q3qo84dnq' + nameIncrementer
      });
      nameIncrementer += 1;
      this.render();
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
