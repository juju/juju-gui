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
  describe('Service config view (views.service_config)', function() {
    var models, Y, container, service, db, conn, env, charm, views, view;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-views', 'juju-models', 'base', 'node', 'json-parse',
          'juju-env', 'node-event-simulate', 'juju-tests-utils', 'event-key',
          'resizing-textarea',
          function(Y) {
            models = Y.namespace('juju.models');
            views = Y.namespace('juju.views');
            done();
          });
    });

    beforeEach(function(done) {
      conn = new (Y.namespace('juju-tests.utils')).SocketStub();
      env = Y.namespace('juju').newEnvironment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div/>').hide();
      Y.one('#main').append(container);
      db = new models.Database();
      var charmOptions = {
        a_bool: {name: 'bob', type: 'boolean', 'default': true},
        an_int: {type: 'int', 'default': 10},
        a_float: {type: 'float', 'default': 1.0},
        a_string: {type: 'string', 'default': 'howdy'},
        some_text: {type: 'string', 'default': 'hidey\nho'}
      };
      charm = new models.BrowserCharm({
        id: 'cs:precise/mysql-7',
        description: 'A DB',
        options: charmOptions
      });
      db.charms.add([charm]);
      var serviceConfig = {};
      Y.Object.each(charmOptions, function(v, k) {
        serviceConfig[k] = v['default'];
      });
      service = new models.Service({
        id: 'mysql',
        charm: 'cs:precise/mysql-7',
        unit_count: db.units.size(),
        loaded: true,
        config: serviceConfig,
        exposed: false
      });

      db.services.add([service]);
      view = new views.service_config({
        db: db,
        env: env,
        getModelURL: function(model, intent) {
          return model.get('name');
        },
        model: service,
        container: container
      });
      done();
    });

    afterEach(function(done) {
      container.remove(true);
      service.destroy();
      db.destroy();
      env.destroy();
      done();
    });

    it('displays a loading message if the service is not loaded', function() {
      view.set('model', undefined);
      view.render();
      var html = container.getHTML();
      assert.match(html, /Loading/);
    });

    it('displays no loading message if the service is loaded', function() {
      view.get('model').set('loaded', true);
      view.render();
      var html = container.getHTML();
      assert.notMatch(html, /Loading\.\.\./);
    });

    it('informs the template if the service is the GUI', function() {
      var renderData = view.gatherRenderData();
      assert.equal(renderData.serviceIsJujuGUI, false);
    });

    it('shows the correct widget types using charm defaults', function() {
      var renderData = view.gatherRenderData();
      var settings = renderData.settings;

      assert.equal('a_bool', settings[0].name);
      assert.isTrue(settings[0].isBool);
      assert.equal('checked', settings[0].value);

      assert.equal('an_int', settings[1].name);
      assert.isUndefined(settings[1].isBool);
      assert.isTrue(settings[1].isNumeric);
      assert.equal(10, settings[1].value);

      assert.equal('a_float', settings[2].name);
      assert.isUndefined(settings[2].isBool);
      assert.isTrue(settings[2].isNumeric);
      assert.equal(1.0, settings[2].value);

      assert.equal('a_string', settings[3].name);
      assert.isUndefined(settings[3].isBool);
      assert.equal('howdy', settings[3].value);

      assert.equal('some_text', settings[4].name);
      assert.isUndefined(settings[4].isBool);
      assert.equal('hidey\nho', settings[4].value);
    });

    it('attaches the resizing plugin to the textareas', function() {
      view.render();
      var textareas = container.all('textarea.config-field');
      assert.equal(textareas.size(), 2);
      assert.isUndefined(textareas.item(0).resizingTextarea);
      assert.isUndefined(textareas.item(1).resizingTextarea);
      view.containerAttached();
      textareas = container.all('textarea.config-field');
      // Clones will have been created after each real
      // textarea, so the actual ones are the even numbered.
      assert.equal(textareas.size(), 4);
      assert.isDefined(textareas.item(0).resizingTextarea);
      assert.isDefined(textareas.item(2).resizingTextarea);
    });

  });
})();

(function() {
  // XXX This "describe" is a lie.  There are tests here for both the service
  // view (views.service) and the relations view (views.service_relations).
  // This test suite needs to be broken out into two that just contain tests
  // for one or the other.
  describe('juju service view', function() {
    var models, Y, container, service, db, conn, env, charm, ENTER, ESC,
        makeServiceView, makeServiceRelationsView, views, unit, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-views', 'juju-models', 'base', 'node', 'json-parse',
          'juju-env', 'node-event-simulate', 'juju-tests-utils', 'event-key',
          'juju-landscape', 'ns-routing-app-extension', 'juju-view-utils',
          function(Y) {
            ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
            ESC = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.esc;
            models = Y.namespace('juju.models');
            views = Y.namespace('juju.views');
            utils = Y.namespace('juju.views.utils');
            done();
          });
    });

    beforeEach(function(done) {
      conn = new (Y.namespace('juju-tests.utils')).SocketStub();
      env = Y.namespace('juju').newEnvironment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div/>')
        .hide();
      Y.one('#main').append(container);
      db = new models.Database();
      charm = new models.BrowserCharm({
        id: 'cs:precise/mysql-7',
        description: 'A DB'
      });
      db.charms.add([charm]);
      // Add units sorted by id as that is what we expect from the server.
      db.units.add([{id: 'mysql/0', agent_state: 'pending'},
                    {id: 'mysql/1', agent_state: 'pending'},
                    {id: 'mysql/2', agent_state: 'pending'}
          ]);
      service = new models.Service(
          { id: 'mysql',
            charm: 'cs:precise/mysql-7',
            unit_count: db.units.size(),
            loaded: true,
            exposed: false});

      db.services.add([service]);
      var nsRouter = Y.namespace('juju').Router('charmbrowser');
      var viewMakerMaker = function(ViewPrototype) {
        return function(querystring) {
          if (!Y.Lang.isValue(querystring)) {
            querystring = {};
          }
          return new ViewPrototype(
              { container: container,
                model: service,
                db: db,
                env: env,
                getModelURL: function(model, intent) {
                  return model.get('name');
                },
                nsRouter: nsRouter,
                querystring: querystring}).render();
        };
      };
      makeServiceView = viewMakerMaker(views.service);
      makeServiceRelationsView = viewMakerMaker(views.service_relations);
      done();
    });

    afterEach(function(done) {
      container.remove(true);
      service.destroy();
      db.destroy();
      env.destroy();
      done();
    });

    it('should show controls to modify units by default', function() {
      var view = makeServiceView();
      container.one('.num-units-control').should.not.equal(null);
    });

    it('should not show controls if the charm is subordinate', function() {
      // The _set forces a change to a writeOnly attribute.
      charm._set('is_subordinate', true);
      var view = makeServiceView();
      // "var _ =" makes the linter happy.
      var _ = expect(container.one('.num-units-control')).to.not.exist;
    });

    it('should show Landscape controls if needed', function() {
      db.environment.set('annotations', {
        'landscape-url': 'http://host',
        'landscape-computers': '/foo',
        'landscape-reboot-alert-url': '+reboot'
      });
      service['landscape-needs-reboot'] = true;
      service.set('annotations', {
        'landscape-computers': '/bar'
      });
      var landscape = new views.Landscape();
      landscape.set('db', db);

      var view = new views.service({
        container: container,
        model: service,
        db: db,
        env: env,
        landscape: landscape,
        getModelURL: function(model, intent) {
          return model.get('name');
        },
        querystring: {}
      }).render();

      var rebootItem = container.one('.landscape-controls .restart-control');
      rebootItem.one('a').get('href').should
        .equal('http://host/foo/bar/+reboot');
    });

    it('should show the service units ordered by number', function() {
      // Note that the units are added in beforeEach in an ordered manner.
      var view = makeServiceView();
      var rendered_names = container.one(
          'ul.thumbnails').all('div.unit').get('id');
      var expected_names = db.units.map(function(u) {return u.id;});
      expected_names.sort();
      assert.deepEqual(rendered_names, expected_names);
      rendered_names.should.eql(expected_names);
    });

    it('should show unit details when a unit is clicked', function() {
      // Note that the units are added in beforeEach in an ordered manner.
      var view = makeServiceView(),
          unit = container.one('ul.thumbnails').one('div.unit'),
          showUnitCalled = false;
      view.on('navigateTo', function(e) {
        assert.equal('/:gui:/unit/mysql-0/', e.url);
        showUnitCalled = true;
      });
      unit.simulate('click');
      assert.isTrue(showUnitCalled);
    });

    it('should use the show_units_large template if required', function() {
      // Note that the units are added in beforeEach in an ordered manner.
      var view = makeServiceView();
      assert.equal('unit-large', container.one('ul.thumbnails').get('id'));
    });

    var addUnits = function(number, state) {
      var units = [];
      // Starting from the number of already present units.
      var starting_from = db.units.size();
      for (var i = starting_from; i < number + starting_from; i += 1) {
        units.push({id: 'mysql/' + i, agent_state: state || 'pending'});
      }
      db.units.add(units);
    };

    it('should use the show_units_medium template if required', function() {
      // Note that the units are added in beforeEach in an ordered manner.
      addUnits(30);
      var view = makeServiceView();
      assert.equal('unit-medium', container.one('ul.thumbnails').get('id'));
    });

    it('should use the show_units_small template if required', function() {
      // Note that the units are added in beforeEach in an ordered manner.
      addUnits(60);
      var view = makeServiceView();
      assert.equal('unit-small', container.one('ul.thumbnails').get('id'));
    });

    it('should use the show_units_tiny template if required', function() {
      // Note that the units are added in beforeEach in an ordered manner.
      addUnits(260);
      var view = makeServiceView();
      assert.equal('unit-tiny', container.one('ul.thumbnails').get('id'));
    });

    it('should display units based on their agent state', function() {
      // Note that the units are added in beforeEach in an ordered manner
      // with ``pending`` status.
      addUnits(1, 'started');
      addUnits(2, 'start-error');
      var view = makeServiceView();
      var thumbnails = container.one('ul.thumbnails');
      assert.equal(1, thumbnails.all('.state-started').size());
      assert.equal(2, thumbnails.all('.state-error').size());
      assert.equal(3, thumbnails.all('.state-pending').size());
    });

    it('should start with the proper number of units shown in the text field',
       function() {
         var view = makeServiceView();
         var control = container.one('.num-units-control');
         control.get('value').should.equal('3');
       });

    it('should remove multiple units when the text input changes',
       function() {
         var view = makeServiceView();
         var control = container.one('.num-units-control');
         control.set('value', 1);
         control.simulate('keydown', { keyCode: ENTER }); // Simulate Enter.
         var message = conn.last_message();
         message.op.should.equal('remove_units');
         message.unit_names.should.eql(['mysql/2', 'mysql/1']);
       });

    it('should not do anything if requested is < 1',
       function() {
         var view = makeServiceView();
         var control = container.one('.num-units-control');
         control.set('value', 0);
         control.simulate('keydown', { keyCode: ENTER });
         var _ = expect(conn.last_message()).to.not.exist;
         control.get('value').should.equal('3');
       });

    it('should not do anything if the number of units is <= 1',
       function() {
         service.set('unit_count', 1);
         db.units.remove([1, 2]);
         var view = makeServiceView();
         var control = container.one('.num-units-control');
         control.set('value', 0);
         control.simulate('keydown', { keyCode: ENTER });
         var _ = expect(conn.last_message()).to.not.exist;
         control.get('value').should.equal('1');
       });

    it('should add the correct number of units when entered via text field',
       function() {
         var view = makeServiceView();
         var control = container.one('.num-units-control');
         control.set('value', 7);
         control.simulate('keydown', { keyCode: ENTER });
         var message = conn.last_message();
         message.op.should.equal('add_unit');
         message.service_name.should.equal('mysql');
         message.num_units.should.equal(4);
       });

    it('should add pending units as soon as it gets a reply back ' +
       'from the server',
       function() {
         var new_unit_id = 'mysql/5',
             view = makeServiceView(),
             control = container.one('.num-units-control'),
             expected_names = db.units.map(function(u) {return u.id;});
         expected_names.push(new_unit_id);
         expected_names.sort();
         control.set('value', 4);
         control.simulate('keydown', { keyCode: ENTER });
         var callbacks = Y.Object.values(env._txn_callbacks);
         callbacks.length.should.equal(1);
         // Since we don't have an app to listen to this event and tell the
         // view to re-render, we need to do it ourselves.
         db.on('update', view.render, view);
         callbacks[0]({result: [new_unit_id]});
         var db_names = db.units.map(function(u) {return u.id;});
         db_names.sort();
         db_names.should.eql(expected_names);
         service.get('unit_count').should.equal(4);
         var rendered_names = container.one(
         'ul.thumbnails').all('div.unit').get('id');
         assert.deepEqual(rendered_names, expected_names);
       });

    it('should remove units as soon as it gets a ' +
       'reply back from the server',
       function() {
         var view = makeServiceView();
         var control = container.one('.num-units-control');
         control.set('value', 2);
         control.simulate('keydown', { keyCode: ENTER });
         var callbacks = Y.Object.values(env._txn_callbacks);
         callbacks.length.should.equal(1);
         callbacks[0]({unit_names: ['mysql/2']});
         var _ = expect(db.units.getById('mysql/2')).to.not.exist;
       });

    it('should reset values on the control when you press escape',
       function() {
         var view = makeServiceView();
         var control = container.one('.num-units-control');
         control.set('value', 2);
         control.simulate('keydown', { keyCode: ESC });
         control.get('value').should.equal('3');
       });

    it('should reset values on the control when you change focus',
       function() {
         if (Y.UA.ie) {
           // TODO: blur simulate broken in IE
           return;
         }
         var view = makeServiceView();
         var control = container.one('.num-units-control');
         control.set('value', 2);
         control.simulate('blur');
         control.get('value').should.equal('3');
       });

    it('should reset values on the control when you type invalid value',
       function() {
         var view = makeServiceView();
         var control = container.one('.num-units-control');

         var pressKey = function(key) {
           control.set('value', key);
           control.simulate('keydown', { keyCode: ENTER });
           control.get('value').should.equal('3');
         };
         pressKey('a');
         pressKey('2w');
         pressKey('w2');
       });

    it('should send an expose RPC call when exposeService is invoked',
       function() {
          var view = makeServiceView();

          view.exposeService();
          conn.last_message().op.should.equal('expose');
       });

    it('should send an unexpose RPC call when unexposeService is invoked',
       function() {
          var view = makeServiceView();

          view.unexposeService();
          conn.last_message().op.should.equal('unexpose');
       });

    it('should invoke callback when expose RPC returns',
       function() {
          var view = makeServiceView();

         var test = function(selectorBefore, selectorAfter, callback) {
           console.log('Service is exposed: ' + service.get('exposed'));
           console.log('selectorBefore: ' + selectorBefore);
           console.log('selectorAfter: ' + selectorAfter);

           assert.isNotNull(container.one(selectorBefore));
           assert.isNull(container.one(selectorAfter));

           var dbUpdated = false;
           db.on('update', function() {
             dbUpdated = true;
           });
           callback({});
           // In the real code, the view should be updated by the db change
           // event. Here we should call it manually because we have no
           // "route" for this test.
           view.render();

           assert.isTrue(dbUpdated);
           assert.isNotNull(container.one(selectorAfter));
           assert.isNull(container.one(selectorBefore));
         };

         test('.exposeService', '.unexposeService',
              Y.bind(view._exposeServiceCallback, view));
         test('.unexposeService', '.exposeService',
              Y.bind(view._unexposeServiceCallback, view));
       });

    it('should show proper tabs initially', function() {
      var view = makeServiceView(),
          active_navtabs = [];
      container.all('.state-title').each(
          function(n) {
            active_navtabs.push([n.get('text').trim(),
                                 n.hasClass('active')]);
          });
      active_navtabs.should.eql(
          [['All', true],
           ['Running', false],
           ['Pending', false],
           ['Error', false]]);
    });

    it('should show zero running units when filtered', function() {
      // All units are pending.
      var view = makeServiceView({state: 'running'}),
          active_navtabs = [];
      container.all('.state-title').each(
          function(n) {
            active_navtabs.push([n.get('text').trim(),
                                 n.hasClass('active')]);
          });
      active_navtabs.should.eql(
          [['All', false],
           ['Running', true],
           ['Pending', false],
           ['Error', false]]);
      container.all('div.thumbnail').get('id').length.should.equal(0);
    });

    it('should show some running units when filtered', function() {
      db.units.getById('mysql/0').agent_state = 'started';
      // 1 is pending.
      db.units.getById('mysql/2').agent_state = 'started';
      var view = makeServiceView({state: 'running'});
      var rendered_names = container.one(
          'ul.thumbnails').all('div.unit').get('id');
      rendered_names.should.eql(['mysql/0', 'mysql/2']);
    });

    it('should show zero pending units when filtered', function() {
      db.units.getById('mysql/0').agent_state = 'install-error';
      db.units.getById('mysql/1').agent_state = 'error';
      db.units.getById('mysql/2').agent_state = 'started';
      var view = makeServiceView({state: 'pending'}),
          active_navtabs = [];
      container.all('.state-title').each(
          function(n) {
            active_navtabs.push([n.get('text').trim(),
                                 n.hasClass('active')]);
          });
      active_navtabs.should.eql(
          [['All', false],
           ['Running', false],
           ['Pending', true],
           ['Error', false]]);
      container.all('div.thumbnail').get('id').length.should.equal(0);
    });

    it('should show some pending units when filtered', function() {
      // 0 is pending already.
      db.units.getById('mysql/1').agent_state = 'started';
      // We include  installed with pending.
      db.units.getById('mysql/2').agent_state = 'installed';
      var view = makeServiceView({state: 'pending'});
      var rendered_names = container.one(
          'ul.thumbnails').all('div.unit').get('id');
      rendered_names.should.eql(['mysql/0', 'mysql/2']);
    });

    it('should show zero error units when filtered', function() {
      var view = makeServiceView({state: 'error'}),
          active_navtabs = [];
      container.all('.state-title').each(
          function(n) {
            active_navtabs.push([n.get('text').trim(),
                                 n.hasClass('active')]);
          });
      active_navtabs.should.eql(
          [['All', false],
           ['Running', false],
           ['Pending', false],
           ['Error', true]]);
      container.all('div.thumbnail').get('id').length.should.equal(0);
    });

    it('should show some error units when filtered', function() {
      // Any -error is included.
      db.units.getById('mysql/0').agent_state = 'install-error';
      // 1 is pending.
      db.units.getById('mysql/2').agent_state = 'foo-error';
      var view = makeServiceView({state: 'error'}),
          rendered_names = container.one(
          'ul.thumbnails').all('div.unit').get('id');
      rendered_names.should.eql(['mysql/0', 'mysql/2']);
    });

    it('should remove the relation when requested',
       function() {
         var service_name = service.get('id'),
             rel0 = new models.Relation(
         { id: 'relation-0',
           endpoints:
           [[service_name, {name: 'db', role: 'source'}],
            ['squid', {name: 'cache', role: 'front'}]],
           'interface': 'cache',
           scope: 'global'
         }),
             rel1 = new models.Relation(
             { id: 'relation-1',
               endpoints:
               [[service_name, {name: 'db', role: 'peer'}]],
               'interface': 'db',
               scope: 'global'
             });

         db.relations.add([rel0, rel1]);

         var view = makeServiceRelationsView(),
             control = container.one('button[value=relation-0]');
         control.simulate('click');
         var remove = container.one('#remove-modal-panel .btn-danger');
         remove.simulate('click');
         var message = conn.last_message();
         message.op.should.equal('remove_relation');
         remove.get('disabled').should.equal(true);
       });

    it('should remove peer relations when requested',
        function() {

          var service_name = service.get('id'),
              rel0 = new models.Relation(
                  { id: 'relation-0',
                    endpoints:
                    [[service_name, {name: 'db', role: 'source'}],
                     ['squid', {name: 'cache', role: 'front'}]],
                    'interface': 'cache',
                    scope: 'global'
                  }),
              rel1 = new models.Relation(
                  { id: 'relation-1',
                    endpoints:
                    [[service_name, {name: 'db', role: 'peer'}]],
                    'interface': 'db',
                    scope: 'global'
                  });

          db.relations.add([rel0, rel1]);

          var view = makeServiceRelationsView(),
              control = container.one('button[value=relation-1]');
          control.simulate('click');
          var remove = container.one('#remove-modal-panel .btn-danger');
          remove.simulate('click');
          var message = conn.last_message();
          message.op.should.equal('remove_relation');
          remove.get('disabled').should.equal(true);
        });

    it('should remove two consecutive relations when requested',
        function() {
          // This shows that the panel buttons are not reused, after being
          // incorrectly bound.
          var service_name = service.get('id'),
              rel0 = new models.Relation(
                  { id: 'relation-0',
                    endpoints:
                    [[service_name, {name: 'db', role: 'source'}],
                     ['squid', {name: 'cache', role: 'front'}]],
                    'interface': 'cache',
                    scope: 'global'
                  }),
              rel1 = new models.Relation(
                  { id: 'relation-1',
                    endpoints:
                    [[service_name, {name: 'db', role: 'peer'}]],
                    'interface': 'db',
                    scope: 'global'
                  });

          db.relations.add([rel0, rel1]);
          db.relations.get_relations_for_service(
         service).length.should.equal(2);

          var view = makeServiceRelationsView(),
              control = container.one('button[value=relation-0]');
          control.simulate('click');
          var remove = container.one('#remove-modal-panel .btn-danger');
          remove.simulate('click');
          env.dispatch_result(conn.last_message());
          db.relations.get_relations_for_service(
         service).length.should.equal(1);

          control = container.one('button[value=relation-1]');
          control.simulate('click');
          remove = container.one('#remove-modal-panel .btn-danger');
          remove.simulate('click');
          env.dispatch_result(conn.last_message());
          db.relations.get_relations_for_service(
         service).length.should.equal(0);
        });

    it('should highlight the correct relation when passed as the query ' +
       'string', function() {
          var service_name = service.get('id'),
              rel0 = new models.Relation(
                  { id: 'relation-0',
                    endpoints:
                    [[service_name, {name: 'db', role: 'source'}],
                          ['squid', {name: 'cache', role: 'front'}]],
                    'interface': 'cache',
                    scope: 'global'
                  }),
              rel1 = new models.Relation(
                  { id: 'relation-1',
                    endpoints:
                    [[service_name, {name: 'db', role: 'peer'}]],
                    'interface': 'db',
                    scope: 'global'
                  });

          db.relations.add([rel0, rel1]);
          var querystringValue = utils.generateSafeDOMId('relation-0'),
              view = makeServiceRelationsView({rel_id: querystringValue}),
              row = container.one('.highlighted');
          row.one('a').getHTML().should.equal('squid');
          row.one('.btn').get('disabled').should.equal(false);
        });

    it('should handle errors properly in the callback',
        function() {
          var service_name = service.get('id'),
              rel0 = new models.Relation(
                  { id: 'relation-0',
                    endpoints:
                    [[service_name, {name: 'db', role: 'source'}],
                          ['squid', {name: 'cache', role: 'front'}]],
                    'interface': 'cache',
                    scope: 'global'
                  }),
              rel1 = new models.Relation(
                  { id: 'relation-1',
                    endpoints:
                    [[service_name, {name: 'db', role: 'peer'}]],
                    'interface': 'db',
                    scope: 'global'
                  });
          db.relations.add([rel0, rel1]);
          var view = makeServiceRelationsView(),
              control = container.one('button[value=relation-0]');
          control.simulate('click');
          var remove = container.one('#remove-modal-panel .btn-danger');
          remove.simulate('click');

          var callbacks = Y.Object.values(env._txn_callbacks);
          callbacks.length.should.equal(1);
          var existing_notice_count = db.notifications.size();
          callbacks[0](
              { err: true, endpoint_a: service_name,
                endpoint_b: 'squid'});
          remove.get('disabled').should.equal(false);
          db.notifications.size().should.equal(existing_notice_count + 1);
          var row = control.ancestor('tr');
          var _ = expect(row.one('.highlighted')).to.not.exist;
        });

    it('should filter units with relation errors', function() {
      var units = [{
        agent_state: 'started'
      }, {
        agent_state: 'started',
        relation_errors: {}
      }, {
        testKey: 'error1',
        agent_state: 'started',
        relation_errors: {
          a: '',
          b: ''
        }
      }, {
        agent_state: 'pending',
        relation_errors: {
          a: '',
          b: ''
        }
      }, {
        testKey: 'error2',
        agent_state: 'error'
      }], filtered = views.service.prototype.filterUnits('error', units);

      assert.equal(2, filtered.length);
      assert.equal('error1', filtered[0].testKey);
      assert.equal('error2', filtered[1].testKey);
    });

    it('tells the template if the service is the GUI (service)', function() {
      var view = makeServiceView();
      var renderData = view.gatherRenderData();
      assert.equal(renderData.serviceIsJujuGUI, false);
    });

    it('tells the template if the service is the GUI (relations)', function() {
      // This would ideally be in its own suite; see the XXX at top of this
      // file.
      var view = makeServiceRelationsView();
      var renderData = view.gatherRenderData();
      assert.equal(renderData.serviceIsJujuGUI, false);
    });

    it('loading message if the service is not loaded (service)', function() {
      var view = new Y.juju.views.service();
      view.render();
      var html = view.get('container').getHTML();
      assert.match(html, /Loading/);
    });

    it('loading message if the service is not loaded (relations)', function() {
      // This would ideally be in its own suite; see the XXX at top of this
      // file.
      var view = new Y.juju.views.service_relations();
      view.render();
      var html = view.get('container').getHTML();
      assert.match(html, /Loading/);
    });

    // Test for destroying services.
    it('should destroy the service when "Destroy Service" is clicked',
       function() {
         var view = makeServiceView();
         var control = container.one('#destroy-service');
         control.simulate('click');
         var destroy = container.one('#destroy-modal-panel .btn-danger');
         destroy.simulate('click');
         var message = conn.last_message();
         message.op.should.equal('destroy_service');
         destroy.get('disabled').should.equal(true);
       });

    it('should remove the service from the db after server ack',
       function() {
         var view = makeServiceView();
         db.relations.add(
         [new models.Relation({id: 'relation-0000000000',
            endpoints: [['mysql', {}], ['wordpress', {}]]}),
          new models.Relation({id: 'relation-0000000001',
            endpoints: [['squid', {}], ['apache', {}]]})]);
         var control = container.one('#destroy-service');
         control.simulate('click');
         var destroy = container.one('#destroy-modal-panel .btn-danger');
         destroy.simulate('click');
         var called = false;
         view.on('navigateTo', function(ev) {
           assert.equal('/:gui:/', ev.url);
           called = true;
         });
         var callbacks = Y.Object.values(env._txn_callbacks);
         callbacks.length.should.equal(1);
         var dbUpdated = false;
         db.on('update', function() {
           dbUpdated = true;
         });
         callbacks[0]({result: true});
         var _ = expect(db.services.getById(service.get('id'))).to.not.exist;
         db.relations.map(function(u) {return u.get('id');})
        .should.eql(['relation-0000000001']);
         // Catch show environment event.
         called.should.equal(true);
         // The db should be updated.
         dbUpdated.should.equal(true);
       });
  });
})();
