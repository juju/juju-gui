'use strict';

(function () {

    describe('juju environment view', function() {
        var EnvironmentView, views, models, Y, container, service, db, conn,
            juju, env, testUtils;

        var environment_delta = {
            'result': [
                ['service', 'add', {
                    'charm': 'cs:precise/wordpress-6',
                    'id': 'wordpress',
                    'exposed': false
                }], ['service', 'add', {
                    'charm': 'cs:precise/mediawiki-3',
                    'id': 'mediawiki',
                    'exposed': false
                }], ['service', 'add', {
                    'charm': 'cs:precise/mysql-6',
                    'id': 'mysql'
                }], ['relation', 'add', {
                    'interface': 'reversenginx',
                    'scope': 'global',
                    'endpoints': [
                        ['wordpress', {'role': 'peer', 'name': 'loadbalancer'}]
                    ],
                    'id': 'relation-0000000000'
                }], ['relation', 'add', {
                    'interface': 'mysql',
                    'scope': 'global',
                    'endpoints': [
                        ['mysql', {'role': 'server', 'name': 'db'}],
                        ['wordpress', {'role': 'client', 'name': 'db'}]
                    ], 'id': 'relation-0000000001'
                }], ['machine', 'add', {
                    'agent-state': 'running',
                    'instance-state': 'running',
                    'id': 0,
                    'instance-id': 'local',
                    'dns-name': 'localhost'
                }], ['unit', 'add', {
                    'machine': 0,
                    'agent-state': 'started',
                    'public-address': '192.168.122.113',
                    'id': 'wordpress/0'
                }], ['unit', 'add', {
                    'machine': 0,
                    'agent-state': 'started',
                    'public-address': '192.168.122.222',
                    'id': 'mysql/0'
                }]
            ],
            'op': 'delta'
        };

        before(function (done) {
            Y = YUI(GlobalConfig).use([
                'juju-views', 'juju-tests-utils', 'juju-env',
                'node-event-simulate', 'juju-gui'
                ], function (Y) {
                testUtils = Y.namespace('juju-tests.utils');
                views = Y.namespace('juju.views');
                models = Y.namespace('juju.models');
                conn = new testUtils.SocketStub();
                juju = Y.namespace('juju');
                env = new juju.Environment({conn: conn});
                env.connect();
                conn.open();
                env.dispatch_result(environment_delta);
                EnvironmentView = views.environment;
                done();
            });
        });

        after(function(done)  {
            env.destroy();
            done();
        });

        beforeEach(function (done) {
            container = Y.Node.create('<div id="test-container" />');
            Y.one('body').append(container);
            var navbar = Y.Node.create('<div class="navbar" ' +
                'style="height:70px;">Navbar</div>');
            Y.one('body').append(navbar);
            db = new models.Database();
            db.on_delta({data: environment_delta});
            done();
        });

        afterEach(function(done) {
            container.remove();
            container.destroy();
            Y.one('body').removeChild(Y.one('.navbar'));
            db.destroy();
            env._txn_callbacks = {};
            conn.messages = [];
            done();
        });

        // Ensure the environment view loads properly
        it('must be able to render service blocks and relations',
            function(done) {
                // Create an instance of EnvironmentView with custom env
                var view = new EnvironmentView({
                    container: container,
                    domain_models: db,
                    env: env
                });
                view.render();
                container.all('.service-border').size().should.equal(3);
                container.all('.relation').size().should.equal(1);
                done();
            }
        );

        // Ensure that we can add a relation
        it('must be able to add a relation between services',
            function(done) {
                var view = new EnvironmentView({
                    container: container,
                    domain_models: db,
                    env: env
                });
                view.render();
                var add_relation = container.one('#add-relation-btn'),
                    service = container.one('.service');
                add_relation.after('click', function() {
                    // view doesn't capture click event from test, so fire
                    // this manually
                    view.add_relation();
                    container.all('.selectable-service').size()
                        .should.equal(3);
                    service.simulate('click');
                });
                service.after('click', function() {
                    container.all('.selectable-service').size()
                        .should.equal(2);
                    service.next().simulate('click');
                });
                service.next().after('click', function() {
                    container.all('.selectable-service').size()
                        .should.equal(0);
                    done();
                });
                add_relation.simulate('click');
            }
        );

    });

})();
