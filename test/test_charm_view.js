'use strict';

(function () {

    describe('juju charm view', function() {
        var CharmView, localCharmStore, views, Y;

        var charmQuery = '/charms/precise/postgresql/json';

        var charmResults = {
            "maintainer": "Mark Mims <mark.mims@canonical.com>",
            "series": "precise",
            "owner": "charmers",
            "provides": {
                "db-admin": {
                    "interface": "pgsql"
                },
                "db": {
                    "interface": "pgsql"
                }
            },
            "description": "PostgreSQL is a fully featured RDBMS.",
            "name": "postgresql",
            "summary": "object-relational SQL database (supported version)",
            "bzr_branch": "lp:~charmers/charms/precise/postgresql/trunk",
            "last_change": {
                "committer": "David Owen <david.owen@canonical.com>",
                "message": "Only reload for pg_hba updates",
                "revno": 24,
                "created": 1340206387.539
            },
            "proof": {}
        };

        before(function (done) {
            Y = YUI(GlobalConfig).use(['juju-views', 'node-event-simulate'],
                function (Y) {
                views = Y.namespace('juju.views');
                CharmView = views.charm;
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
        it('must fire the deploy charm event when requested', function(done) {
            var charmView = new CharmView({
                charm_data_url: charmQuery,
                charm_store: localCharmStore
            });
            var deployCharmFired = false;
            charmView.on('deployCharm', function() {
                deployCharmFired = true;
            });
            var deployInput = charmView.get('container').one('#charm-deploy');
            deployInput.after('click', function() {
                deployCharmFired.should.equal(true);
                done();
            });
            deployInput.simulate('click');
        });

    });

})();
