'use strict';

YUI.add('juju-config', function(Y) {

    Y.namespace('juju').config = {
        serverRouting: false,
        html5: true,
        container: '#main',
        viewContainer: '#main',
        // FIXME: turn off transitions until they are fixed.
        transitions: false,
        charm_store: new Y.DataSource.IO({source: 'http://jujucharms.com/'}),
        socket_url: 'ws://localhost:8081/ws'
    };

}, '0.1.0', {
    requires: [
        'datasource-io'
    ]
});
