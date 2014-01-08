'use strict';


YUI.add('juju-view-networklist', function(Y) {

  var NetworkListView = Y.Base.create('networkListView', Y.View, [], {

    events: {
      '.add-network': { click: 'addNetwork' }
    },

    initializer: function() {},

    render: function(node) {
      var container = this.get('container');
      container.append(Y.juju.views.Templates['network-list']());
      node.append(container);
    },

    /**
    	Add a network.

    	@method addNetwork
    */
    addNetwork: function(evt) {
      this.get('db').networks.create({
        'name': 'foo',
        'cidr': '192.168.0.128/25',
        'networkId': '985hq3784d834dh78q3qo84dnq'
      });
      this.get('db').networks.each(function(net) {
        console.log(net.getAttrs());
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
