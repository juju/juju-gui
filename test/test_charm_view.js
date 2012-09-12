'use strict';

(function () {

    describe('juju charm view', function() {
        var CharmView, juju, localCharmStore, testUtils, Y;

        var charmQuery = '/charms/precise/postgresql/json';

        var charmResults = {
            'maintainer': 'Mark Mims <mark.mims@canonical.com>',
            'series': 'precise',
            'owner': 'charmers',
            'provides': {
                'db-admin': {
                    'interface': 'pgsql'
                },
                'db': {
                    'interface': 'pgsql'
                }
            },
            'description': 'PostgreSQL is a fully featured RDBMS.',
            'name': 'postgresql',
            'summary': 'object-relational SQL database (supported version)',
            'bzr_branch': 'lp:~charmers/charms/precise/postgresql/trunk',
            'last_change': {
                'committer': 'David Owen <david.owen@canonical.com>',
                'message': 'Only reload for pg_hba updates',
                'revno': 24,
                'created': 1340206387.539
            },
            'proof': {}
        };

        before(function (done) {
            Y = YUI(GlobalConfig).use([
                'juju-views', 'juju-tests-utils', 'juju-env',
                'node-event-simulate'
                ], function (Y) {
                testUtils = Y.namespace('juju-tests.utils');
                juju = Y.namespace('juju');
                CharmView = juju.views.charm;
                // Use a local charm store.
                localCharmStore = new Y.DataSource.Local({
                    source: [{
                        responseText: Y.JSON.stringify(charmResults)
                    }]
                });
                done();
            });
        });

        // Ensure the charm view correctly requests a charm deploy.
        it('must be able to deploy a charm', function(done) {
            var conn = new testUtils.SocketStub();
            var env = new juju.Environment({conn: conn});
            env.connect();
            conn.open();
            // Create an instance of CharmView passing a customized env.
            var charmView = new CharmView({
                charm_data_url: charmQuery,
                charm_store: localCharmStore,
                env: env
            });
            var deployInput = charmView.get('container').one('#charm-deploy');
            deployInput.after('click', function() {
                var msg = conn.last_message();
                // Ensure the websocket received the `deploy` message.
                msg.op.should.equal('deploy');
                msg.charm_url.should.contain('postgresql');
                // Ensure a redirection to the environment view is performed
                // once the charm is deployed.

                done();
            });
            deployInput.simulate('click');
        });

    });

})();
