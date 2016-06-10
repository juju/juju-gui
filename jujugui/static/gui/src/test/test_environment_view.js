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

(function() {

  describe('juju environment view', function() {
    var view, views, models, Y, container, d3, db, conn,
        juju, charm, ecs, env, testUtils, fakeStore;

    var environment_delta = {
      'result': [
        ['serviceInfo', 'add', {
          'CharmURL': 'cs:precise/wordpress-6',
          'Name': 'wordpress',
          'exposed': false,
          'Annotations': {'gui-x': 100, 'gui-y': 200}
        }],
        ['serviceInfo', 'add', {
          'CharmURL': 'cs:precise/mediawiki-3',
          'Name': 'mediawiki',
          'exposed': false
        }],
        ['serviceInfo', 'add', {
          'CharmURL': 'cs:precise/mysql-26',
          'Name': 'mysql'
        }],
        ['serviceInfo', 'add', {
          'Subordinate': true,
          'CharmURL': 'cs:precise/puppet-2',
          'Name': 'puppet'
        }], [
          'relationInfo',
          'add', {
            Key: 'wordpress:loadbalancer',
            Id: 0,
            Endpoints: [
              {
                ServiceName: 'wordpress',
                Relation: {
                  Name: 'loadbalancer',
                  Role: 'peer',
                  Interface: 'reversenginx',
                  Scope: 'global'
                }
              }
            ]
          }
        ], [
          'relationInfo',
          'add', {
            Key: 'puppet:juju-info wordpress:juju-info',
            Id: 1,
            Endpoints: [
              {
                ServiceName: 'puppet',
                Relation: {
                  Name: 'juju-info',
                  Role: 'requirer',
                  Interface: 'juju-info',
                  Scope: 'container'
                }
              },
              {
                ServiceName: 'wordpress',
                Relation: {
                  Name: 'juju-info',
                  Role: 'provider',
                  Interface: 'juju-info',
                  Scope: 'container'
                }
              }
            ]
          }
        ], [
          'relationInfo',
          'add', {
            Key: 'mysql:db wordpress:db',
            Id: 2,
            Endpoints: [
              {
                ServiceName: 'mysql',
                Relation: {
                  Name: 'db',
                  Role: 'server',
                  Interface: 'mysql',
                  Scope: 'global'
                }
              }, {
                ServiceName: 'wordpress',
                Relation: {
                  Name: 'db',
                  Role: 'client',
                  Interface: 'mysql',
                  Scope: 'global'
                }
              }
            ]
          }
        ],

        ['machineInfo', 'add', {
          'agent-state': 'running',
          'instance-state': 'running',
          'id': 0,
          'instance-id': 'local',
          'dns-name': 'localhost'
        }],
        ['unitInfo', 'add', {
          'MachineId': 0,
          'Status': 'started',
          'PublicAddress': '192.168.122.113',
          'Name': 'wordpress/0'
        }],
        ['unitInfo', 'add', {
          'MachineId': 0,
          'Status': 'started',
          'PublicAddress': '192.168.122.113',
          'Name': 'mediawiki/0'
        }],
        ['unitInfo', 'add', {
          'MachineId': 0,
          'Status': 'started',
          'PublicAddress': '192.168.122.222',
          'Name': 'mysql/0'
        }], [
          'annotationInfo',
          'change', {
            Tag: 'service-wordpress',
            Annotations: {
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
          Key: 'mysql:db mediawiki:db',
          Id: 5,
          Endpoints: [
            {
              ServiceName: 'mysql',
              Relation: {
                Name: 'db',
                Role: 'server',
                Interface: 'mysql',
                Scope: 'global'
              }
            }, {
              ServiceName: 'mediawiki',
              Relation: {
                Name: 'db',
                Role: 'client',
                Interface: 'mysql',
                Scope: 'global'
              }
            }
          ]
        }
      ], [
        'relationInfo',
        'add', {
          Key: 'mysql:db-slave mediawiki:db-slave',
          Id: 6,
          Endpoints: [
            {
              ServiceName: 'mysql',
              Relation: {
                Name: 'db-slave',
                Role: 'server',
                Interface: 'mysql',
                Scope: 'global'
              }
            }, {
              ServiceName: 'mediawiki',
              Relation: {
                Name: 'db-slave',
                Role: 'client',
                Interface: 'mysql',
                Scope: 'global'
              }
            }
          ]
        }
      ]
    ]};

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-views', 'juju-tests-utils', 'charmstore-api',
        'd3', 'node-event-simulate', 'juju-gui',
        'landscape', 'dump', 'juju-view-utils',
        'juju-charm-models', 'environment-change-set'
      ], function(Y) {
        testUtils = Y.namespace('juju-tests.utils');
        views = Y.namespace('juju.views');
        models = Y.namespace('juju.models');
        d3 = Y.namespace('d3');
        conn = new testUtils.SocketStub();
        juju = Y.namespace('juju');
        db = new models.Database();
        ecs = new juju.EnvironmentChangeSet({db: db});
        env = new juju.environments.GoEnvironment({conn: conn, ecs: ecs});
        env.connect();
        conn.open();
        fakeStore = new window.jujulib.charmstore('http://1.2.3.4/');
        done();
      });
    });

    after(function(done)  {
      env.close();
      env.destroy();
      done();
    });

    beforeEach(function() {
      container = testUtils.makeContainer(this, 'content');
      // Use a clone to avoid any mutation
      // to the input set (as happens with processed
      // annotations, its a direct reference).
      db.onDelta({data: Y.clone(environment_delta)});
      var charmData = testUtils.loadFixture('data/mysql-api-response.json',
                                            true);
      charm = new models.Charm(charmData.charm);
      db.charms.add(charm);
      view = new views.environment({
        container: container,
        db: db,
        env: {
          update_annotations: function() {},
          get: function() {}
        },
        nsRouter: {
          url: function() { return; }
        },
        getModelURL: function() {},
        charmstore: fakeStore
      });
    });

    afterEach(function() {
      db.reset();
      db.destroy();
      charm.destroy();
      env._txn_callbacks = {};
      conn.messages = [];
      if (!view.get('destroyed')) {
        view.destroy({remove: true});
      }
    });

    function getParentId(view) {
      return view.topo ? view.topo._yuid : '';
    }

    it('should display help text when canvas is empty', function() {
      // Use a db w/o the delta loaded
      var db = new models.Database();
      view.set('db', db);
      view.render().rendered();

      // Verify we have help text.
      var help = Y.one('.environment-help');
      assert.isFalse(help.hasClass('shrink'));
    });

    it('should not display help text when canvas is populated', function() {
      view.render().rendered();

      // Verify we do not have help text.
      var help = Y.one('.environment-help');
      assert.strictEqual(help.getStyle('display'), 'none');
    });

    it('should handle clicking the plus', function(done) {
      // Use a db w/o the delta loaded
      var changeStateCalled;
      var db = new models.Database();
      view.set('db', db);
      view.render().rendered();

      view.on('*:changeState', function(e) {
        changeStateCalled = e.details[0];
        done();
      });

      var plus = Y.one('.environment-help .plus-service');
      plus.simulate('click');
      assert.deepEqual(changeStateCalled, {
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'mid-point'
          }
        }
      });
    });

    it('must handle the window resize event', function(done) {
      var beforeResizeEventFired = false;
      view.render();

      Y.once('beforePageSizeRecalculation', function() {
        // This event must be fired.
        beforeResizeEventFired = true;
      });
      Y.once('afterPageSizeRecalculation', function() {
        // This event must be fired.
        assert.isTrue(beforeResizeEventFired);
        done();
      });
      Y.one('window').simulate('resize');
    });

    it('must render services blocks correctly',
        function() {
          // Create an instance of EnvironmentView with custom env
          var view = new views.environment({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore
          });
          view.render();
          var serviceBlock = container.one('.service').one('.service-block');
          serviceBlock.getAttribute('r').should.equal('90');
          serviceBlock.getAttribute('cy').should.equal('95');
          serviceBlock.getAttribute('cx').should.equal('95');
        });

    it('properly renders the create relation icon', function() {
      // Create an instance of EnvironmentView with custom env
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
      });
      view.render();
      var relationIcon = container.one('.service').one('.relation-button');
      var line = relationIcon.one('line');
      var circles = relationIcon.all('circle');
      var img = relationIcon.one('image');

      assert.equal(relationIcon._node.classList[0], 'relation-button');
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

      assert.equal(circles.item(1)._node.classList[0], 'relation-button__link');
      assert.equal(circles.item(1).getAttribute('cx'), '0');
      assert.equal(circles.item(1).getAttribute('cy'), '0');
      assert.equal(circles.item(1).getAttribute('r'), '15');
      assert.equal(circles.item(1).getAttribute('fill'), '#f8f8f8');
      assert.equal(circles.item(1).getAttribute('stroke'), '#888888');
      assert.equal(circles.item(1).getAttribute('stroke-width'), '1.1');

      assert.equal(img._node.classList[0], 'relation-button__image');
      assert.equal(
        img.getAttribute('href'),
        'static/gui/build/app/assets/svgs/build-relation_16.svg');
      assert.equal(img.getAttribute('width'), '16');
      assert.equal(img.getAttribute('height'), '16');
      assert.equal(img.getAttribute('transform'), 'translate(-8, -8)');
    });

    it('properly renders the create relation icon using staticURL', function() {
      // Create an instance of EnvironmentView with custom env
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore,
        staticURL: 'staticpath'
      });
      view.render();
      var relationIcon = container.one('.service').one('.relation-button');
      var img = relationIcon.one('image');
      assert.equal(
        img.getAttribute('href'),
        'staticpath/static/gui/build/app/assets/svgs/build-relation_16.svg');
    });

    // Ensure the environment view loads properly
    it('must be able to render service blocks and relations',
        function() {
          // Create an instance of EnvironmentView with custom env
          var view = new views.environment({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore
          });
          view.render();
          container.all('.service').size().should.equal(4);

          // Count all the real relations.
          (container.all('.relation').size() -
           container.all('.pending-relation').size())
              .should.equal(2);

          // Count all the subordinate relations.
          container.all('.rel-group .relation.subordinate').size()
              .should.equal(1);

          // Verify that the paths render 'properly' where this
          // means no NaN in the paths
          var line = container.one('.relation');
          Y.each(['x1', 'y1', 'x2', 'y2'],
              function(e) {
                Y.Lang.isNumber(
                    parseInt(this.getAttribute(e), 10))
                            .should.equal(true);
              }, line);

          // Verify that the node id has been munged as expected from the
          // relation id. This is particularly important for Juju Core.
          var node = container.one(
              '#' + views.utils.generateSafeDOMId(
                  'puppet:juju-info wordpress:juju-info', getParentId(view)));
          assert.isNotNull(node);
          assert.isDefined(node);
        });

    it('must be able to render subordinate and normal services',
        function(done) {
          // Create an instance of EnvironmentView with custom env
          var view = new views.environment({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore
          });
          view.render();
          container.all('.service').size().should.equal(4);
          container.all('.subordinate.service').size().should.equal(1);

          done();
        }
    );

    it('must be able to render service icons',
        function(done) {
          // Create an instance of EnvironmentView with custom env
          var view = new views.environment({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore
          });
          view.render();
          var service = container.one('.service');
          assert.equal(service.one('.service-icon').getAttribute('href'),
            'v5/precise/wordpress-6/icon.svg');

          done();
        }
    );

    it('must be able to display service icons as pending deletion', function() {
      db.services.getById('wordpress').set('deleted', true);
      // Create an instance of EnvironmentView with custom env
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
      });
      view.render();
      assert.equal(container.one('.service .service-block').getAttribute(
          'stroke'), '#19b6ee');
    });

    it('must properly count subordinate relations', function() {
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
      });
      var addSubordinate = {
        result: [
          ['serviceInfo', 'add', {
            'Subordinate': true,
            'CharmURL': 'cs:precise/puppet-2',
            'Name': 'puppet2'
          }],
          [
            'relationInfo',
            'add', {
              Key: 'wordpress:juju-info puppet2:juju-info',
              Id: 7,
              Endpoints: [
                {
                  ServiceName: 'puppet2',
                  Relation: {
                    Name: 'juju-info', Role: 'requirer',
                    Interface: 'juju-info', Scope: 'container'
                  }
                }, {
                  ServiceName: 'wordpress',
                  Relation: {
                    Name: 'juju-info', Role: 'provider',
                    Interface: 'juju-info', Scope: 'container'
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
              Key: '',
              Id: 8,
              Endpoints: [
                {
                  ServiceName: 'mediawiki',
                  Relation: {
                    Name: 'juju-info', Role: 'provider',
                    Interface: 'juju-info', Scope: 'container'
                  }
                }, {
                  ServiceName: 'puppet',
                  Relation: {
                    Name: 'juju-info', Role: 'requirer',
                    Interface: 'juju-info', Scope: 'container'
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
        var service = d3.select(serviceNode.getDOMNode()).datum();
        return module.subordinateRelationsForService(service)
          .length === count;
      }

      container.all('.subordinate.service').each(function(service) {
        validateRelationCount(service, relationModule, 1).should.equal(true);
      });

      db.onDelta({ data: addSubordinate });
      view.update();

      container.all('.subordinate.service').each(function(service) {
        validateRelationCount(service, relationModule, 1).should.equal(true);
      });

      db.onDelta({ data: addRelation });
      view.update();

      validateRelationCount(container.one('.subordinate.service'),
          relationModule, 2).should.equal(true);
    });

    it('must not duplicate nodes when services are added', function() {
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
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

      db.onDelta({ data: tmp_data });
      view.render();

      container.all('.service').each(function(serviceNode) {
        // There should not be any duplicate nodes within the service.
        serviceNode.all('.service-icon').size().should.equal(1);
        serviceNode.all('.service-block').size().should.equal(1);
      });
    });

    it('must resize the service health graph properly when units are added',
        function() {
          new views.environment({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore
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

          container.all('.service').each(function(service) {
            chartSizedProperly(service.getDOMNode()).should.equal(true);
          });

          db.onDelta({ data: tmp_data });

          container.all('.service').each(function(service) {
            chartSizedProperly(service.getDOMNode()).should.equal(true);
          });
        }
    );

    it('must recalculate relation endpoints when services are resized',
        function() {
          new views.environment({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore
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
          container.all('.rel-group').each(function(relationGroup) {
            endpointsCalculatedProperly(relationGroup.getDOMNode())
              .should.equal(true);
          });

          // Resize the wordpress service.
          db.onDelta({ data: tmp_data });

          // Ensure that endpoints still match for all services, now that
          // one service has been resized.  This is the real test here.
          container.all('.rel-group').each(function(relationGroup) {
            endpointsCalculatedProperly(relationGroup.getDOMNode())
              .should.equal(true);
          });
        }
    );

    it('must be able to place new services properly', function() {
      var view = new views.environment({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore
          }),
          tmp_data = {
            result: [
              [
                'serviceInfo',
                'add', {
                  Subordinate: true,
                  CharmURL: 'cs:precise/puppet-2',
                  Name: 'puppet2'
                }
              ], [
                'serviceInfo',
                'add', {
                  CharmURL: 'cs:precise/mysql-26',
                  Name: 'mysql2'
                }
              ], [
                'unitInfo',
                'add', {
                  MachineId: 0,
                  Status: 'started',
                  PublicAddress: '192.168.122.222',
                  Name: 'mysql2/0'
                }
              ]
            ]
          },
          properTransform = /translate\(\d+\.?\d*[, ]\d+\.?\d*\)/;
      view.render();

      container.all('.service').each(function(serviceNode) {
        // Ensure that all initial service nodes' transform attributes are
        // properly formated (i.e.: no NaN values).
        properTransform.test(serviceNode.getAttribute('transform'))
          .should.equal(true);
      });

      db.onDelta({ data: tmp_data });
      view.render();

      container.all('.service').each(function(serviceNode) {
        // Ensure that all new service nodes' transform attributes are properly
        // formatted as well (i.e.: no NaN values).
        properTransform.test(serviceNode.getAttribute('transform'))
          .should.equal(true);

        // There should not be any duplicate nodes within the service.
        serviceNode.all('.service-block').size().should.equal(1);
        serviceNode.all('.service-icon').size().should.equal(1);
      });
    });

    it('must not stack new services from delta', function() {
      var tmp_data = {
        result: [
          [
            'serviceInfo',
            'add', {
              Subordinate: false,
              CharmURL: 'cs:precise/wordpress-6',
              Name: 'wordpressa'
            }
          ]
        ]
      };
      db.reset();
      view.createTopology();
      // For testing position isn't testable with transitions on.
      view.topo.modules.ServiceModule.set('useTransitions', false);
      view.render();

      db.onDelta({ data: tmp_data });
      view.update();
      tmp_data.result[0][2].Name = 'wordpressb';
      db.onDelta({ data: tmp_data });
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
              'Tag': 'service-wordpress',
              'Annotations': {
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
      view.topo.modules.ServiceModule.set('useTransitions', false);
      view.render();

      // Test values from initial load.
      node = view.topo.modules.ServiceModule.getServiceNode('wordpress');
      match = node.getAttribute('transform').match(properTransform);
      match[1].should.eql('100');
      match[2].should.eql('200');

      db.onDelta({ data: tmp_data });
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
            'serviceInfo',
            'add',
            {
              Subordinate: true,
              CharmURL: 'cs:precise/wordpress-6',
              Name: 'wordpressa'
            }
          ]
        ]
      };
      db.onDelta({ data: tmp_data });
      view.update();
    });

    it('must be able to render subordinate relation indicators',
       function() {
         new views.environment({
           container: container,
           db: db,
           env: env,
           charmstore: fakeStore
         }).render();
         var rel_block = container.one('.sub-rel-count').getDOMNode();

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
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           charmstore: fakeStore
         }).render();
         // Attach the view to the DOM so that sizes get set properly
         // from the viewport (only available from DOM).
         view.rendered();

         var svg = Y.one('.the-canvas');

         parseInt(svg.one('g').getAttribute('height'), 10)
          .should.equal(
         parseInt(svg.getComputedStyle('height'), 10));
         parseInt(svg.one('g').getAttribute('width'), 10)
          .should.equal(
         parseInt(svg.getComputedStyle('width'), 10));
       }
    );

    // Ensure that sizes are computed properly
    it('must be able to compute sizes by the viewport with a minimum',
       function() {
         // The height of a navbar is used in calculating the viewport size,
         // so add a temporary one to the DOM
         var navbar = Y.Node.create('<div class="header-banner" ' +
             'style="height:70px;">Navbar</div>');
         Y.one('body').append(navbar);
         var viewport = Y.Node.create('<div id="viewport" ' +
             'style="width:800px;">viewport</div>');
         Y.one('body').append(viewport);
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           charmstore: fakeStore
         }).render();
         // Attach the view to the DOM so that sizes get set properly
         // from the viewport (only available from DOM).
         view.rendered();
         var svg = container.one('.the-canvas'),
             canvas = container.one('.topology');
         // We have to hide the canvas so it does not affect our calculations.
         canvas.setStyle('display', 'none');
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

    it('should fade services and relations', function(done) {
      view.render();
      view.topo.after('fade', function() {
        assertClassPresent('fade');
        done();
      });
      view.topo.fire('fade', {serviceNames: ['mysql']});
    });

    it('should show services and relations', function(done) {
      view.render();
      view.topo.after('show', function() {
        assertClassPresent('show');
        done();
      });
      view.topo.fire('show', {serviceNames: ['mysql']});
    });

    // Tests for the service menu.
    it('must be able to toggle the service menu', function(done) {
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
      }).render();
      container.all('.service').each(function(node, i) {
        node.after('click', function() {
          view.hasSVGClass(
              node.one('.service-control-panel'),
              'active').should.equal(true);
          container.all('.service-control-panel.active').size()
              .should.equal(1);
        });
      });
      done();
    });

    it('must be able to add a relation from the service menu',
       function() {
         if (Y.UA.phantomjs) {
           return;
         }
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           charmstore: fakeStore
         }).render();
         var serviceNode = container.one('.service'),
             add_rel = container.one('.relation-button__link');
         var service = d3.select(serviceNode.getDOMNode()).datum();
         var endpoints = {},
             serviceName = serviceNode.getAttribute('data-name'),
             nextServiceName = serviceNode.next().getAttribute('data-name');
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
         var module = view.topo.modules.RelationModule;
         var sm = view.topo.modules.ServiceModule;

         sm.showServiceDetails(service, { fire: function() {} });
         // Mock an event object so that d3.mouse does not throw a NPE.
         d3.event = {};
         add_rel.simulate('click');
         container.all('.selectable-service')
               .size()
               .should.equal(2);
         container.all('.dragline')
               .size()
               .should.equal(1);

         // Start the process of adding a relation.
         module.ambiguousAddRelationCheck(
             d3.select(serviceNode.next().getDOMNode()).datum(),
             module,
             serviceNode.next());
         container.all('.selectable-service').size()
            .should.equal(0);
         // The database is initialized with three relations in beforeEach.
         assert.equal(4, db.relations.size());
         // restore original getEndpoints function
         models.getEndpoints = existing;
         view.destroy();
       });

    it('must be able to remove a relation between services',
       function(done) {
         var oldRemove = env.remove_relation;
         env.remove_relation = function() {
           container.all('.to-remove')
                .size()
                .should.equal(1);
           view.topo.modules.RelationModule.
           _removeRelationCallback(view, relation, 'mysql:db wordpress:db',
               null, {});
           assert.equal(db.relations.getById('mysql:db wordpress:db'), null,
               'Relation not removed from db');
           assert.deepEqual(db.services.getById('wordpress').get('relations')
               .getById('mysql:db wordpress:db'), null,
               'Relation not removed from services');
           view.destroy();
           env.remove_relation = oldRemove;
           done();
         };
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           charmstore: fakeStore
         }).render();

         var relation = container.one(
              '#' + views.utils.generateSafeDOMId('mysql:db wordpress:db',
         getParentId(view)) +
              ' .rel-indicator'),
             menu;

         relation.simulate('click');
         menu = container.one('#relation-menu');
         menu.one('.relation-remove').simulate('click');
       });

    it('builds a menu of relations in a collection', function() {
      db.onDelta({data: additionalRelations});
      view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
      }).render();
      var module = view.topo.modules.RelationModule;

      // Single relation
      var relation = container.one(
          '#' + views.utils.generateSafeDOMId('mysql:db wordpress:db',
          getParentId(view)) +
          ' .rel-indicator'),
          menu;
      relation.simulate('click');
      menu = container.one('#relation-menu');

      assert.equal(menu.all('.relation-container').size(), 1);
      assert.equal(menu.one('.relation-container').getData('relationid'),
          'mysql:db wordpress:db');

      // Assert that relation module is storing the menu state for rerendering.
      assert.equal(module.get('relationMenuActive'), true);
      assert.equal(module.get('relationMenuRelation').id,
          'mysql:db wordpress:db');

      // Multiple relations
      relation = container.one(
          '#' +
          views.utils.generateSafeDOMId('mysql:db mediawiki:db',
          getParentId(view)) +
          ' .rel-indicator');
      relation.simulate('click');
      menu = container.one('#relation-menu');

      var relContainers = menu.all('.relation-container');
      assert.equal(relContainers.size(), 2);
      assert.equal(relContainers.item(0).getData('relationid'),
          'mysql:db mediawiki:db');
      assert.equal(relContainers.item(1).getData('relationid'),
          'mysql:db-slave mediawiki:db-slave');

      // Errors are shown.
      var unit = db.services.getById('mysql').get('units').item(0);
      unit.agent_state = 'error';
      unit.agent_state_data = {
        hook: 'db-relation'
      };
      relation.simulate('click');
      menu = container.one('#relation-menu');
      assert.equal(menu.all('.endpoint.error').size(), 1);
      assert.equal(menu.all('.relation-container.error').size(), 1);
      assert.equal(menu.all('.relation-container.running').size(), 1);
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
      view.set('staticURL', 'static');
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

    it('allows clicking on a relation to inspect it', function(done) {
      db.onDelta({data: additionalRelations});
      view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
      }).render();
      // This stops the simulate() call later on from causing a 'script error'
      container.append(
          '<div id="bws-sidebar"><div class="bws-content"></div></div>');
      // Single relation.
      var relation = container.one(
          '#' + views.utils.generateSafeDOMId('mysql:db wordpress:db',
          getParentId(view)) +
          ' .rel-indicator'),
          menu;

      relation.simulate('click');
      menu = Y.one('#relation-menu .menu');

      // Click the first endpoint.
      var endpoints = menu.all('.inspect-relation'),
          endpoint = endpoints.item(0),
          endpointName = endpoint.get('text').split(':')[0].trim();

      view.topo.after('changeState', function(e) {
        assert.deepEqual(e.details[0], {
          sectionA: {
            component: 'inspector',
            metadata: { id: endpointName }
          }});
        done();
      });

      endpoint.simulate('click');
    });

    it('allows deletion of relations within collections', function(done) {
      db.onDelta({data: additionalRelations});
      var oldRemove = env.remove_relation;
      var removeCallCount = 0;
      var step1Count = 0;
      var step2Count = 0;
      env.remove_relation = function() {
        removeCallCount += 1;
        if (removeCallCount === 1) {
          step1();
        }
        if (removeCallCount === 2) {
          step2();
          env.remove_relation = oldRemove;
          if (step2Count < 2) {
            done();
          }
        }
      };

      function step1() {
        step1Count += 1;
        if (step1Count !== 1) {
          return;
        }
        container.all('.to-remove')
             .size()
             .should.equal(1);
        // Multiple relations.
        relation = container.one(
            '#' +
            views.utils.generateSafeDOMId('mysql:db mediawiki:db',
            getParentId(view)) +
            ' .rel-indicator');
        relation.simulate('click');
        menu = Y.one('#relation-menu .menu');
        // Click the first relation.
        menu.one('.relation-remove').simulate('click');
      }

      function step2() {
        // Note that there should now be two .to-remove relations due to the
        // previous case having added one of those classes. We're simply looking
        // for the number to have increased.
        step2Count += 1;
        if (step2Count !== 1) {
          return;
        }
        view.destroy();
      }

      view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
      }).render();

      // Single relation.
      var relation = container.one(
          '#' + views.utils.generateSafeDOMId('mysql:db wordpress:db',
          getParentId(view)) +
          ' .rel-indicator'),
          menu;

      relation.simulate('click');
      menu = Y.one('#relation-menu .menu');

      // Click the first relation.
      menu.one('.relation-remove').simulate('click');
    });

    it('must not allow removing a subordinate relation between services',
        function() {
          view = new views.environment({
            container: container,
            db: db,
            env: env,
            charmstore: fakeStore
          }).render();

         // Get a subordinate relation.
          var relation = container.one(
              '#' + views.utils.generateSafeDOMId(
                  'puppet:juju-info wordpress:juju-info',
         getParentId(view)) +
              ' .rel-indicator'),
              menu,
              panel;

          relation.simulate('click');
          menu = container.one('#relation-menu');
          menu.one('.relation-remove').simulate('click');
          panel = Y.one('#rmsubrelation-modal-panel');

         // There should only be a cancel button on the warning dialog.
          panel.all('button').size().should.equal(1);

         // Clicking cancel will hide the dialog.
          panel.one('button').simulate('click');
          panel.all('button').size().should.equal(0);
        });

    it('should stop creating a relation if the background is clicked',
        function() {
          var db = new models.Database(),
              endpointsMap = {'service-1': {requires: [], provides: []}};
          var fauxController = new Y.Base();
          fauxController.endpointsMap = endpointsMap;
          fauxController.set('db', db);
          var view = new views.environment(
              { container: container,
                db: db,
                endpointsController: fauxController,
                env: env,
                charmstore: fakeStore
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
          var topo = module.get('component');
          module.startRelation(service);
          assert.isTrue(topo.buildingRelation);
          // ...clicking on the background causes the relation drag to stop.
          sm.backgroundClicked();
          assert.isFalse(topo.buildingRelation);
          view.destroy();
          db.destroy();
          fauxController.destroy();
        });

    it('stores relations in collections', function() {
      db.onDelta({data: additionalRelations});
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        charmstore: fakeStore
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

    it('propagates the getModelURL function to the topology', function() {
      var getModelURL = function() {
        return 'placeholder value';
      };
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        getModelURL: getModelURL,
        charmstore: fakeStore
      }).render();
      var topoGetModelURL = view.topo.get('getModelURL');
      assert.equal('placeholder value', topoGetModelURL());
      view.destroy();
    });

    it('propagates the endpointsController to the topology', function() {
      var view = new views.environment({
        container: container,
        db: db,
        endpointsController: 'hidy ho',
        env: env,
        charmstore: fakeStore
      }).render();
      var endpointsController = view.topo.get('endpointsController');
      assert.equal('hidy ho', endpointsController);
      view.destroy();
    });

    describe('onboarding integration with the environment', function() {
      // XXX This test does not run in Phantom, but passes in the browser.
      // See https://github.com/ariya/phantomjs/issues/12782 for details.
      // Makyo - 2015-09-21
      it('shows/hides the integrated button when a service is added',
          function() {
            if (Y.UA.phantomjs) {
              return;
            }
            db = new models.Database();
            view.set('db', db);
            view.render().rendered();
            var includedPlus = view.topo.vis.select('.included-plus');
            var helpText = container.one('.environment-help');
            assert.equal(false, includedPlus.classed('show'));
            assert.equal(false, helpText.hasClass('shrink'));

            var service = new models.Service({
              id: 'service-1',
              charm: 'precise/mysql-1'
            });
            db.services.add([service]);

            assert.equal(true, includedPlus.classed('show'));
            assert.equal(true, helpText.hasClass('shrink'));
            view.destroy();
          }
        );
    });
  });

  describe('view model support infrastructure', function() {
    var views, models, module, service, testUtils, viewUtils;

    before(function(done) {
      YUI(GlobalConfig).use(
          ['juju-views', 'juju-models', 'charmstore-api', 'juju-tests-utils',
          'juju-view-utils'],
          function(Y) {
            views = Y.namespace('juju.views');
            models = Y.namespace('juju.models');
            testUtils = Y.namespace('juju-tests').utils;
            viewUtils = Y.namespace('juju.views.utils');
            done();
          });
    });

    beforeEach(function() {
      service = new models.Service({
        id: 'mediawiki',
        exposed: true});
      module = {
        topology: {
          serviceForBox: function() {return service;}
        }};
    });

    it('must be able to get us nearest connectors when snapping to poles',
       function() {

         var b1 = views.BoundingBox(module, service),
             b2 = views.BoundingBox(module, service);

         // raw property access
         b1.x = 0; b1.y = 0;
         b1.w = 100; b1.h = 200;

         // Use pos to set b2
         b2.pos = {x: 200, y: 300, w: 100, h: 200};

         b1.xy.should.eql([0, 0]);
         b2.wh.should.eql([100, 200]);

         viewUtils.snapToPoles = true;

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

        var b1 = views.BoundingBox(module, service),
            b2 = views.BoundingBox(module, service);

        // raw property access
        b1.x = 0; b1.y = 0;
        b1.w = 100; b1.h = 200;

        // Use pos to set b2
        b2.pos = {x: 200, y: 300, w: 100, h: 200};

        b1.xy.should.eql([0, 0]);
        b2.wh.should.eql([100, 200]);

        viewUtils.snapToPoles = false;

        b1.getNearestConnector(b2).should
         .eql(b1.connectors.center);

        b2.getNearestConnector(b1).should
         .eql(b2.connectors.center);
      });

    it('must be able to tell if a point is inside a box', function() {
      var b = views.BoundingBox(module, service);
      b.pos = {x: 100, y: 100, w: 50, h: 50};

      b.containsPoint([125, 125]).should.equal(true);
      b.containsPoint([25, 25]).should.equal(false);
    });

    it('must be able to save and restore old position information',
       function() {
         var b1 = views.BoundingBox(module, service),
             b2 = views.BoundingBox(module, service);

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
      var b1 = new views.BoundingBox(module, service);

      b1.modelId.should.equal('service-mediawiki');

      // Properties of the model have mapped to the box.
      b1.id.should.equal('mediawiki');
      b1.exposed.should.equal(true);
    });

    it('must be able to update position data and not touch model data',
       function() {
         var b1 = views.BoundingBox(module, service);
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
         var boxes = views.toBoundingBoxes(module, services);
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
         var boxes = views.toBoundingBoxes(module, services);
         var mysql = services.getById('mysql');

         boxes.mysql.exposed.should.equal(false);
         mysql.set('exposed', true);

         // The third argument here implies an update.
         views.toBoundingBoxes(module, services, boxes);
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

      var boxes = views.toBoundingBoxes(module, services, existing);
      // The haproxy is removed from the results since it is no longer in
      // the services list.
      assert.equal(boxes.haproxy, undefined);
    });

    it('retrieves local charms icons from the Juju env', function() {
      var fakeEnv = {
        getLocalCharmFileUrl: testUtils.makeStubFunction('local charm icon')
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

      var boxes = views.toBoundingBoxes(module, services, existing, fakeEnv);

      assert.equal(boxes['local:ceph-1'].icon, 'local charm icon');

      // The mysql charm has an icon from on the server.
      assert.equal(boxes['cs:mysql-1'].icon, 'v5/mysql-1/icon.svg');
    });
  });
})();
