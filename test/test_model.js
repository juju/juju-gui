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

describe('Charm initialization', function() {
  var models;

  before(function(done) {
    YUI(GlobalConfig).use('juju-models', 'juju-charm-models', function(Y) {
      models = Y.namespace('juju.models');
      done();
    });
  });

  it('must be able to create Charm', function() {
    var charm = new models.Charm(
        {id: 'cs:~alt-bac/precise/openstack-dashboard-0'});
    charm.get('scheme').should.equal('cs');
    charm.get('owner').should.equal('alt-bac');
    charm.get('series').should.equal('precise');
    charm.get('package_name').should.equal('openstack-dashboard');
    charm.get('revision').should.equal(0);
    charm.get('full_name').should.equal(
        '~alt-bac/precise/openstack-dashboard');
    charm.get('charm_path').should.equal(
        '~alt-bac/precise/openstack-dashboard-0/json');
  });

  it('must not set "owner" for promulgated charms', function() {
    var charm = new models.Charm({
      id: 'cs:precise/openstack-dashboard-0'
    });
    assert.isUndefined(charm.get('owner'));
  });

  it('must be able to parse hyphenated owner names', function() {
    // Note that an earlier version of the parsing code did not handle
    // hyphens in user names, so this test intentionally includes one.
    var charm = new models.Charm(
        {id: 'cs:~marco-ceppi/precise/wordpress-17'});
    charm.get('full_name').should.equal('~marco-ceppi/precise/wordpress');
  });

  it('must reject bad charm ids.', function() {
    try {
      /* jshint -W031 */
      new models.Charm({id: 'foobar'});
      /* jshint +W031 */
      assert.fail('Should have thrown an error');
    } catch (e) {
      e.should.equal(
          'Developers must initialize charms with a well-formed id.');
    }
  });


  it('must reject missing charm ids at initialization.', function() {
    try {
      /* jshint -W031 */
      new models.Charm();
      /* jshint +W031 */
      assert.fail('Should have thrown an error');
    } catch (e) {
      e.should.equal(
          'Developers must initialize charms with a well-formed id.');
    }
  });

  it('must convert timestamps into time objects on Charm', function() {
    var time = 1349797266.032,
        date = new Date(time),
        charm = new models.Charm(
        { id: 'cs:precise/foo-9', last_change: {created: time / 1000} });
    charm.get('last_change').created.should.eql(date);
  });
});

describe('juju models', function() {
  var models, yui;

  before(function(done) {
    YUI(GlobalConfig).use('juju-models', 'juju-charm-models', function(Y) {
      models = Y.namespace('juju.models');
      yui = Y;
      done();
    });
  });

  beforeEach(function() {
    window._gaq = [];
  });

  it('service unit list should be able to get units of a given service',
      function() {
        var sl = new models.ServiceList();
        var sul = new models.ServiceUnitList();
        var mysql = new models.Service({id: 'mysql'});
        var wordpress = new models.Service({id: 'wordpress'});
        sl.add([mysql, wordpress]);
        sl.getById('mysql').should.equal(mysql);
        sl.getById('wordpress').should.equal(wordpress);

        sul.add([{id: 'mysql/0'}, {id: 'mysql/1'}]);

        var wp0 = {id: 'wordpress/0'};
        var wp1 = {id: 'wordpress/1'};
        sul.add([wp0, wp1]);
        wp0.service.should.equal('wordpress');

        sul.get_units_for_service(mysql, true).getAttrs(['id']).id.should.eql(
           ['mysql/0', 'mysql/1']);
        sul.get_units_for_service(wordpress, true).getAttrs(
           ['id']).id.should.eql(['wordpress/0', 'wordpress/1']);
      });

  it('service unit list should be able to aggregate unit statuses',
      function() {
        var sl = new models.ServiceList();
        var sul = new models.ServiceUnitList();
        var mysql = new models.Service({id: 'mysql'});
        var wordpress = new models.Service({id: 'wordpress'});
        sl.add([mysql, wordpress]);

        var my0 = new models.ServiceUnit({
          id: 'mysql/0',
          agent_state: 'pending'});
        var my1 = new models.ServiceUnit({
          id: 'mysql/1',
          agent_state: 'pending'});

        sul.add([my0, my1]);

        var wp0 = new models.ServiceUnit({
          id: 'wordpress/0',
          agent_state: 'pending'});
        var wp1 = new models.ServiceUnit({
          id: 'wordpress/1',
          agent_state: 'error'});
        sul.add([wp0, wp1]);

        assert.deepEqual(sul.get_informative_states_for_service(mysql),
            [{'pending': 2}, {}]);
        assert.deepEqual(sul.get_informative_states_for_service(wordpress),
            [{'pending': 1, 'error': 1}, {}]);
      });

  it('service unit list should update analytics when units are added',
      function() {
        var sl = new models.ServiceList();
        var sul = new models.ServiceUnitList();
        var mysql = new models.Service({id: 'mysql'});
        sl.add([mysql]);
        var my0 = new models.ServiceUnit({
          id: 'mysql/0',
          agent_state: 'pending'});
        var my1 = new models.ServiceUnit({
          id: 'mysql/1',
          agent_state: 'pending'});

        window._gaq.should.eql([]);
        sul.add([my0]);
        sul.update_service_unit_aggregates(mysql);
        window._gaq.pop().should.eql(['_trackEvent', 'Service Stats', 'Update',
          'mysql', 1]);
        sul.add([my1]);
        sul.update_service_unit_aggregates(mysql);
        window._gaq.pop().should.eql(['_trackEvent', 'Service Stats', 'Update',
          'mysql', 2]);
        // Calling update with no additions does not create a new trackEvent.
        sul.update_service_unit_aggregates(mysql);
        window._gaq.should.eql([]);
      });

  it('services have unit and relation modellists', function() {
    var service = new models.Service();
    assert.equal(service.get('units') instanceof models.ServiceUnitList, true);
    assert.equal(service.get('relations') instanceof models.RelationList, true);
  });

  it('relation changes on service update aggregateRelations', function(done) {
    var service = new models.Service();
    var relations = service.get('relations');
    var handler = relations.on(
        '*:add', function() {
          // This means that it will update the aggregate
          // relations for databinding
          handler.detach();
          var isObject = yui.Lang.isObject;
          assert.equal(isObject(service.get('aggregateRelations')), true);
          done();
        });
    relations.add(new models.Relation());
  });

  it('service unit objects should parse the service name from unit id',
      function() {
        var service_unit = {id: 'mysql/0'};
        var db = new models.Database();
        db.units.add(service_unit);
        service_unit.service.should.equal('mysql');
      });

  it('service unit objects should report their number correctly',
      function() {
        var service_unit = {id: 'mysql/5'};
        var db = new models.Database();
        db.units.add(service_unit);
        service_unit.number.should.equal(5);
      });

  it('must be able to resolve models by modelid', function() {
    var db = new models.Database();

    db.services.add([{id: 'wordpress'}, {id: 'mediawiki'}]);
    db.units.add([{id: 'wordpress/0'}, {id: 'wordpress/1'}]);

    var model = db.services.item(0);
    // single parameter calling
    db.getModelById([model.name, model.get('id')])
              .get('id').should.equal('wordpress');
    // two parameter interface
    db.getModelById(model.name, model.get('id'))
              .get('id').should.equal('wordpress');

    var unit = db.units.item(0);
    db.getModelById([unit.name, unit.id]).id.should.equal('wordpress/0');
    db.getModelById(unit.name, unit.id).id.should.equal('wordpress/0');
  });

  it('must be able to resolve models by their name', function() {
    var db = new models.Database();

    db.services.add([{id: 'wordpress'}, {id: 'mediawiki'}]);
    db.units.add([{id: 'wordpress/0'}, {id: 'wordpress/1'}]);

    var model = db.services.item(0);
    // Single parameter calling
    db.resolveModelByName(model.get('id'))
              .get('id').should.equal('wordpress');
    // Two parameter interface
    db.resolveModelByName(model.get('id'))
              .get('id').should.equal('wordpress');

    var unit = db.units.item(0);
    db.resolveModelByName(unit.id).id.should.equal('wordpress/0');

    db.resolveModelByName('env').should.equal(db.environment);

    var machine = db.machines.add({machine_id: '0'});
    db.resolveModelByName('0').should.equal(machine);
  });

  it('should update service units on change', function() {
    var db = new models.Database();
    var mysql = new models.Service({id: 'mysql'});
    db.services.add([mysql]);
    assert.equal(mysql.get('units') instanceof models.ServiceUnitList, true);
    db.onDelta({data: {result: [
      ['unit', 'add', {id: 'mysql/0', agent_state: 'pending'}],
      ['unit', 'add', {id: 'mysql/1', agent_state: 'pending'}]
    ]}});
    assert.equal(mysql.get('units').size(), 2);
    db.onDelta({data: {result: [
      ['unit', 'remove', 'mysql/1']
    ]}});
    assert.equal(mysql.get('units').size(), 1);
  });

  it('onDelta should handle remove changes correctly',
      function() {
        var db = new models.Database();
        var my0 = new models.ServiceUnit({id: 'mysql/0',
          agent_state: 'pending'});
        var my1 = new models.ServiceUnit({id: 'mysql/1',
          agent_state: 'pending'});
        db.units.add([my0, my1]);
        db.onDelta({data: {result: [
          ['unit', 'remove', 'mysql/1']
        ]}});
        var names = db.units.get('id');
        names.length.should.equal(1);
        names[0].should.equal('mysql/0');
      });

  it('onDelta should be able to reuse existing services with add',
      function() {
        var db = new models.Database();
        var my0 = new models.Service({id: 'mysql', exposed: true});
        db.services.add([my0]);
        // Note that exposed is not set explicitly to false.
        db.onDelta({data: {result: [
          ['service', 'add', {id: 'mysql'}]
        ]}});
        my0.get('exposed').should.equal(false);
      });

  it('onDelta should be able to reuse existing units with add',
      // Units are special because they use the LazyModelList.
      function() {
        var db = new models.Database();
        var my0 = {id: 'mysql/0', agent_state: 'pending'};
        db.units.add([my0]);
        db.onDelta({data: {result: [
          ['unit', 'add', {id: 'mysql/0', agent_state: 'another'}]
        ]}});
        my0.agent_state.should.equal('another');
      });

  // We no longer use relation_errors but this test should remain until it's
  // completely removed from the codebase.
  it.skip('onDelta should reset relation_errors',
      function() {
        var db = new models.Database();
        var my0 = {id: 'mysql/0', relation_errors: {'cache': ['memcached']}};
        db.units.add([my0]);
        // Note that relation_errors is not set.
        db.onDelta({data: {result: [
          ['unit', 'change', {id: 'mysql/0'}]
        ]}});
        my0.relation_errors.should.eql({});
      });

  it('ServiceUnitList should accept a list of units at instantiation and ' +
      'decorate them', function() {
        var mysql = new models.Service({id: 'mysql'});
        var objs = [{id: 'mysql/0'},
                    {id: 'mysql/1'}];
        var sul = new models.ServiceUnitList({items: objs});
        var unit_data = sul.get_units_for_service(
                mysql, true).getAttrs(['service', 'number']);
        unit_data.service.should.eql(['mysql', 'mysql']);
        unit_data.number.should.eql([0, 1]);
      });

  it('RelationList.has_relations.. should return true if rel found.',
      function() {
        var db = new models.Database(),
            service = new models.Service({id: 'mysql', exposed: false}),
            rel0 = new models.Relation({
              id: 'relation-0',
              endpoints: [
                ['mediawiki', {name: 'cache', role: 'source'}],
                ['squid', {name: 'cache', role: 'front'}]],
              'interface': 'cache'
            }),
            rel1 = new models.Relation({
              id: 'relation-4',
              endpoints: [
                ['something', {name: 'foo', role: 'bar'}],
                ['mysql', {name: 'la', role: 'lee'}]],
              'interface': 'thing'
            });
        db.relations.add([rel0, rel1]);
        db.relations.has_relation_for_endpoint(
            {service: 'squid', name: 'cache', type: 'cache'}
        ).should.equal(true);
        db.relations.has_relation_for_endpoint(
            {service: 'mysql', name: 'la', type: 'thing'}
        ).should.equal(true);
        db.relations.has_relation_for_endpoint(
            {service: 'squid', name: 'cache', type: 'http'}
        ).should.equal(false);

        // We can also pass a service name which must match for the
        // same relation.

        db.relations.has_relation_for_endpoint(
            {service: 'squid', name: 'cache', type: 'cache'},
            'kafka'
        ).should.equal(false);

        db.relations.has_relation_for_endpoint(
            {service: 'squid', name: 'cache', type: 'cache'},
            'mediawiki'
        ).should.equal(true);

      });

  it('RelationList.get_relations_for_service should do what it says',
      function() {
        var db = new models.Database(),
            service = new models.Service({id: 'mysql', exposed: false}),
            rel0 = new models.Relation(
            { id: 'relation-0',
              endpoints:
         [['mediawiki', {name: 'cache', role: 'source'}],
          ['squid', {name: 'cache', role: 'front'}]],
              'interface': 'cache'
            }),
            rel1 = new models.Relation(
            { id: 'relation-1',
              endpoints:
         [['wordpress', {role: 'peer', name: 'loadbalancer'}]],
              'interface': 'reversenginx'
            }),
            rel2 = new models.Relation(
            { id: 'relation-2',
              endpoints:
         [['mysql', {name: 'db', role: 'db'}],
          ['mediawiki', {name: 'storage', role: 'app'}]],
              'interface': 'db'
            }),
            rel3 = new models.Relation(
            { id: 'relation-3',
              endpoints:
         [['mysql', {role: 'peer', name: 'loadbalancer'}]],
              'interface': 'mysql-loadbalancer'
            }),
            rel4 = new models.Relation(
            { id: 'relation-4',
              endpoints:
         [['something', {name: 'foo', role: 'bar'}],
          ['mysql', {name: 'la', role: 'lee'}]],
              'interface': 'thing'
            });
        db.relations.add([rel0, rel1, rel2, rel3, rel4]);
        db.relations.get_relations_for_service(service).map(
       function(r) { return r.get('id'); })
            .should.eql(['relation-2', 'relation-3', 'relation-4']);
      });

  it('must be able to reference the Environment model', function() {
    var db = new models.Database();
    var env = db.environment;
    env.get('annotations').should.eql({});
  });

  it('returns a display name for a service', function() {
    var service = new models.Service({id: 'mysql', exposed: false});
    assert.equal(service.get('displayName'), 'mysql');
    service = new models.Service({id: 'service-mysql', exposed: false});
    assert.equal(service.get('displayName'), 'mysql');
  });

  it('updates the display name when the id changes', function() {
    var service = new models.Service({id: 'service-mysql', exposed: false});
    assert.equal(service.get('displayName'), 'mysql');
    service.set('id', 'service-flibbertigibbet');
    assert.equal('flibbertigibbet', service.get('displayName'));
  });

  it('returns a display name for a unit', function() {
    var units = new models.ServiceUnitList();
    assert.equal('mysql/0', units.createDisplayName('unit-mysql-0'));
    assert.equal('mysql/0', units.createDisplayName('mysql/0'));
  });

  it('returns a display name for a machine', function() {
    var machines = new models.MachineList();
    assert.equal('0', machines.createDisplayName('machine-0'));
    assert.equal('0', machines.createDisplayName('0'));
  });
});

describe('Charm load', function() {
  var Y, models, conn, env, app, container, fakeStore, data, juju;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-models', 'juju-gui', 'datasource-local',
                               'juju-tests-utils', 'json-stringify',
                               'juju-charm-store'], function(Y) {
      models = Y.namespace('juju.models');
      juju = Y.namespace('juju');
      done();
    });
  });

  beforeEach(function() {
    conn = new (Y.namespace('juju-tests.utils')).SocketStub();
    env = juju.newEnvironment({conn: conn});
    env.connect();
    conn.open();
    container = Y.Node.create('<div id="test" class="container"></div>');
    data = [];
    fakeStore = new Y.juju.charmworld.APIv2({});
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        params.callback.success({
          response: {
            results: [{
              responseText: data
            }]
          }
        });
      }
    });
  });

  afterEach(function() {
    container.destroy();
  });

  it('will throw an exception with non-read sync', function() {
    var charm = new models.Charm({id: 'local:precise/foo-4'});
    try {
      charm.sync('create');
      assert.fail('Should have thrown an error');
    } catch (e) {
      e.should.equal('Only use the "read" action; "create" not supported.');
    }
    try {
      charm.sync('update');
      assert.fail('Should have thrown an error');
    } catch (e) {
      e.should.equal('Only use the "read" action; "update" not supported.');
    }
    try {
      charm.sync('delete');
      assert.fail('Should have thrown an error');
    } catch (e) {
      e.should.equal('Only use the "read" action; "delete" not supported.');
    }
  });

  it('throws an error if you do not pass get_charm',
     function() {
       var charm = new models.Charm({id: 'local:precise/foo-4'});
       try {
         charm.sync('read', {});
         assert.fail('Should have thrown an error');
       } catch (e) {
         e.should.equal(
         'You must supply a get_charm function.');
       }
       try {
         charm.sync('read', {env: 42});
         assert.fail('Should have thrown an error');
       } catch (e) {
         e.should.equal(
         'You must supply a get_charm function.');
       }
     });

  it('must send request to juju environment for local charms', function() {
    var charm = new models.Charm({id: 'local:precise/foo-4'}).load(env);
    assert(!charm.loaded);
    assert.equal('CharmInfo', conn.last_message().Request);
  });

  it('must handle success from local charm request', function(done) {
    var charm = new models.Charm({id: 'local:precise/foo-4'}).load(
        env,
        function(err, response) {
          assert(!err);
          assert.equal('wowza', charm.get('summary'));
          assert(charm.loaded);
          done();
        });
    var response = {
      RequestId: conn.last_message().RequestId,
      Response: {Meta: {Summary: 'wowza'}, Config: {}}
    };
    env.dispatch_result(response);
    // The test in the callback above should run.
  });

  it('parses charm model options correctly', function(done) {
    var charm = new models.Charm({id: 'local:precise/foo-4'}).load(
        env,
        function(err, response) {
          assert(!err);
          // This checks to make sure the parse mechanism is working properly
          // for both the old ane new charm browser.
          var option = charm.get('options').default_log;
          assert.equal('global', option['default']);
          assert.equal('Default log', option.description);
          done();
        });
    var response = {
      RequestId: conn.last_message().RequestId,
      Response: {
        Meta: {},
        Config: {
          Options: {
            default_log: {
              Default: 'global',
              Description: 'Default log',
              Type: 'string'
            }
          }
        }
      }
    };
    env.dispatch_result(response);
    // The test in the callback above should run.
  });

  it('must handle failure from local charm request', function(done) {
    var charm = new models.Charm({id: 'local:precise/foo-4'}).load(
        env,
        function(err, response) {
          assert(err);
          assert(response.err);
          assert(!charm.loaded);
          done();
        });
    var response = {
      RequestId: conn.last_message().RequestId,
      Error: 'error'
    };
    env.dispatch_result(response);
    // The test in the callback above should run.
  });
});

describe('Charm test', function() {
  var data, instance, models, origData, relatedData, sampleData, utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'io',
      'juju-charm-models',
      'juju-tests-utils'
    ], function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      sampleData = Y.io('data/browsercharm.json', {sync: true});
      origData = Y.JSON.parse(sampleData.responseText);
      // relatedData is never mutated so it can be used directly.
      relatedData = utils.loadFixture('data/related.json', true).result;
      done();
    });
  });

  beforeEach(function() {
    data = Y.clone(origData);
  });

  afterEach(function() {
    if (instance) {
      instance.destroy();
    }
  });

  it('maps api downloads in 30 days to recent downloads', function() {
    data.charm.downloads_in_past_30_days = 10;
    instance = new models.Charm(data.charm);
    instance.get('recent_download_count').should.eql(10);
  });

  it('maps relations to keep with the original charm model', function() {
    instance = new models.Charm(data.charm);
    var requires = instance.get('requires');
    // Interface is quoted for lint purposes.
    requires.balancer['interface'].should.eql('http');

    var provides = instance.get('provides');
    provides.website['interface'].should.eql('http');
  });

  it('maps revisions nicely for us with converted dates', function() {
    instance = new models.Charm(data.charm);
    var commits = instance.get('recent_commits');
    commits.length.should.equal(10);

    // Check that our commits have the right keys constructed from the api
    // data provided.
    var sample = commits[0];
    assert(Y.Object.hasKey(sample, 'author'));
    assert(Y.Object.hasKey(sample, 'date'));
    assert(Y.Object.hasKey(sample, 'message'));
    assert(Y.Object.hasKey(sample, 'revno'));

    // Commits should be ordered new to old.
    var checkDate = new Date();
    Y.Array.each(commits, function(commit) {
      assert(checkDate > commit.date);
      checkDate = commit.date;
    });
  });

  it('must be able to determine if an icon should be shown', function() {
    var approved_with_icon = new models.Charm({
      id: 'cs:precise/mysql-2',
      is_approved: true,
      files: ['icon.svg']
    });
    var approved_without_icon = new models.Charm({
      id: 'cs:precise/mysql-2',
      is_approved: true,
      files: []
    });
    var unapproved_with_icon = new models.Charm({
      id: 'cs:precise/mysql-2',
      is_approved: false,
      files: ['icon.svg']
    });
    var unapproved_without_icon = new models.Charm({
      id: 'cs:precise/mysql-2',
      is_approved: false,
      files: []
    });
    assert.isTrue(approved_with_icon.get('shouldShowIcon'));
    assert.isFalse(approved_without_icon.get('shouldShowIcon'));
    assert.isFalse(unapproved_with_icon.get('shouldShowIcon'));
    assert.isFalse(unapproved_without_icon.get('shouldShowIcon'));
  });

  it('tracks recent commits in the last 30 days', function() {
    instance = new models.Charm(data.charm);
    var commits = instance.get('recent_commits'),
        today = new Date();

    // adjust the dates on there manually because the tests will be run on
    // different days throwing things off.
    Y.each([0, 1, 2], function(index) {
      commits[index].date = new Date();
      commits[index].date.setDate(today.getDate() - (1 + index));
    });
    instance.get('recent_commit_count').should.equal(3);
  });

  it('tracks the total commits of the charm', function() {
    instance = new models.Charm(data.charm);
    assert.equal(instance.get('commitCount'), 44);
  });

  it('provides a providers attr', function() {
    // The charm details needs the failing providers generated from the list
    // of tested_providers.
    data.charm.tested_providers = {
      'ec2': 'SUCCESS',
      'local': 'FAILURE',
      'openstack': 'FAILURE'
    };
    instance = new models.Charm(data.charm);
    instance.get('providers').should.eql(
        {successes: ['ec2'], failures: ['local', 'openstack']});
  });

  // Testing a private method because if this test fails it'll provide a much
  // nicer hint as to why something in a View or such doesn't work correctly.
  // The api data that we get must be converted into what the
  // CharmMode.getAttrs() would have sent out to the token widget.
  it('maps related data to the model-ish api', function() {
    var providesData = relatedData.provides.http[0];
    instance = new models.Charm(data.charm);
    var converted = instance._convertRelatedData(providesData);
    assert.equal(providesData.name, converted.name);
    assert.equal(providesData.id, converted.storeId);
    assert.equal(
        providesData.commits_in_past_30_days,
        converted.recent_commit_count);
    assert.equal(
        providesData.downloads_in_past_30_days,
        converted.recent_download_count);
    assert.equal(
        providesData.downloads,
        converted.downloads);
    assert.equal(providesData.has_icon, converted.shouldShowIcon);
    assert.equal(converted.is_approved, providesData.is_approved);
  });

  it('builds proper relatedCharms object', function() {
    instance = new models.Charm(data.charm);
    instance.buildRelatedCharms(relatedData.provides, relatedData.requires);
    var relatedObject = instance.get('relatedCharms');

    // The overall should have the default 5 max charms listed.
    assert.equal(5, relatedObject.overall.length);
    // The requires for mysql should be truncated to the max of 5 as well.
    assert.equal(5, relatedObject.requires.http.length);
    // There's only one key in the provides section.
    assert.equal(1, Y.Object.keys(relatedObject.provides).length);

    // The overall should be sorted by their weights.
    var weights = relatedObject.overall.map(function(charm) {
      return charm.weight;
    });
    assert.equal(weights.sort(), weights);
  });
});

describe('database import/export', function() {
  var Y, models, utils;
  var fakeStore, db;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-models',
      'juju-tests-utils',
      'juju-charm-store',
      'juju-charm-models'],
    function(Y) {
      utils = Y.namespace('juju-tests.utils');
      models = Y.namespace('juju.models');
      done();
    });
  });

  beforeEach(function() {
    db = new models.Database();
    fakeStore = utils.makeFakeStore();
    fakeStore.iconpath = function() {return 'fake url';};
  });

  it('can export in deployer format', function() {
    db.services.add({id: 'mysql', charm: 'precise/mysql-1'});
    db.services.add({
      id: 'wordpress',
      charm: 'precise/wordpress-1',
      config: {debug: 'no', username: 'admin'},
      annotations: {'gui-x': 100, 'gui-y': 200, 'ignored': true}
    });
    db.relations.add({
      id: 'relation-0',
      endpoints: [
        ['mysql', {name: 'db', role: 'server'}],
        ['wordpress', {name: 'app', role: 'client'}]],
      'interface': 'db'
    });

    db.environment.set('defaultSeries', 'precise');

    // Add the charms so we can resolve them in the export.
    db.charms.add([{id: 'precise/mysql-1'},
          {id: 'precise/wordpress-1',
            config: {
              options: {
                debug: {
                  'default': 'no'
                },
                username: {
                  'default': 'root'
                }
              }
            }
          }
        ]);
    var result = db.exportDeployer().envExport;
    var relation = result.relations[0];

    assert.equal(result.series, 'precise');
    assert.equal(result.services.mysql.charm, 'precise/mysql-1');
    assert.equal(result.services.wordpress.charm, 'precise/wordpress-1');

    // A default config value is skipped
    assert.equal(result.services.wordpress.options.debug, undefined);
    // A value changed from the default is exported
    assert.equal(result.services.wordpress.options.username, 'admin');
    // Ensure that mysql has no options object in the export as no
    // non-default options are defined
    assert.equal(result.services.mysql.options, undefined);

    // Export position annotations.
    assert.equal(result.services.wordpress.annotations['gui-x'], 100);
    assert.equal(result.services.wordpress.annotations['gui-y'], 200);
    // Note that ignored wasn't exported.
    assert.equal(result.services.wordpress.annotations.ignored, undefined);

    assert.equal(relation[0], 'mysql:db');
    assert.equal(relation[1], 'wordpress:app');
  });
});

describe('service models', function() {
  var models, list, django, rails, wordpress, mysql;

  before(function(done) {
    YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      done();
    });
  });

  beforeEach(function() {
    window._gaq = [];
    django = new models.Service({id: 'django'});
    rails = new models.Service({
      id: 'rails',
      life: 'dying',
      aggregated_status: {}
    });
    wordpress = new models.Service({
      id: 'wordpress',
      life: 'dying',
      aggregated_status: {error: 42}
    });
    mysql = new models.Service({
      id: 'mysql',
      life: 'dead',
      aggregated_status: {error: 0}
    });
    list = new models.ServiceList({items: [rails, django, wordpress, mysql]});
  });

  it('instances identify if they are alive', function() {
    // This test also verifies that the default state is "alive".
    assert.isTrue(django.isAlive());
  });

  it('instances identify if they are not alive (dying or dead)', function() {
    assert.isFalse(rails.isAlive(), rails.get('id'));
    assert.isFalse(wordpress.isAlive(), wordpress.get('id'));
    assert.isFalse(mysql.isAlive(), mysql.get('id'));
  });

  it('instances identify if they have errors', function() {
    assert.isTrue(wordpress.hasErrors());
  });

  it('instances identify if they do not have errors', function() {
    assert.isFalse(django.hasErrors(), django.get('id'));
    assert.isFalse(rails.hasErrors(), rails.get('id'));
    assert.isFalse(mysql.hasErrors(), mysql.get('id'));
  });

  it('can be filtered so that it returns only visible models', function() {
    var filtered = list.visible();
    assert.strictEqual(2, filtered.size());
    assert.deepEqual([django, wordpress], filtered.toArray());
  });

});
