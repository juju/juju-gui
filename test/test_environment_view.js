'use strict';

(function () {

    describe('juju environment view', function() {
        var views, models, Y, container, service, db, conn,
            juju, env, testUtils, navbar;

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
                    'public-address': '192.168.122.113',
                    'id': 'mediawiki/0'
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
            navbar = Y.Node.create('<div class="navbar" ' +
                'style="height:70px;">Navbar</div>');
            Y.one('body').append(navbar);
            db = new models.Database();
            db.on_delta({data: environment_delta});
            done();
        });

        afterEach(function(done) {
            container.remove();
            container.destroy();
            Y.one('body').removeChild(navbar);
            db.destroy();
            env._txn_callbacks = {};
            conn.messages = [];
            done();
        });

        // Ensure the environment view loads properly
        it('must be able to render service blocks and relations',
            function() {
                // Create an instance of EnvironmentView with custom env
                var view = new views.EnvironmentView({
                    container: container,
                    db: db,
                    env: env
                }).render();

                container.all('.service-border').size().should.equal(3);
                container.all('.relation').size().should.equal(1);
                // Verify that the paths render 'properly' where this 
                // means no NaN in the paths
                var line = container.one('.relation');
                Y.each(['x1', 'y1', 'x2', 'y2'], 
                    function(e) {
                    Y.Lang.isNumber(
                        parseInt(this.getAttribute(e), 10))
                            .should.equal(true);
                }, line);
         });

        // Ensure that we can add a relation
        it('must be able to add a relation between services',
            function(done) {
                var view = new views.EnvironmentView({
                    container: container,
                    db: db,
                    env: env
                }).render();
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

        // Ensure that the zoom controls work
        it('must be able to zoom using controls', function(done) {
            var view = new views.EnvironmentView({
                container: container,
                db: db,
                env: env
            }).render();
            var zoom_in = container.one('#zoom-in-btn'),
                zoom_out = container.one('#zoom-out-btn'),
                svg = container.one('svg g g');
            zoom_in.after('click', function() {
                view.zoom_in();
                var attr = svg.getAttribute('transform');
                // Ensure that, after clicking the zoom in button, that the
                // scale portion of the transform attribute of the svg
                // element has been upped by 0.2.  The transform attribute
                // also contains translate, so test via a regex.
                /scale\(1.2\)/.test(attr).should.equal(true);
                done();
            });
            zoom_in.simulate('click');
        });

        // Ensure that sizes are computed properly
        it('must be able to compute rect sizes based on the svg and' +
                ' viewport size',
            function(done) {
                var view = new views.EnvironmentView({
                    container: container,
                    db: db,
                    env: env
                }).render();
                var svg = Y.one('svg');

                parseInt(svg.one('rect').getAttribute('height'), 10)
                    .should.equal(parseInt(svg.getComputedStyle('height'), 
                    10));
                parseInt(svg.one('rect').getAttribute('width'), 10)
                    .should.equal(parseInt(svg.getComputedStyle('width'), 
                    10));
                done();
            }
        );

        // Ensure that sizes are computed properly
        it('must be able to compute sizes by the viewport with a minimum',
            function(done) {
                var view = new views.EnvironmentView({
                    container: container,
                    db: db,
                    env: env
                }).render();
                var svg = Y.one('svg');
                parseInt(svg.getAttribute('height'), 10).should.be.above(599);
                done();
            }
        );

    });

describe('view model support infrastructure', function() {
     var Y, views, models;

     before(function (done) {
         Y = YUI(GlobalConfig).use(['juju-views', 'juju-models'], 
             function (Y) {
                 views = Y.namespace('juju.views');
                 models = Y.namespace('juju.models');
                 done();
             });
         });

     it('must be able to get us nearest connectors', 
        function () {
            var b1 = views.BoundingBox(),
            b2 = views.BoundingBox();
                     
            // raw poperty access
            b1.x = 0; b1.y = 0;
            b1.w = 100; b1.h = 200;

            // Use pos to set b2
            b2.pos = {x: 200, y: 300, w: 100, h: 200};

            b1.getXY().should.eql([0, 0]);
            b2.getWH().should.eql([100, 200]);

            b1.getNearestConnector([0, 0]);

            b1.getNearestConnector(b2).should.eql([50, 200]);
            b2.getNearestConnector(b1).should.eql([250, 300]);

            b1.getConnectorPair(b2).should.eql([[50, 200], [250, 300]]);
            });

     it('must be able to save and restore old position information',
        function() {
            var b1 = views.BoundingBox(),
            b2 = views.BoundingBox();
                     
            // raw poperty access
            b1.x = 0; b1.y = 0;
            b1.w = 100; b1.h = 200;

            // Use pos to set b2
            b2.pos = {x: 200, y: 300, w: 100, h: 200};

            // update using property
            b1.x = 100;
            b1.x.should.equal(100);
            b1.px.should.equal(0);

            // update using pos
            b2.pos = {x:300};
            b2.x.should.equal(300);
            b2.px.should.equal(200);

        });
                  
     it('must be able to access model attributes easily', function() {
           var service = new models.Service({id: 'mediawiki',
                                            exposed: true}),
           b1 = new views.BoundingBox();
           b1.model(service);
            
           b1.modelId().should.equal('service-mediawiki');
           b1.toString().should.equal('service-mediawiki');

           // properties of the model have mapped to the box
           b1.id.should.equal('mediawiki');
           b1.exposed.should.equal(true);
     });

     it('must be able to update position data and not touch model data',
        function() {
           var service = new models.Service({id: 'mediawiki',
                                            exposed: true}),
           b1 = new views.BoundingBox();
           b1.model(service);
           b1.x = 0; b1.y = 0;
           b1.w = 100; b1.h = 200;
           b1.id.should.equal('mediawiki');

           // X/Y updated, other keys ignored
           b1.pos = {x:100, y:100, id: 'mediawiki'};
           b1.x.should.equal(100);
           b1.id.should.equal('mediawiki');
           
        });

     it('must be able to map from sequence of models to boundingboxes',
       function() {
           var units = new models.ServiceUnitList();
           units.add([{id: 'mysql/0'},
                      {id: 'mysql/1'},
                      {id: 'mysql/2'},
                      {id: 'mysql/3'}]);
           
           units.size().should.equal(4);
           var boxes = units.map(views.toBoundingBox);
           boxes.length.should.equal(4);
           boxes[0].id.should.equal('mysql/0');

           // Also extract the computed mysql
           boxes[3].id.should.equal('mysql/3');
           boxes[3].service.should.equal('mysql');
       });

       it('must be able to support pairs of boundingBoxes', function() {
            var b1 = new views.BoundingBox(),
                b2 = new views.BoundingBox();

            b1.x = 0; b1.y = 0;
            b1.w = 100; b1.h = 200;

            b2.x = 200; b2.y = 300;
            b2.w = 100; b2.h = 200;

            var pair = views.BoxPair()
                           .source(b1)
                           .target(b2);

            pair.source().getXY().should.eql([0,0]);
            pair.target().getXY().should.eql([200, 300]);
       });

       it('must support composite modelIds on BoxPairs', function() {
            var b1 = new views.BoundingBox(),
                b2 = new views.BoundingBox(),
                service1 = new models.Service({id: 'mediawiki'}),
                service2 = new models.Service({id: 'haproxy'});

            b1.model(service1);
            b2.model(service2);

            var pair = views.BoxPair()
                           .source(b1)
                           .target(b2);
            pair.modelIds().should.not.contain(',');
            pair.modelIds().should.equal(
                'service-mediawiki:service-haproxy');
       });

});

})();
