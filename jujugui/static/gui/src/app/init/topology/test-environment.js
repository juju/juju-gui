/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const d3 = require('d3');

const environmentUtils = require('./environment-utils');
const EnvironmentView = require('./environment');
const testUtils = require('../../../test/utils');

(function() {

  describe('juju environment view', function() {
    var view, models, Y, container, db, conn, juju, jujuConfig,
        charm, click, ecs, env, relationUtils, fakeStore;

    var environment_delta = {
      'result': [
        ['applicationInfo', 'add', {
          'charm-url': 'cs:precise/wordpress-6',
          'name': 'wordpress',
          'exposed': false,
          'annotations': {'gui-x': 100, 'gui-y': 200}
        }],
        ['applicationInfo', 'add', {
          'charm-url': 'cs:precise/mediawiki-3',
          'name': 'mediawiki',
          'exposed': false
        }],
        ['applicationInfo', 'add', {
          'charm-url': 'cs:precise/mysql-26',
          'name': 'mysql'
        }],
        ['applicationInfo', 'add', {
          'subordinate': true,
          'charm-url': 'cs:precise/puppet-2',
          'name': 'puppet'
        }], [
          'relationInfo',
          'add', {
            key: 'wordpress:loadbalancer',
            id: 0,
            endpoints: [
              {
                'application-name': 'wordpress',
                relation: {
                  name: 'loadbalancer',
                  role: 'peer',
                  interface: 'reversenginx',
                  scope: 'global'
                }
              }
            ]
          }
        ], [
          'relationInfo',
          'add', {
            key: 'puppet:juju-info wordpress:juju-info',
            id: 1,
            endpoints: [
              {
                'application-name': 'puppet',
                relation: {
                  name: 'juju-info',
                  role: 'requirer',
                  interface: 'juju-info',
                  scope: 'container'
                }
              },
              {
                'application-name': 'wordpress',
                relation: {
                  name: 'juju-info',
                  role: 'provider',
                  interface: 'juju-info',
                  scope: 'container'
                }
              }
            ]
          }
        ], [
          'relationInfo',
          'add', {
            key: 'mysql:db wordpress:db',
            id: 2,
            endpoints: [
              {
                'application-name': 'mysql',
                relation: {
                  name: 'db',
                  role: 'server',
                  interface: 'mysql',
                  scope: 'global'
                }
              }, {
                'application-name': 'wordpress',
                relation: {
                  name: 'db',
                  role: 'client',
                  interface: 'mysql',
                  scope: 'global'
                }
              }
            ]
          }
        ],

        ['machineInfo', 'add', {
          'agent-status': {current: 'running'},
          'id': '0',
          'instance-id': 'local'
        }],
        ['unitInfo', 'add', {
          'machine-id': '0',
          'agent-status': {current: '', message: '', data: {}},
          'workload-status': {current: '', message: '', data: {}},
          'public-address': '192.168.122.113',
          'name': 'wordpress/0'
        }],
        ['unitInfo', 'add', {
          'machine-id': '0',
          'agent-status': {current: '', message: '', data: {}},
          'workload-status': {current: '', message: '', data: {}},
          'public-address': '192.168.122.113',
          'name': 'mediawiki/0'
        }],
        ['unitInfo', 'add', {
          'machine-id': '0',
          'agent-status': {current: '', message: '', data: {}},
          'workload-status': {current: '', message: '', data: {}},
          'public-address': '192.168.122.222',
          'name': 'mysql/0'
        }], [
          'annotationInfo',
          'change', {
            tag: 'application-wordpress',
            annotations: {
              'gui-x': 100,
              'gui-y': 200
            }
          }
        ]
      ]
    };

    // Additional relations between the same two services for collection
    // testing. Note that this uses the gojuju style relation ideas for
    // additional compatibility.
    var additionalRelations = { 'result': [
      [
        'relationInfo',
        'add', {
          key: 'mysql:db mediawiki:db',
          id: 5,
          endpoints: [
            {
              'application-name': 'mysql',
              relation: {
                name: 'db',
                role: 'server',
                interface: 'mysql',
                scope: 'global'
              }
            }, {
              'application-name': 'mediawiki',
              relation: {
                name: 'db',
                role: 'client',
                interface: 'mysql',
                scope: 'global'
              }
            }
          ]
        }
      ], [
        'relationInfo',
        'add', {
          key: 'mysql:db-slave mediawiki:db-slave',
          id: 6,
          endpoints: [
            {
              'application-name': 'mysql',
              relation: {
                name: 'db-slave',
                role: 'server',
                interface: 'mysql',
                scope: 'global'
              }
            }, {
              'application-name': 'mediawiki',
              relation: {
                name: 'db-slave',
                role: 'client',
                interface: 'mysql',
                scope: 'global'
              }
            }
          ]
        }
      ]
    ]};

    beforeAll(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-models',
        'dump',
        'juju-charm-models', 'environment-change-set'
      ], function(Y) {
        const getMockStorage = function() {
          return new function() {
            return {
              store: {},
              setItem: function(name, val) { this.store['name'] = val; },
              getItem: function(name) { return this.store['name'] || null; }
            };
          };
        };
        const userClass = new window.jujugui.User(
          {sessionStorage: getMockStorage()});
        userClass.controller = {user: 'user', password: 'password'};
        models = Y.namespace('juju.models');
        juju = Y.namespace('juju');
        window.yui = Y;
        done();
      });
    });

    beforeEach(function() {
      const getMockStorage = function() {
        return new function() {
          return {
            store: {},
            setItem: function(name, val) { this.store['name'] = val; },
            getItem: function(name) { return this.store['name'] || null; }
          };
        };
      };
      const userClass = new window.jujugui.User({storage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      relationUtils = window.juju.utils.RelationUtils;
      conn = new testUtils.SocketStub();
      db = new models.Database();
      ecs = new juju.EnvironmentChangeSet({db: db});
      env = new juju.environments.GoEnvironment({
        conn: conn, ecs: ecs, user: userClass});
      env.connect();
      conn.open();
      fakeStore = new window.jujulib.charmstore('http://1.2.3.4/');
      jujuConfig = window.juju_config;
      window.juju_config = {charmstoreURL: 'http://1.2.3.4/'};
      container = testUtils.makeContainer(this, 'content');
      // Use a clone to avoid any mutation
      // to the input set (as happens with processed
      // annotations, its a direct reference).
      db.onDelta({detail: {data: Y.clone(environment_delta)}});
      db.fireEvent = sinon.stub();
      var charmData = testUtils.loadFixture('data/mysql-api-response.json',
        true);
      charm = new models.Charm(charmData.charm);
      db.charms.add(charm);
      view = new EnvironmentView({
        container: container,
        db: db,
        env: {
          update_annotations: function() {},
          get: function() {}
        },
        charmstore: fakeStore,
        state: {changeState: sinon.stub()},
        sendAnalytics: sinon.stub()
      });
      click = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
    });

    afterEach(function(done) {
      container.remove();
      db.reset();
      db.destroy();
      charm.destroy();
      env._txn_callbacks = {};
      conn.messages = [];
      view.destructor();
      window.juju_config = jujuConfig;
      env.close(() => {
        env.destroy();
        done();
      });
    });

    function getParentId(view) {
      return view.topo ? view.topo._yuid : '';
    }

    it('should display help text when canvas is empty', function() {
      // Use a db w/o the delta loaded
      var db = new models.Database();
      view.db = db;
      view.render().rendered();

      // Verify we have help text.
      var help = document.querySelector('.environment-help');
      assert.isFalse(help.classList.contains('shrink'));
    });

    it('should not display help text when canvas is populated', function() {
      view.render().rendered();

      // Verify we do not have help text.
      var help = document.querySelector('.environment-help');
      assert.strictEqual(help.style.display, 'none');
    });

    it('should handle clicking the plus', function() {
      // Use a db w/o the delta loaded
      var db = new models.Database();
      view.db = db;
      const state = {
        changeState: sinon.stub()
      };
      view.state = state;
      view.render().rendered();

      var plus = document.querySelector('.environment-help .plus-service');
      plus.dispatchEvent(click);
      assert.equal(state.changeState.callCount, 1);
      assert.deepEqual(state.changeState.args[0][0], {
        root: 'store'
      });
    });

    it('must handle the window resize event', function(done) {
      var beforeResizeEventFired = false;
      view.render();

      const beforeHandler = e => {
        document.removeEventListener(
          'beforePageSizeRecalculation', beforeHandler);
        // This event must be fired.
        beforeResizeEventFired = true;
      };
      const afterHandler = e => {
        document.removeEventListener(
          'afterPageSizeRecalculation', afterHandler);
        // This event must be fired.
        assert.isTrue(beforeResizeEventFired);
        done();
      };
      document.addEventListener('beforePageSizeRecalculation', beforeHandler);
      document.addEventListener('afterPageSizeRecalculation', afterHandler);
      window.dispatchEvent(new Event('resize'));
    });

    it('must render services blocks correctly',
      function() {
        // Create an instance of EnvironmentView with custom env
        view = new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        });
        view.render();
        const serviceBlock = container.querySelector(
          '.service').querySelector('.service-block');
        serviceBlock.getAttribute('r').should.equal('90');
        serviceBlock.getAttribute('cy').should.equal('95');
        serviceBlock.getAttribute('cx').should.equal('95');
      });

    it('properly renders the create relation icon', function() {
      // Create an instance of EnvironmentView with custom env
      var view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      });
      view.render();
      var relationIcon = container.querySelector('.service .relation-button');
      var line = relationIcon.querySelector('line');
      var circles = relationIcon.querySelectorAll('circle');
      var img = relationIcon.querySelector('image');

      assert.equal(relationIcon.classList.contains('relation-button'), true);
      assert.equal(relationIcon.getAttribute('transform'), 'translate(95,30)');

      assert.equal(line.getAttribute('x1'), '0');
      assert.equal(line.getAttribute('y1'), '0');
      assert.equal(line.getAttribute('x2'), '0');
      assert.equal(line.getAttribute('y2'), '30');
      assert.equal(line.getAttribute('stroke-width'), '1');
      assert.equal(line.getAttribute('stroke'), '#888888');

      assert.equal(circles.item(0).getAttribute('cx'), '0');
      assert.equal(circles.item(0).getAttribute('cy'), '34');
      assert.equal(circles.item(0).getAttribute('r'), '4');
      assert.equal(circles.item(0).getAttribute('fill'), '#888888');

      assert.equal(
        circles.item(1).classList.contains('relation-button__link'), true);
      assert.equal(circles.item(1).getAttribute('cx'), '0');
      assert.equal(circles.item(1).getAttribute('cy'), '0');
      assert.equal(circles.item(1).getAttribute('r'), '15');
      assert.equal(circles.item(1).getAttribute('fill'), '#f8f8f8');
      assert.equal(circles.item(1).getAttribute('stroke'), '#888888');
      assert.equal(circles.item(1).getAttribute('stroke-width'), '1.1');

      assert.equal(img.classList.contains('relation-button__image'), true);
      assert.equal(
        img.getAttribute('href'),
        'static/gui/build/app/assets/svgs/build-relation_16.svg');
      assert.equal(img.getAttribute('width'), '16');
      assert.equal(img.getAttribute('height'), '16');
      assert.equal(img.getAttribute('transform'), 'translate(-8, -8)');
    });

    it('properly renders the create relation icon using staticURL', function() {
      // Create an instance of EnvironmentView with custom env
      var view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()},
        staticURL: 'staticpath'
      });
      view.render();
      const relationIcon = container.querySelector('.service').querySelector(
        '.relation-button');
      const img = relationIcon.querySelector('image');
      assert.equal(
        img.getAttribute('href'),
        'staticpath/static/gui/build/app/assets/svgs/build-relation_16.svg');
    });

    // Ensure the environment view loads properly
    it('must be able to render service blocks and relations',
      function() {
        // Create an instance of EnvironmentView with custom env
        var view = new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        });
        view.render();
        container.querySelectorAll('.service').length.should.equal(4);

        // Count all the real relations.
        (container.querySelectorAll('.relation').length -
           container.querySelectorAll('.pending-relation').length)
          .should.equal(2);

        // Count all the subordinate relations.
        container.querySelectorAll('.rel-group .relation.subordinate').length
          .should.equal(1);

        // Verify that the paths render 'properly' where this
        // means no NaN in the paths
        var line = container.querySelector('.relation');
        ['x1', 'y1', 'x2', 'y2'].forEach(e => {
          isNaN(parseInt(line.getAttribute(e), 10)).should.equal(false);
        });

        // Verify that the node id has been munged as expected from the
        // relation id. This is particularly important for Juju Core.
        var node = container.querySelector(
          '#' + relationUtils.generateSafeDOMId(
            'puppet:juju-info wordpress:juju-info', getParentId(view)));
        assert.isNotNull(node);
        assert.isDefined(node);
      });

    it('must be able to render subordinate and normal services',
      function(done) {
        // Create an instance of EnvironmentView with custom env
        var view = new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        });
        view.render();
        container.querySelectorAll('.service').length.should.equal(4);
        container.querySelectorAll(
          '.subordinate.service').length.should.equal(1);

        done();
      }
    );

    it('must be able to render service icons', function(done) {
      // Create an instance of EnvironmentView with custom env
      var view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      });
      view.render();
      var service = container.querySelector('.service');
      assert.equal(
        service.querySelector('.service-icon').getAttribute('href'),
        'http://1.2.3.4/v5/precise/wordpress-6/icon.svg');
      done();
    });

    it('must be able to display service icons as pending deletion', function() {
      db.services.getById('wordpress').set('deleted', true);
      // Create an instance of EnvironmentView with custom env
      var view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      });
      view.render();
      assert.equal(
        container.querySelector('.service .service-block').getAttribute(
          'stroke'), '#19b6ee');
    });

    it('must properly count subordinate relations', function() {
      var view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      });
      var addSubordinate = {
        result: [
          ['applicationInfo', 'add', {
            'subordinate': true,
            'charm-url': 'cs:precise/puppet-2',
            'name': 'puppet2'
          }],
          [
            'relationInfo',
            'add', {
              key: 'wordpress:juju-info puppet2:juju-info',
              id: 7,
              endpoints: [
                {
                  'application-name': 'puppet2',
                  relation: {
                    name: 'juju-info', role: 'requirer',
                    interface: 'juju-info', scope: 'container'
                  }
                }, {
                  'application-name': 'wordpress',
                  relation: {
                    name: 'juju-info', role: 'provider',
                    interface: 'juju-info', scope: 'container'
                  }
                }
              ]
            }
          ]
        ]
      };
      var addRelation = {
        result: [
          [
            'relationInfo',
            'add', {
              key: '',
              id: 8,
              endpoints: [
                {
                  'application-name': 'mediawiki',
                  relation: {
                    name: 'juju-info', role: 'provider',
                    interface: 'juju-info', scope: 'container'
                  }
                }, {
                  'application-name': 'puppet',
                  relation: {
                    name: 'juju-info', role: 'requirer',
                    interface: 'juju-info', scope: 'container'
                  }
                }
              ]
            }
          ]
        ]
      };

      view.render();

      var relationModule = view.topo.modules.RelationModule;

      function validateRelationCount(serviceNode, module, count) {
        var service = d3.select(serviceNode).datum();
        return module.subordinateRelationsForService(service)
          .length === count;
      }

      container.querySelectorAll('.subordinate.service').forEach(service => {
        validateRelationCount(service, relationModule, 1).should.equal(true);
      });

      db.onDelta({detail: { data: addSubordinate }});
      view.update();

      container.querySelectorAll('.subordinate.service').forEach(service => {
        validateRelationCount(service, relationModule, 1).should.equal(true);
      });

      db.onDelta({detail: { data: addRelation }});
      view.update();

      validateRelationCount(container.querySelector('.subordinate.service'),
        relationModule, 2).should.equal(true);
    });

    it('must not duplicate nodes when services are added', function() {
      var view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      });
      var tmp_data = {
        result: [
          ['service', 'add', {
            'subordinate': true,
            'charm': 'cs:precise/puppet-2',
            'id': 'puppet2'
          }],
          ['service', 'add', {
            'charm': 'cs:precise/mysql-26',
            'id': 'mysql2'
          }],
          ['unit', 'add', {
            'machine': 0,
            'agent-state': 'started',
            'public-address': '192.168.122.222',
            'id': 'mysql2/0'
          }]
        ],
        op: 'delta'
      };
      view.render();

      db.onDelta({detail: { data: tmp_data }});
      view.render();

      container.querySelectorAll('.service').forEach(serviceNode => {
        // There should not be any duplicate nodes within the service.
        serviceNode.querySelectorAll('.service-icon').length.should.equal(1);
        serviceNode.querySelectorAll('.service-block').length.should.equal(1);
      });
    });

    it('must resize the service health graph properly when units are added',
      function() {
        new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        });
        var tmp_data = {
          result: [
            ['machine', 'add', {
              'agent-state': 'running',
              'instance-state': 'running',
              'id': 1,
              'instance-id': 'local',
              'dns-name': 'localhost'
            }],
            ['unit', 'add', {
              'machine': 1,
              'agent-state': 'started',
              'public-address': '192.168.122.114',
              'id': 'wordpress/1'
            }]
          ],
          op: 'delta'
        };

        function chartSizedProperly(serviceNode) {
          var node = d3.select(serviceNode);
          var outerRadius = node.attr('data-outerradius');
          var maskWidth = node.select('.service-health-mask')
            .attr('width');
          return parseFloat(outerRadius) === parseFloat(maskWidth) / 2.05;
        }

        container.querySelectorAll('.service').forEach(service => {
          chartSizedProperly(service).should.equal(true);
        });

        db.onDelta({detail: { data: tmp_data }});

        container.querySelectorAll('.service').forEach(service => {
          chartSizedProperly(service).should.equal(true);
        });
      }
    );

    it('must recalculate relation endpoints when services are resized',
      function() {
        new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        }).render();
        var tmp_data = {
          result: [
            ['machine', 'add', {
              'agent-state': 'running',
              'instance-state': 'running',
              'id': 1,
              'instance-id': 'local',
              'dns-name': 'localhost'
            }],
            ['machine', 'add', {
              'agent-state': 'running',
              'instance-state': 'running',
              'id': 2,
              'instance-id': 'local',
              'dns-name': 'localhost'
            }],
            ['unit', 'add', {
              'machine': 1,
              'agent-state': 'started',
              'public-address': '192.168.122.114',
              'id': 'wordpress/1'
            }],
            ['unit', 'add', {
              'machine': 2,
              'agent-state': 'started',
              'public-address': '192.168.122.114',
              'id': 'wordpress/2'
            }]
          ],
          op: 'delta'
        };

        function floor(o) {
          return Math.floor(parseFloat(o.toString()));
        }
        function cmp(a, b) {
          return floor(a) === floor(b);
        }
        // Ensure that line endpoints match with calculated endpoints.
        function endpointsCalculatedProperly(relation) {
          var node = d3.select(relation);
          var line = node.select('line');
          var boxpair = node.datum();
          var connectors = boxpair.source
            .getConnectorPair(boxpair.target);

          return cmp(line.attr('x1'), connectors[0][0]) &&
                   cmp(line.attr('y1'), connectors[0][1]) &&
                   cmp(line.attr('x2'), connectors[1][0]) &&
                   cmp(line.attr('y2'), connectors[1][1]);
        }

        // Ensure that endpoints match for all services before any
        // service is resized.
        container.querySelectorAll('.rel-group').forEach(relationGroup => {
          endpointsCalculatedProperly(relationGroup)
            .should.equal(true);
        });

        // Resize the wordpress service.
        db.onDelta({detail: { data: tmp_data }});

        // Ensure that endpoints still match for all services, now that
        // one service has been resized.  This is the real test here.
        container.querySelectorAll('.rel-group').forEach(relationGroup => {
          endpointsCalculatedProperly(relationGroup)
            .should.equal(true);
        });
      }
    );

    it('must be able to place new services properly', function() {
      var view = new EnvironmentView({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore,
            state: {changeState: sinon.stub()}
          }),
          tmp_data = {
            result: [
              [
                'applicationInfo',
                'add', {
                  subordinate: true,
                  'charm-url': 'cs:precise/puppet-2',
                  name: 'puppet2'
                }
              ], [
                'applicationInfo',
                'add', {
                  'charm-url': 'cs:precise/mysql-26',
                  name: 'mysql2'
                }
              ], [
                'unitInfo',
                'add', {
                  'machine-id': 0,
                  'agent-status': {current: '', message: '', data: {}},
                  'workload-status': {current: '', message: '', data: {}},
                  'public-address': '192.168.122.222',
                  name: 'mysql2/0'
                }
              ]
            ]
          },
          properTransform = /translate\(\d+\.?\d*[, ]\d+\.?\d*\)/;
      view.render();

      container.querySelectorAll('.service').forEach(serviceNode => {
        // Ensure that all initial service nodes' transform attributes are
        // properly formated (i.e.: no NaN values).
        properTransform.test(serviceNode.getAttribute('transform'))
          .should.equal(true);
      });

      db.onDelta({detail: { data: tmp_data }});
      view.render();

      container.querySelectorAll('.service').forEach(serviceNode => {
        // Ensure that all new service nodes' transform attributes are properly
        // formatted as well (i.e.: no NaN values).
        properTransform.test(serviceNode.getAttribute('transform'))
          .should.equal(true);

        // There should not be any duplicate nodes within the service.
        serviceNode.querySelectorAll('.service-block').length.should.equal(1);
        serviceNode.querySelectorAll('.service-icon').length.should.equal(1);
      });
    });

    it('must not stack new services from delta', function() {
      var tmp_data = {
        result: [
          [
            'applicationInfo',
            'add', {
              subordinate: false,
              'charm-url': 'cs:precise/wordpress-6',
              name: 'wordpressa'
            }
          ]
        ]
      };
      db.reset();
      view.createTopology();
      // For testing position isn't testable with transitions on.
      view.topo.modules.ServiceModule.useTransitions = false;
      view.render();

      db.onDelta({detail: { data: tmp_data }});
      view.update();
      tmp_data.result[0][2].name = 'wordpressb';
      db.onDelta({detail: { data: tmp_data }});
      view.update();

      assert.notDeepEqual(
        view.topo.service_boxes.wordpressa.center,
        view.topo.service_boxes.wordpressb.center);
    });

    it('must be able to use position annotations', function() {
      var tmp_data = {
        result: [
          [
            'annotationInfo',
            'change', {
              'tag': 'application-wordpress',
              'annotations': {
                'gui-x': 374.1,
                'gui-y': 211.2
              }
            }
          ]
        ]
      };
      // IE uses a space delimiter, not a comma.
      var properTransform = /translate\((\d+\.?\d*)[, ](\d+\.?\d*)\)/;
      var node, match;
      view.createTopology();
      // For testing position isn't testable with transitions on.
      view.topo.modules.ServiceModule.useTransitions = false;
      view.render();

      // Test values from initial load.
      node = view.topo.modules.ServiceModule.getServiceNode('wordpress');
      match = node.getAttribute('transform').match(properTransform);
      match[1].should.eql('100');
      match[2].should.eql('200');

      db.onDelta({detail: { data: tmp_data }});
      view.update();

      // On annotation change  position should be updated.
      match = node.getAttribute('transform').match(properTransform);
      match[1].should.eql('374.1');
      match[2].should.eql('211.2');

      // Position attributes should match annotations.
      var service = view.topo.service_boxes.wordpress;
      assert.equal(service.x, service.model.get('annotations')['gui-x']);
      assert.equal(service.y, service.model.get('annotations')['gui-y']);

      tmp_data = {
        result: [
          [
            'applicationInfo',
            'add',
            {
              subordinate: true,
              'charm-url': 'cs:precise/wordpress-6',
              name: 'wordpressa'
            }
          ]
        ]
      };
      db.onDelta({detail: { data: tmp_data }});
      view.update();
    });

    it('must be able to render subordinate relation indicators',
      function() {
        new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        }).render();
        var rel_block = container.querySelector('.sub-rel-count');

        // Get the contents of the subordinate relation count; YUI cannot
        // get this directly as the node is not an HTMLElement, so use
        // native SVG methods.
        rel_block.firstChild.nodeValue.should.equal('1');
      }
    );

    // Ensure that sizes are computed properly
    it('must be able to compute rect sizes based on the svg and' +
       ' viewport size',
    function() {
      var view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      }).render();
      // Attach the view to the DOM so that sizes get set properly
      // from the viewport (only available from DOM).
      view.rendered();

      var svg = document.querySelector('.the-canvas');

      parseInt(svg.querySelector('g').getAttribute('height'), 10)
        .should.equal(parseInt(
          window.getComputedStyle(svg).getPropertyValue('height'), 10));
      parseInt(svg.querySelector('g').getAttribute('width'), 10)
        .should.equal(
          parseInt(window.getComputedStyle(svg).getPropertyValue('width'), 10));
    }
    );

    // Ensure that sizes are computed properly
    it('must be able to compute sizes by the viewport with a minimum',
      function() {
        // The height of a navbar is used in calculating the viewport size,
        // so add a temporary one to the DOM
        const navbar = document.createElement('div');
        navbar.classList.add('header-banner');
        navbar.style.height = '70px';
        document.body.appendChild(navbar);
        const viewport = document.createElement('div');
        viewport.setAttribute('id', 'viewport');
        viewport.style.width = '800px';
        document.body.appendChild(viewport);
        var view = new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        }).render();
        // Attach the view to the DOM so that sizes get set properly
        // from the viewport (only available from DOM).
        view.rendered();
        var svg = container.querySelector('.the-canvas'),
            canvas = container.querySelector('.topology');
        // We have to hide the canvas so it does not affect our calculations.
        canvas.style.display = 'none';
        parseInt(svg.getAttribute('height'), 10)
          .should.be.above(199);
        // Destroy the navbar
        navbar.remove(true);
        viewport.remove(true);
      }
    );

    function assertClassPresent(cssClass) {
      var vis = view.topo.vis;
      var relations = vis.selectAll('.rel-group');
      var relation = relations.filter(function(d) {
        return d.id === 'mysql:db wordpress:db';
      });
      assert.equal(relation.classed(cssClass), true,
        'relation does not have the ' + cssClass + ' class');
      var services = vis.selectAll('.service');
      var service = services.filter(function(d) {
        return d.id === 'mysql';
      });
      assert.equal(service.classed(cssClass), true,
        'service does not have the ' + cssClass + ' class');
    }

    it('should show services and relations', function(done) {
      view.render();
      const handler = () => {
        document.removeEventListener('topo.show', handler);
        assertClassPresent('show');
        done();
      };
      document.addEventListener('topo.show', handler);
      document.dispatchEvent(new CustomEvent('topo.show', {
        detail: [{serviceNames: ['mysql']}]
      }));
    });

    // XXX: There seems to be some complicated mapping to create for the
    // endpointsController but it not obvious what it should be.
    xit('must be able to add a relation from the service menu',
      function() {
        var newView = new EnvironmentView({
          container: container,
          db: db,
          endpointsController: {
            endpointsMap: {
              'mediawiki': {requires: [], provides: []},
              'mysql': {requires: [], provides: []},
              'puppet': {requires: [], provides: []},
              'wordpress': {requires: [], provides: []}
            },
            get: sinon.stub().withArgs('db').returns(db)
          },
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        }).render();
        var serviceNode = container.querySelector('.service'),
            add_rel = container.querySelector('.relation-button__link');
        var service = d3.select(serviceNode).datum();
        var endpoints = {},
            serviceName = serviceNode.getAttribute('data-name'),
            nextServiceName = serviceNode.nextSibling.getAttribute(
              'data-name');
        endpoints[nextServiceName] = [
          [{
            service: serviceName,
            name: 'relName',
            type: 'relType'
          }, {
            service: nextServiceName,
            name: 'relName',
            type: 'relType'
          }]];
        // Add a mock charm for the service.
        var charm = { id: service.charm, loaded: false };
        var charm2 = { id: 'cs:precise/mediawiki-3', loaded: false };
        db.charms.add(charm);
        db.charms.add(charm2);
        charm = db.charms.getById(service.charm);
        charm.loaded = true;
        // Mock endpoints
        var existing = models.getEndpoints;
        models.getEndpoints = function() {
          return endpoints;
        };

        // Toggle the service menu for the Add Relation button.
        var module = newView.topo.modules.RelationModule;
        var sm = newView.topo.modules.ServiceModule;

        sm.showServiceDetails(service, {
          fire: function() {},
          get: sinon.stub().withArgs('state').returns(
            {changeState: sinon.stub()})
        });
        // Mock an event object so that d3.mouse does not throw a NPE.
        d3.event = {};
        add_rel.dispatchEvent(click);
        container.querySelectorAll('.selectable-service')
          .length
          .should.equal(2);
        container.querySelectorAll('.dragline')
          .length
          .should.equal(1);

        // Start the process of adding a relation.
        module.ambiguousAddRelationCheck(
          d3.select(serviceNode.nextSibling).datum(),
          module,
          serviceNode.nextSibling);
        container.querySelectorAll('.selectable-service').length
          .should.equal(0);
        // The database is initialized with three relations in beforeEach.
        assert.equal(4, db.relations.size());
        // restore original getEndpoints function
        models.getEndpoints = existing;
        newView.destructor();
      });

    it('must be able to remove a relation between services',
      function(done) {
        var oldRemove = env.remove_relation;
        let remove_called = false;
        env.remove_relation = function() {
          remove_called = true;
          env.remove_relation = oldRemove;
          done();
        };
        var view = new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        }).render();

        var relation = container.querySelector(
          '#' +
           relationUtils.generateSafeDOMId(
             'mysql:db wordpress:db', getParentId(view)) +
           ' .rel-indicator');
        relation.dispatchEvent(click);
        const menu = container.querySelector('#relation-menu');
        menu.querySelector('.relation-remove').dispatchEvent(click);
        assert.isTrue(remove_called);
      });

    it('builds a menu of relations in a collection', function() {
      db.onDelta({detail: {data: additionalRelations}});
      view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      }).render();
      var module = view.topo.modules.RelationModule;

      // Single relation
      var relation = container.querySelector(
            '#' + relationUtils.generateSafeDOMId('mysql:db wordpress:db',
              getParentId(view)) +
          ' .rel-indicator'),
          menu;
      relation.dispatchEvent(click);
      menu = container.querySelector('#relation-menu');

      assert.equal(menu.querySelectorAll('.relation-container').length, 1);
      assert.equal(
        menu.querySelector('.relation-container').getAttribute(
          'data-relationid'),
        'mysql:db wordpress:db');

      // Assert that relation module is storing the menu state for rerendering.
      assert.equal(module.relationMenuActive, true);
      assert.equal(module.relationMenuRelation.id,
        'mysql:db wordpress:db');

      // Multiple relations
      relation = container.querySelector(
        '#' +
          relationUtils.generateSafeDOMId('mysql:db mediawiki:db',
            getParentId(view)) +
          ' .rel-indicator');
      relation.dispatchEvent(click);
      menu = container.querySelector('#relation-menu');

      var relContainers = menu.querySelectorAll('.relation-container');
      assert.equal(relContainers.length, 2);
      assert.equal(
        relContainers.item(0).getAttribute('data-relationid'),
        'mysql:db mediawiki:db');
      assert.equal(
        relContainers.item(1).getAttribute('data-relationid'),
        'mysql:db-slave mediawiki:db-slave');

      // Errors are shown.
      var unit = db.services.getById('mysql').get('units').item(0);
      unit.agent_state = 'error';
      unit.agent_state_data = {
        hook: 'db-relation'
      };
      relation.dispatchEvent(click);
      menu = container.querySelector('#relation-menu');
      assert.equal(menu.querySelectorAll('.endpoint.error').length, 1);
      assert.equal(menu.querySelectorAll(
        '.relation-container.error').length, 1);
      assert.equal(menu.querySelectorAll(
        '.relation-container.running').length, 1);
    });

    it('shows relation status with an indicator', function() {
      view.render();
      var reduceData = function() {
        return view.topo.vis.selectAll('.rel-indicator image')
          .data().map(function(datum) {
            return datum.aggregatedStatus;
          });
      };
      var reduceImages = function() {
        return view.topo.vis.selectAll('.rel-indicator image')[0]
          .map(function(image) {
            return d3.select(image).attr('href');
          });
      };
      assert.deepEqual(reduceData(), ['subordinate', 'healthy']);
      assert.deepEqual(reduceImages(), [
        'static/gui/build/app/assets/svgs/relation-icon-subordinate.svg',
        'static/gui/build/app/assets/svgs/relation-icon-healthy.svg'
      ]);

      var unit = db.services.getById('mysql').get('units').item(0);
      unit.agent_state = 'error';
      unit.agent_state_data = {
        hook: 'db-relation'
      };
      view.update();
      assert.deepEqual(reduceData(), ['subordinate', 'error']);
      assert.deepEqual(reduceImages(), [
        'static/gui/build/app/assets/svgs/relation-icon-subordinate.svg',
        'static/gui/build/app/assets/svgs/relation-icon-error.svg'
      ]);
    });

    it('uses staticURL config for the relation status assets', function() {
      view.staticURL = 'static';
      view.render();
      var reduceImages = function() {
        return view.topo.vis.selectAll('.rel-indicator image')[0]
          .map(function(image) {
            return d3.select(image).attr('href');
          });
      };
      assert.deepEqual(reduceImages(), [
        'static/static/gui/build/app/assets/svgs/relation-icon-subordinate.svg',
        'static/static/gui/build/app/assets/svgs/relation-icon-healthy.svg'
      ]);

      var unit = db.services.getById('mysql').get('units').item(0);
      unit.agent_state = 'error';
      unit.agent_state_data = {
        hook: 'db-relation'
      };
      view.update();
      assert.deepEqual(reduceImages(), [
        'static/static/gui/build/app/assets/svgs/relation-icon-subordinate.svg',
        'static/static/gui/build/app/assets/svgs/relation-icon-error.svg'
      ]);
    });

    it('allows clicking on a relation to inspect it', function() {
      db.onDelta({detail: {data: additionalRelations}});
      const state = {
        changeState: sinon.stub()
      };
      view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: state
      }).render();
      // This stops the simulate() call later on from causing a 'script error'
      container.insertAdjacentHTML('beforeend',
        '<div id="bws-sidebar"><div class="bws-content"></div></div>');
      // Single relation.
      var relation = container.querySelector(
            '#' + relationUtils.generateSafeDOMId('mysql:db wordpress:db',
              getParentId(view)) +
          ' .rel-indicator'),
          menu;

      relation.dispatchEvent(click);
      menu = document.querySelector('#relation-menu .menu');

      // Click the first endpoint.
      var endpoints = menu.querySelectorAll('.inspect-relation'),
          endpoint = endpoints.item(0),
          endpointName = endpoint.innerText.split(':')[0].trim();
      endpoint.dispatchEvent(click);
      assert.equal(state.changeState.callCount, 1);
      assert.deepEqual(state.changeState.args[0][0], {
        gui: {
          inspector: {id: endpointName}
        }
      });
    });

    it('must not remove a deployed subordinate relation between services',
      function() {
        view = new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        }).render();
        assert.equal(db.notifications.size(), 0);

        // Get a subordinate relation.
        var relation = container.querySelector(
              '#' + relationUtils.generateSafeDOMId(
                'puppet:juju-info wordpress:juju-info',
                getParentId(view)) +
              ' .rel-indicator'),
            menu;

        relation.dispatchEvent(click);
        menu = container.querySelector('#relation-menu');
        menu.querySelector('.relation-remove').click();
        assert.equal(db.notifications.size(), 1);
      });

    it('should remove a pending subordinate relation between services',
      function() {
        view = new EnvironmentView({
          container: container,
          db: db,
          env: env,
          charmstore: fakeStore,
          state: {changeState: sinon.stub()}
        }).render();
        db.relations.item(1).set('pending', true);

        // Get a subordinate relation.
        const relation = container.querySelector(
          '#' + relationUtils.generateSafeDOMId(
            'puppet:juju-info wordpress:juju-info',
            getParentId(view)) +
              ' .rel-indicator');
        relation.dispatchEvent(click);
        const menu = container.querySelector('#relation-menu');
        menu.querySelector('.relation-remove').dispatchEvent(click);
        assert.equal(db.notifications.size(), 0);
      });

    it('should stop creating a relation if the background is clicked',
      function() {
        var db = new models.Database(),
            endpointsMap = {'service-1': {requires: [], provides: []}};
        var fauxController = new Y.Base();
        fauxController.endpointsMap = endpointsMap;
        fauxController.db = db;
        var view = new EnvironmentView(
          { container: container,
            db: db,
            endpointsController: fauxController,
            env: env,
            charmstore: fakeStore,
            state: {changeState: sinon.stub()}
          });
        var service = new models.Service({
          id: 'service-1',
          charm: 'precise/mysql-1'
        });

        db.services.add([service]);
        view.render();

        // If the user has clicked on the "Add Relation" menu item...
        var module = view.topo.modules.RelationModule;
        var sm = view.topo.modules.ServiceModule;
        var topo = module.topo;
        module.startRelation(service);
        assert.isTrue(topo.buildingRelation);
        // ...clicking on the background causes the relation drag to stop.
        sm.backgroundClicked();
        assert.isFalse(topo.buildingRelation);
        view.destructor();
        db.destroy();
        fauxController.destroy();
      });

    it('stores relations in collections', function() {
      db.onDelta({detail: {data: additionalRelations}});
      var view = new EnvironmentView({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      }).render();
      var module = view.topo.modules.RelationModule;
      // RelationCollections have an aggregatedStatus.
      assert.equal(module.relations[0].aggregatedStatus, 'subordinate');
      // RelationCollections can store more than one relation.
      assert.equal(module.relations[2].relations.length, 2);
      // Only one line is drawn (that is, there are four container relations,
      // but only three lines on the canvas).
      assert.equal(view.topo.vis.selectAll('.relation').size(),
        module.relations.length);
      assert.equal(module.relations.length, 3);
      assert.equal(db.relations.filter(function(relation) {
        return relation.get('scope') !== 'container';
      }).length, 4);
    });

    it('propagates the endpointsController to the topology', function() {
      var view = new EnvironmentView({
        container: container,
        db: db,
        endpointsController: 'hidy ho',
        env: env,
        charmstore: fakeStore,
        state: {changeState: sinon.stub()}
      }).render();
      var endpointsController = view.topo.endpointsController;
      assert.equal('hidy ho', endpointsController);
      view.destructor();
    });

    describe('onboarding integration with the environment', function() {
      it('shows/hides the integrated button when a service is added',
        function() {
          db = new models.Database();
          view.db = db;
          view.render().rendered();
          var includedPlus = view.topo.vis.select('.included-plus');
          var helpText = container.querySelector('.environment-help');
          assert.equal(false, includedPlus.classed('show'));
          assert.equal(false, helpText.classList.contains('shrink'));

          var service = new models.Service({
            id: 'service-1',
            charm: 'precise/mysql-1'
          });
          db.services.add([service]);

          assert.equal(true, includedPlus.classed('show'));
          assert.equal(true, helpText.classList.contains('shrink'));
          view.destructor();
        }
      );
    });
  });

  describe('view model support infrastructure', function() {
    var models, module, service;

    beforeAll(function(done) {
      YUI(GlobalConfig).use(
        ['juju-models'],
        function(Y) {
          models = Y.namespace('juju.models');
          window.yui = Y;
          done();
        });
    });

    beforeEach(function() {
      service = new models.Service({
        id: 'mediawiki',
        exposed: true
      });
      module = {
        topology: {
          serviceForBox: function() {return service;}
        }};
    });

    // XXX: current can't be tested as it modifies an internal module
    // variable (snapToPoles).
    xit('must be able to get us nearest connectors when snapping to poles',
      function() {

        var b1 = environmentUtils.BoundingBox(module, service),
            b2 = environmentUtils.BoundingBox(module, service);

        // raw property access
        b1.x = 0;
        b1.y = 0;
        b1.w = 100;
        b1.h = 200;

        // Use pos to set b2
        b2.pos = {x: 200, y: 300, w: 100, h: 200};

        b1.xy.should.eql([0, 0]);
        b2.wh.should.eql([100, 200]);

        environmentUtils.snapToPoles = true;

        b1.getNearestConnector([0, 0]);

        b1.getNearestConnector(b2).should
          .eql(b1.connectors.bottom);

        b2.getNearestConnector(b1).should
          .eql(b2.connectors.top);

        b1.getConnectorPair(b2).should.eql([
          b1.connectors.bottom,
          b2.connectors.top]);
      });

    it('must be able to get us nearest connectors when centering',
      function() {

        var b1 = environmentUtils.BoundingBox(module, service),
            b2 = environmentUtils.BoundingBox(module, service);

        // raw property access
        b1.x = 0; b1.y = 0;
        b1.w = 100; b1.h = 200;

        // Use pos to set b2
        b2.pos = {x: 200, y: 300, w: 100, h: 200};

        b1.xy.should.eql([0, 0]);
        b2.wh.should.eql([100, 200]);

        environmentUtils.snapToPoles = false;

        b1.getNearestConnector(b2).should
          .eql(b1.connectors.center);

        b2.getNearestConnector(b1).should
          .eql(b2.connectors.center);
      });

    it('must be able to tell if a point is inside a box', function() {
      var b = environmentUtils.BoundingBox(module, service);
      b.pos = {x: 100, y: 100, w: 50, h: 50};

      b.containsPoint([125, 125]).should.equal(true);
      b.containsPoint([25, 25]).should.equal(false);
    });

    it('must be able to save and restore old position information',
      function() {
        var b1 = environmentUtils.BoundingBox(module, service),
            b2 = environmentUtils.BoundingBox(module, service);

        // raw property access
        b1.x = 0; b1.y = 0;
        b1.w = 100; b1.h = 200;

        // Use pos to set b2
        b2.pos = {x: 200, y: 300, w: 100, h: 200};

        // Update using property.
        b1.x = 100;
        b1.x.should.equal(100);
        b1.px.should.equal(0);

        // Update using position.
        b2.pos = {x: 300};
        b2.x.should.equal(300);
        b2.px.should.equal(200);

      });

    it('must be able to access model attributes', function() {
      var b1 = new environmentUtils.BoundingBox(module, service);

      b1.modelId.should.equal('service-mediawiki');

      // Properties of the model have mapped to the box.
      b1.id.should.equal('mediawiki');
      b1.exposed.should.equal(true);
    });

    it('must be able to update position data and not touch model data',
      function() {
        var b1 = environmentUtils.BoundingBox(module, service);
        b1.x = 0; b1.y = 0;
        b1.w = 100; b1.h = 200;
        b1.id.should.equal('mediawiki');

        // X/Y updated, other keys ignored
        b1.pos = {x: 100, y: 100, id: 'blubber'};
        b1.x.should.equal(100);
        b1.id.should.equal('mediawiki');
      });

    it('must be able to map from sequence of models to boundingboxes',
      function() {
        var services = new models.ServiceList();
        services.add([{id: 'mysql'},
          {id: 'haproxy'},
          {id: 'memcache'},
          {id: 'wordpress'}]);

        services.size().should.equal(4);
        var boxes = environmentUtils.toBoundingBoxes(module, services);
        boxes.mysql.id.should.equal('mysql');
        boxes.wordpress.id.should.equal('wordpress');
      });

    it('must be able to update boxes with new model data',
      function() {
        var services = new models.ServiceList();
        services.add([{id: 'mysql', exposed: false},
          {id: 'haproxy'},
          {id: 'memcache'},
          {id: 'wordpress'}]);

        services.size().should.equal(4);
        var boxes = environmentUtils.toBoundingBoxes(module, services);
        var mysql = services.getById('mysql');

        boxes.mysql.exposed.should.equal(false);
        mysql.set('exposed', true);

        // The third argument here implies an update.
        environmentUtils.toBoundingBoxes(module, services, boxes);
        boxes.mysql.exposed.should.equal(true);
      });

    it('must cull removed services from the existing list', function() {
      var services = new models.ServiceList();
      services.add([{id: 'mysql', exposed: false},
        {id: 'memcache'},
        {id: 'wordpress'}]);
      var existing = {
        'mysql': {},
        'haproxy': {}, // This entry is stale and will be removed.
        'memcache': {},
        'wordpress': {}};

      var boxes = environmentUtils.toBoundingBoxes(module, services, existing);
      // The haproxy is removed from the results since it is no longer in
      // the services list.
      assert.equal(boxes.haproxy, undefined);
    });

    it('retrieves local charms icons from the Juju env', function() {
      var fakeEnv = {
        getLocalCharmIcon: sinon.stub().returns('local charm icon')
      };
      var services = new models.ServiceList();
      services.add([
        {
          id: 'local:ceph-1',
          charm: 'local:ceph-1'
        },
        {
          id: 'cs:mysql-1',
          charm: 'cs:mysql-1'
        }
      ]);
      var existing = {
        'local:ceph-1': {
          id: 'local:ceph-1',
          charm: 'local:ceph-1'
        },
        'cs:mysql-1': {
          id: 'cs:mysql-1',
          charm: 'cs:mysql-1'
        }
      };
      var boxes = environmentUtils.toBoundingBoxes(module, services, existing, fakeEnv);
      assert.equal(boxes['local:ceph-1'].icon, 'local charm icon');

      // The mysql charm has an icon from on the server.
      assert.equal(boxes['cs:mysql-1'].icon, 'v5/mysql-1/icon.svg');
    });
  });
})();
