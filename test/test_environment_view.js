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
    var view, views, models, Y, container, service, db, conn,
        juju, env, testUtils, fakeStore;

    var environment_delta = {
      'result': [
        ['service', 'add', {
          'charm': 'cs:precise/wordpress-6',
          'id': 'wordpress',
          'exposed': false,
          'annotations': {'gui-x': 100, 'gui-y': 200}
        }],
        ['service', 'add', {
          'charm': 'cs:precise/mediawiki-3',
          'id': 'mediawiki',
          'exposed': false
        }],
        ['service', 'add', {
          'charm': 'cs:precise/mysql-6',
          'id': 'mysql'
        }],
        ['service', 'add', {
          'subordinate': true,
          'charm': 'cs:precise/puppet-2',
          'id': 'puppet'
        }],
        ['relation', 'add', {
          'interface': 'reversenginx',
          'scope': 'global',
          'endpoints':
           [['wordpress', {'role': 'peer', 'name': 'loadbalancer'}]],
          'id': 'relation-0000000000'
        }],
        ['relation', 'add', {
          'interface': 'juju-info',
          'scope': 'container',
          'endpoints':
           [['wordpress', {'role': 'server', 'name': 'juju-info'}],
            ['puppet', {'role': 'client', 'name': 'juju-info'}]],
          'id': 'relation-0000000007'
        }],
        ['relation', 'add', {
          'interface': 'mysql',
          'scope': 'global',
          'endpoints':
           [['mysql', {'role': 'server', 'name': 'db'}],
            ['wordpress', {'role': 'client', 'name': 'db'}]],
           'id': 'relation-0000000001'
        }],
        ['machine', 'add', {
          'agent-state': 'running',
          'instance-state': 'running',
          'id': 0,
          'instance-id': 'local',
          'dns-name': 'localhost'
        }],
        ['unit', 'add', {
          'machine': 0,
          'agent-state': 'started',
          'public-address': '192.168.122.113',
          'id': 'wordpress/0'
        }],
        ['unit', 'add', {
          'machine': 0,
          'agent-state': 'started',
          'public-address': '192.168.122.113',
          'id': 'mediawiki/0'
        }],
        ['unit', 'add', {
          'machine': 0,
          'agent-state': 'started',
          'public-address': '192.168.122.222',
          'id': 'mysql/0'
        }]
      ],
      'op': 'delta'
    };

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-views', 'juju-tests-utils', 'juju-env',
        'node-event-simulate', 'juju-gui', 'slider',
        'landscape', 'dump', 'juju-view-utils', 'juju-charm-store',
        'juju-charm-models'
      ], function(Y) {
        testUtils = Y.namespace('juju-tests.utils');
        views = Y.namespace('juju.views');
        models = Y.namespace('juju.models');
        conn = new testUtils.SocketStub();
        juju = Y.namespace('juju');
        env = juju.newEnvironment({conn: conn});
        env.connect();
        conn.open();
        fakeStore = new Y.juju.charmworld.APIv3({});
        fakeStore.iconpath = function() {
          return 'charm icon url';
        };
        done();
      });
    });

    after(function(done)  {
      env.destroy();
      done();
    });

    beforeEach(function() {
      container = testUtils.makeContainer(this, 'content');
      db = new models.Database();
      // Use a clone to avoid any mutation
      // to the input set (as happens with processed
      // annotations, its a direct reference).
      db.onDelta({data: Y.clone(environment_delta)});
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
        store: fakeStore
      });
    });

    afterEach(function(done) {
      db.destroy();
      env._txn_callbacks = {};
      conn.messages = [];
      done();
    });


    it('should display help text when canvas is empty', function() {
      // Use a db w/o the delta loaded
      db = new models.Database();
      view.set('db', db);
      view.render().rendered();

      // Verify we have help text.
      var help = Y.one('#environment-help');
      assert.strictEqual(help.getStyle('display'), 'block');
    });


    it('should not display help text when canvas is populated', function() {
      view.render().rendered();

      // Verify we do not have help text.
      var help = Y.one('#environment-help');
      assert.strictEqual(help.getStyle('display'), 'none');
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

    // Ensure the environment view loads properly
    it('must be able to render service blocks and relations',
        function() {
          // Create an instance of EnvironmentView with custom env
          var view = new views.environment({
            container: container,
            db: db,
            env: env,
            store: fakeStore
          });
          view.render();
          container.all('.service').size().should.equal(4);

          // Count all the real relations.
          (container.all('.relation').size() -
           container.all('.pending-relation').size())
              .should.equal(2);

          // Count all the subordinate relations.
          container.all('.subordinate-rel-group').size()
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
              '#' + views.utils.generateSafeDOMId('relation-0000000007'));
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
            store: fakeStore
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
            store: fakeStore
          });
          view.render();
          var service = container.one('.service');
          assert.equal(service.one('.service-icon').getAttribute('href'),
         'charm icon url');

          done();
        }
    );

    it('must properly count subordinate relations', function() {
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        store: fakeStore
      });
      var addSubordinate = {
        result: [
          ['service', 'add', {
            'subordinate': true,
            'charm': 'cs:precise/puppet-2',
            'id': 'puppet2'
          }],
          ['relation', 'add', {
            'interface': 'juju-info',
            'scope': 'container',
            'endpoints':
             [['wordpress', {'role': 'server', 'name': 'juju-info'}],
              ['puppet2', {'role': 'client', 'name': 'juju-info'}]],
            'id': 'new-relation-0000000008'
          }]
        ],
        op: 'delta'
      };
      var addRelation = {
        result: [
          ['relation', 'add', {
            'interface': 'juju-info',
            'scope': 'container',
            'endpoints':
             [['mediawiki', {'role': 'server', 'name': 'juju-info'}],
              ['puppet', {'role': 'client', 'name': 'juju-info'}]],
            'id': 'new-relation-0000000009'
          }]
        ],
        op: 'delta'
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
        store: fakeStore
      });
      var tmp_data = {
        result: [
          ['service', 'add', {
            'subordinate': true,
            'charm': 'cs:precise/puppet-2',
            'id': 'puppet2'
          }],
          ['service', 'add', {
            'charm': 'cs:precise/mysql-6',
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
        serviceNode.all('.service-status').size().should.equal(1);
        serviceNode.all('.name').size().should.equal(1);
        serviceNode.all('.service-block-image').size().should.equal(1);
      });
    });

    it('must resize the service health graph properly when units are added',
        function() {
          /* jshint -W031 */
          new views.environment({
            container: container,
            db: db,
            env: env,
            store: fakeStore
          });
          /* jshint +W031 */
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
            store: fakeStore
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
        store: fakeStore
      }),
          tmp_data = {
            result: [
              ['service', 'add', {
                'subordinate': true,
                'charm': 'cs:precise/puppet-2',
                'id': 'puppet2'
              }],
              ['service', 'add', {
                'charm': 'cs:precise/mysql-6',
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
        serviceNode.all('.service-status').size().should.equal(1);
        serviceNode.all('.name').size().should.equal(1);
        serviceNode.all('.service-block-image').size().should.equal(1);
      });
    });

    it('must not stack new services from delta', function() {
      var tmp_data = {
        op: 'delta',
        result: [
          ['service', 'add',
            {
              'subordinate': false,
              'charm': 'cs:precise/wordpress-6',
              'id': 'wordpressa'
            }
          ]]
      };
      db.reset();
      view.createTopology();
      // For testing position isn't testable with transitions on.
      view.topo.modules.ServiceModule.set('useTransitions', false);
      view.render();

      db.onDelta({ data: tmp_data });
      view.update();
      tmp_data.result[0][2].id = 'wordpressb';
      db.onDelta({ data: tmp_data });
      view.update();

      assert.notDeepEqual(
          view.topo.service_boxes.wordpressa.center,
          view.topo.service_boxes.wordpressb.center);
    });

    it('must be able to use position annotations', function(done) {
      var tmp_data = {
        op: 'delta',
        result: [
          ['service', 'add',
            {
              'subordinate': true,
              'charm': 'cs:precise/wordpress-6',
              'id': 'wordpress',
              'annotations': {'gui-x': 374.1, 'gui-y': 211.2}
            }
          ]]
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

      // A positioned service will never be auto-positioned. It will also
      // center the canvas on itself.
      view.topo.on('panToPoint', function() {
        // Once we reach here, the view has been updated and the canvas panned
        // to the newly added/annotated service.
        done();
      });
      tmp_data = {
        op: 'delta',
        result: [
          ['service', 'add',
            {
              'subordinate': false,
              'charm': 'cs:precise/wordpress-6',
              'id': 'wordpressa',
              'annotations': {'gui-x': 374.1, 'gui-y': 211.2}
            }
          ]]
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
           store: fakeStore
         }).render();
         var rel_block = container.one('.sub-rel-count').getDOMNode();

         // Get the contents of the subordinate relation count; YUI cannot
         // get this directly as the node is not an HTMLElement, so use
         // native SVG methods.
         rel_block.firstChild.nodeValue.should.equal('1');
       }
    );

    // Ensure that the zoom controls work
    it('must be able to zoom using controls', function() {
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        store: fakeStore
      }).render();
      // Attach the view to the DOM so that sizes get set properly
      // from the viewport (only available from DOM).
      view.rendered();
      var zoom_in = container.one('#zoom-in-btn'),
          zoom_out = container.one('#zoom-out-btn'),
          module = view.topo.modules.PanZoomModule,
          slider = module.slider,
          svg = container.one('svg g');

      zoom_in.simulate('click');

      var attr = svg.getAttribute('transform');
      // Ensure that, after clicking the zoom in button, that the
      // scale portion of the transform attribute of the svg
      // element has been upped by 0.2.  The transform attribute
      // also contains translate, so test via a regex.
      /scale\(1\.25\)/.test(attr).should.equal(true);

      // Ensure that the slider agrees.
      slider.get('value').should.equal(125);

      // Ensure that zooming via slider sets scale.
      slider.set('value', 150);
      attr = svg.getAttribute('transform');
      /scale\(1\.5\)/.test(attr).should.equal(true);
    });

    // Ensure that sizes are computed properly
    it('must be able to compute rect sizes based on the svg and' +
       ' viewport size',
       function() {
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           store: fakeStore
         }).render();
         // Attach the view to the DOM so that sizes get set properly
         // from the viewport (only available from DOM).
         view.rendered();
         var svg = Y.one('svg');

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
         var navbar = Y.Node.create('<div class="navbar" ' +
             'style="height:70px;">Navbar</div>');
         Y.one('body').append(navbar);
         var viewport = Y.Node.create('<div id="viewport" ' +
             'style="width:800px;">viewport</div>');
         Y.one('body').append(viewport);
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           store: fakeStore
         }).render();
         // Attach the view to the DOM so that sizes get set properly
         // from the viewport (only available from DOM).
         view.rendered();
         var svg = container.one('svg'),
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

    // Tests for the service menu.
    it('must be able to toggle the service menu', function(done) {
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        store: fakeStore
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

    it('must show Build Relation as disabled if charm is not loaded',
       function() {
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           store: fakeStore
         }).render();
         var serviceNode = container.one('.service'),
             add_rel = container.one('.add-relation');

         // Toggle the service menu for the Add Relation button.
         var sm = view.topo.modules.ServiceModule;

         var service = d3.select(serviceNode.getDOMNode()).datum();
         // Add a mock charm for the service.
         var charm = {'id': service.charm,
                       loaded: false};
         db.charms.add(charm);
         sm.showServiceMenu(service);

         // Since the service's charm is not loaded the 'Build Relation' link
         // is disabled.
         assert.isTrue(add_rel.hasClass('disabled'));
         charm = db.charms.getById(service.charm);
         charm.loaded = true;
         // Toggle the service menu twice to cause re-rendering.
         sm.hideServiceMenu(service);
         sm.showServiceMenu(service);
         // Now that the charm is loaded and the menu is re-rendered, the
         // Build Relation link is no longer disabled.
         assert.isFalse(add_rel.hasClass('disabled'));
       });


    it('must not respond to clicks on disabled Build Relation link',
       function() {
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           store: fakeStore
         }).render();
         var serviceNode = container.one('.service'),
             add_rel = container.one('.add-relation'),
             after_evt;

         var service = d3.select(serviceNode.getDOMNode()).datum();
         // Add a mock charm for the service.
         var charm = {id: service.charm,
           loaded: false};
         db.charms.add(charm);

         // Toggle the service menu for the Add Relation button.
         var sm = view.topo.modules.ServiceModule;
         sm.showServiceMenu(service);
         // Mock an event object so that d3.mouse does not throw a NPE.
         d3.event = {};
         add_rel.simulate('click');
         // And nothing happens.
         container.all('.selectable-service')
               .size()
               .should.equal(0);
         container.all('.dragline')
               .size()
               .should.equal(0);

         view.destroy();
       });

    it('must be able to add a relation from the service menu',
       function() {
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           store: fakeStore
         }).render();
         var serviceNode = container.one('.service'),
             add_rel = container.one('.add-relation'),
             after_evt;

         var service = d3.select(serviceNode.getDOMNode()).datum();
         // Add a mock charm for the service.
         var charm = {id: service.charm,
           loaded: false};
         db.charms.add(charm);
         charm = db.charms.getById(service.charm);
         charm.loaded = true;
         // Mock endpoints
         var existing = models.getEndpoints;
         models.getEndpoints = function() {
           var endpoints = {},
               serviceName = serviceNode.one('.name')
                 .getDOMNode().firstChild.nodeValue,
               nextServiceName = serviceNode.next().one('.name')
                 .getDOMNode().firstChild.nodeValue;
           endpoints[nextServiceName] = [
             [
              {
                service: serviceName,
                name: 'relName',
                type: 'relType'
              },
              {
                service: nextServiceName,
                name: 'relName',
                type: 'relType'
              }
             ]
           ];
           return endpoints;
         };

         // Toggle the service menu for the Add Relation button.
         var module = view.topo.modules.RelationModule;
         var sm = view.topo.modules.ServiceModule;

         sm.showServiceMenu(service);
         // Mock an event object so that d3.mouse does not throw a NPE.
         d3.event = {};
         add_rel.simulate('click');
         container.all('.selectable-service')
               .size()
               .should.equal(2);
         container.all('.dragline')
               .size()
               .should.equal(1);

         // Ensure that mousemove was fired and the dragline moved.
         var x2 = parseInt(view.topo.vis.select('.dragline').attr('x2'), 10);
         var y2 = parseInt(view.topo.vis.select('.dragline').attr('y2'), 10);
         container.one('.topology rect:first-child')
           .simulate('mousemove', { clientX: -1, clientY: -1 });
         parseInt(view.topo.vis.select('.dragline').attr('x2'), 10)
           .should.equal(x2 - 1);
         parseInt(view.topo.vis.select('.dragline').attr('y2'), 10)
           .should.equal(y2 - 1);

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
       function() {
         var view = new views.environment({
           container: container,
           db: db,
           env: env,
           store: fakeStore
         }).render();

         var relation = container.one(
              '#' + views.utils.generateSafeDOMId('relation-0000000001') +
              ' .rel-label'),
         dialog_btn,
         panel;

         relation.simulate('click');
         panel = Y.one('#rmrelation-modal-panel');

         // There should be a 'remove relation' button and a 'cancel' button
         // on the dialog.
         panel.all('button').size().should.equal(2);

         dialog_btn = panel.one('.button');
         dialog_btn.simulate('click');
         container.all('.to-remove')
              .size()
              .should.equal(1);
         view.topo.modules.RelationModule.get('rmrelation_dialog').hide();
         view.destroy();
       });

    it('must not allow removing a subordinate relation between services',
        function() {
         new views.environment({
           container: container,
           db: db,
           env: env,
           store: fakeStore
         }).render();

         // Get a subordinate relation.
         var relation = container.one(
              '#' + views.utils.generateSafeDOMId('relation-0000000007') +
              ' .rel-label'),
         dialog_btn,
         panel;

         relation.simulate('click');
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
                store: fakeStore
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

    it('propagates the getModelURL function to the topology', function() {
      var getModelURL = function() {
        return 'placeholder value';
      };
      var view = new views.environment({
        container: container,
        db: db,
        env: env,
        getModelURL: getModelURL,
        store: fakeStore
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
        store: fakeStore
      }).render();
      var endpointsController = view.topo.get('endpointsController');
      assert.equal('hidy ho', endpointsController);
      view.destroy();
    });

    it('resizes the inspector when creating a relation', function(done) {
      var shrinkInspectorCalled = 0,
          expandInspectorCalled = 0;
      view.shrinkInspector = function() { shrinkInspectorCalled = 1; };
      view.expandInspector = function() { expandInspectorCalled = 1; };

      view.createTopology();

      view.topo.after('addRelationEnd', function() {
        assert.equal(shrinkInspectorCalled, 1);
        assert.equal(expandInspectorCalled, 1);
        done();
      });
      view.topo.fire('addRelationStart');
      view.topo.fire('addRelationEnd');
    });

  });

  describe('view model support infrastructure', function() {
    var Y, views, models, module, service;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-views', 'juju-models'],
          function(Y) {
            views = Y.namespace('juju.views');
            models = Y.namespace('juju.models');
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

    it('must be able to get us nearest connectors',
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

         b1.getNearestConnector([0, 0]);

         b1.getNearestConnector(b2).should
          .eql(b1.connectors.bottom);

         b2.getNearestConnector(b1).should
          .eql(b2.connectors.top);

         b1.getConnectorPair(b2).should.eql([
           b1.connectors.bottom,
           b2.connectors.top]);
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
        'mysql': 1,
        'haproxy': 2, // This entry is stale and will be removed.
        'memcache': 3,
        'wordpress': 4};

      var boxes = views.toBoundingBoxes(module, services, existing);
      // The haproxy is removed from the results since it is no longer in
      // the services list.
      assert.equal(boxes.haproxy, undefined);
    });

    it('sets the default icon for local charms without an icon', function() {
      var iconFakeStore = new Y.juju.charmworld.APIv3({
        apiHost: 'http://localhost'
      });
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

      var boxes = views.toBoundingBoxes(
          module, services, existing, iconFakeStore);

      // the ceph charm should have the default icon path.
      assert.equal(
          boxes['local:ceph-1'].icon,
          'http://localhost/static/img/charm_160.svg'
      );

      // The mysql charm has an icon from on the server.
      assert.equal(
          boxes['cs:mysql-1'].icon,
          'http://localhost/api/3/charm/mysql-1/file/icon.svg'
      );
    });
  });
})();
