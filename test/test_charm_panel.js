'use strict';

describe('charm panel', function() {
  var Y, models, views, juju, ENTER,
      searchResult = '{"results": [{"data_url": "this is my URL", ' +
      '"name": "membase", "series": "precise", "summary": ' +
      '"Membase Server", "relevance": 8.728194117350437, ' +
      '"owner": "charmers", "store_url": "cs:precise/membase-6"}]}';

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-models',
        'juju-views',
        'juju-gui',
        'juju-env',
        'juju-tests-utils',
        'node-event-simulate',
        'node',
        'event-key',
        'juju-charm-store',

        function(Y) {
          models = Y.namespace('juju.models');
          views = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
          done();
        });

  });

  beforeEach(function() {
    // The charms panel needs these elements
    var docBody = Y.one(document.body);
    Y.Node.create('<div id="charm-search-test">' +
        '<div id="charm-search-icon"><i></i></div>' +
        '<div id="content"></div>' +
        '<input type="text" id="charm-search-field" />' +
        '</div>').appendTo(docBody);
  });

  afterEach(function() {
    Y.namespace('juju.views').CharmPanel.killInstance();
    Y.one('#charm-search-test').remove(true);
  });

  it('must be able to show and hide the panel', function() {
    var panel = Y.namespace('juju.views').CharmPanel
          .getInstance({
          testing: true,
          app: { views: { environment: {}}}
        }),
        container = panel.node;
    container.getStyle('display').should.equal('none');
    panel.show();
    container.getStyle('display').should.equal('block');
    panel.hide();
    container.getStyle('display').should.equal('none');
    panel.toggle();
    container.getStyle('display').should.equal('block');
    panel.toggle();
    container.getStyle('display').should.equal('none');
  });

  it('must be able to search', function() {
    var searchTriggered = false,
        panel = Y.namespace('juju.views').CharmPanel.getInstance({
          charm_store: new juju.CharmStore({datasource: {
            sendRequest: function(params) {
              searchTriggered = true;
              // Stubbing the server callback value
              params.callback.success({
                response: {
                  results: [{
                    responseText: searchResult
                  }]
                }
              });
            }
          }}),
          testing: true,
          app: { views: { environment: {} } }
        }),
        node = panel.node;
    panel.show(true);
    var field = Y.one('#charm-search-field');
    field.set('value', 'aaa');
    field.simulate('keydown', { keyCode: ENTER });

    searchTriggered.should.equal(true);
    node.one('.charm-entry .btn.deploy').getData('url').should.equal(
        'cs:precise/membase-6');
  });

  it('must be able to trigger charm details', function() {
    var db = new models.Database(),
        panel = Y.namespace('juju.views').CharmPanel.getInstance({
          charm_store: new juju.CharmStore({datasource: {
            sendRequest: function(params) {
              // Mocking the server callback value
              params.callback.success({
                response: {
                  results: [{
                    responseText: searchResult
                  }]
                }
              });
            }
          }}),
          app: {db: db, views: { environment: {} } },
          testing: true
        }),
        node = panel.node;
    db.charms.add({id: 'cs:precise/membase-6'});

    panel.show();
    var field = Y.one('#charm-search-field');
    field.set('value', 'aaa');
    field.simulate('keydown', { keyCode: ENTER });
    node.one('a.charm-detail').simulate('click');
    node.one('.charm-description h3').get('text').trim()
      .should.equal('membase');
  });

  it('must be able to deploy from the description panel by going to the ' +
     'configuration panel', function() {
        var db = new models.Database(),
            panel = Y.namespace('juju.views').CharmPanel.getInstance({
              charm_store: new juju.CharmStore({datasource: {
                sendRequest: function(params) {
                  // Mocking the server callback value
                  params.callback.success({
                    response: {
                      results: [{
                        responseText: searchResult
                      }]
                    }
                  });
                }
              }}),
              app: {db: db, views: { environment: {} } },
              testing: true
            }),
            node = panel.node,
            charm = db.charms.add({id: 'cs:precise/membase-6'});
        charm.loaded = true;
        panel.show();
        var field = Y.one('#charm-search-field');
        field.set('value', 'aaa');
        field.simulate('keydown', { keyCode: ENTER });
        node.one('a.charm-detail').simulate('click');
        node.one('.btn-primary').simulate('click');
        node.one('.control-label').get('text').trim()
         .should.equal('Service name');
      });

  it('must show a ghosted service only when configuring a new charm',
     function() {
        var db = new models.Database(),
            panel = Y.namespace('juju.views').CharmPanel.getInstance({
              charm_store: new juju.CharmStore({datasource: {
                sendRequest: function(params) {
                  // Mocking the server callback value
                  params.callback.success({
                    response: {
                      results: [{
                        responseText: searchResult
                      }]
                    }
                  });
                }
              }}),
              app: {
                db: db,
                views: {
                  environment: {}
                },
                env: {
                  deploy: function() {
                    arguments[5]({ err: false });
                  },
                  update_annotations: function() {
                    return true;
                  }
                }
              },
              testing: true
            }),
            node = panel.node,
            charm = db.charms.add({id: 'cs:precise/membase-6'});
        charm.loaded = true;
        panel.show();
        var field = Y.one('#charm-search-field');
        field.set('value', 'aaa');
        field.simulate('keydown', { keyCode: ENTER });
        node.one('a.charm-detail').simulate('click');
        node.one('.btn-primary').simulate('click');
        // Test that a ghosted service was created in the db.
        db.services.size().should.equal(1);
        db.services.item(0).get('pending').should.equal(true);
        // Test that the ghosted service is removed on cancel.
        node.one('.btn.cancel').simulate('click');
        db.services.size().should.equal(0);
        // Test that the ghosted service is no longer ghosted on deploy.
        field.set('value', 'aaa');
        field.simulate('keydown', { keyCode: ENTER });
        node.one('a.charm-detail').simulate('click');
        node.one('.btn-primary').simulate('click');
        node.one('.btn-primary').simulate('click');
        db.services.item(0).get('pending').should.equal(false);
     });
});

describe('charm description', function() {
  var Y, models, views, juju, conn, env, container, db, app, charm,
      charm_store_data, charm_store, charms;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-models',
        'juju-views',
        'juju-gui',
        'juju-env',
        'juju-tests-utils',
        'node-event-simulate',
        'node',
        'datasource-local',
        'json-stringify',
        'juju-charm-store',

        function(Y) {
          models = Y.namespace('juju.models');
          views = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          done();
        });

  });

  beforeEach(function() {
    conn = new (Y.namespace('juju-tests.utils')).SocketStub(),
    env = Y.namespace('juju').newEnvironment({conn: conn});
    env.connect();
    conn.open();
    container = Y.Node.create('<div id="test-container" />');
    Y.one('#main').append(container);
    db = new models.Database();
    charm = db.charms.add({ id: 'cs:precise/mysql-7' });
    charms = new models.CharmList(),
    charm_store_data = {responseText: '{}'};
    charm_store = new juju.CharmStore(
        {datasource: new Y.DataSource.Local({source: [charm_store_data]})});
    app = { db: db, env: env, charm_store: charm_store };
  });

  afterEach(function() {
    container.remove(true);
    db.destroy();
    env.destroy();
  });

  it('can render no charm', function() {
    var view = new views.CharmDescriptionView(
        { container: container, app: app }).render();
    container.one('div.alert').get('text').trim().should.equal(
        'Waiting on charm data...');
  });

  it('can render incomplete charm', function() {
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm,
          charmStore: charm_store }).render(),
        html = container.one('.charm-description'),
        description_div = html.one('.charm-section div');
    html.one('h3').get('text').trim().should.equal('mysql');
    description_div.getStyle('height').should.not.equal('0px');
    html.all('div.charm-section').size().should.equal(1);
  });

  it('can render fuller charm', function() {
    charm.setAttrs(
        { summary: 'A DB',
          provides: {munin: {'interface': 'munin-node'}},
          last_change:
              { created: 1349797266.032,
                committer: 'fred',
                message: 'fixed EVERYTHING'}});
    charm_store_data.responseText = Y.JSON.stringify(
        { matches: 1,
          results: [
            { store_url: 'cs:precise/superthing-7',
              summary: 'A super thing.'}]});
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm, charms: charms,
          charmStore: charm_store }).render(),
        html = container.one('.charm-description'),
        sections = html.all('.charm-section'),
        description_div = sections.item(0).one('div'),
        interface_div = sections.item(1).one('div'),
        last_change_div = sections.item(2).one('div'),
        related_div = sections.item(3).one('div');
    description_div.get('text').should.contain('A DB');
    interface_div.getStyle('height').should.equal('0px');
    interface_div.get('text').should.contain('munin');
    last_change_div.getStyle('height').should.equal('0px');
    last_change_div.get('text').should.contain('fixed EVERYTHING');
    last_change_div.get('text').should.contain('2012-10-09');
    related_div.one('a').getAttribute('href').should.equal(
        'cs:precise/superthing-7');
    related_div.one('a').get('text').trim().should.equal('superthing');
  });

  it('can toggle visibility of subsections', function() {
    charm.setAttrs(
        { summary: 'A DB',
          provides: {munin: {'interface': 'munin-node'}},
          last_change:
              { created: 1349797266.032,
                committer: 'fred',
                message: 'fixed EVERYTHING'}});
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm,
          charmStore: charm_store }).render(),
        html = container.one('.charm-description'),
        // We use the last change div.
        section_container = html.one('div.charm-section:last-child');
    section_container.one('div').getStyle('height').should.equal('0px');
    assert(section_container.one('h4 i').hasClass('chevron_down'));
    section_container.one('h4').simulate('click');
    assert(section_container.one('h4 i').hasClass('chevron_up'));
    section_container.one('div').getStyle('height').should.not.equal('0px');
    section_container.one('h4').simulate('click');
    assert(section_container.one('h4 i').hasClass('chevron_down'));
    // The transition is still running, so we can't check display.
  });

  it('can respond to the "back" link', function(done) {
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm,
          charmStore: charm_store }).render();
    view.on('changePanel', function(ev) {
      ev.name.should.equal('charms');
      done();
    });
    container.one('.charm-nav-back').simulate('click');
  });

});

describe('charm panel filtering', function() {

  var Y, models, views, juju, conn, env, container, db, app, charm,
      charm_store_data, charm_store, charms, ENTER;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-models',
        'juju-views',
        'juju-gui',
        'juju-env',
        'juju-tests-utils',
        'node-event-simulate',
        'node',
        'datasource-local',
        'json-stringify',
        'juju-charm-store',

        function(Y) {
          models = Y.namespace('juju.models');
          views = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
          done();
        });

  });

  beforeEach(function() {
    conn = new (Y.namespace('juju-tests.utils')).SocketStub(),
    env = Y.namespace('juju').newEnvironment({conn: conn});
    env.connect();
    conn.open();
    Y.one('#main')
        .append(
            Y.Node.create('<div />')
              .setAttribute('id', 'charm-search-test').append(
                Y.Node.create('<input />')
                  .setAttribute('type', 'text')
                  .setAttribute('id', 'charm-search-field')
            )
        );
    container = Y.Node.create('<div />');
    Y.one('#main').append(container);
    db = new models.Database();
    charms = db.charms.add([
      { id: 'cs:precise/mysql-7' },
      { id: 'cs:precise/syslogd-1', is_subordinate: true}]);
    charm_store_data = {responseText: '{}'};
    charm_store = new juju.CharmStore({
      datasource: {
        sendRequest: function(params) {
          params.callback.success({
            response: {
              results: [{responseText: charm_store_data.responseText}]}});
        }}});
    app = { db: db, env: env, charm_store: charm_store };
  });

  afterEach(function() {
    Y.namespace('juju.views').CharmPanel.killInstance();
    Y.one('#charm-search-test').remove(true);
    container.remove(true);
    db.destroy();
    env.destroy();
  });


  it('should have `filters` default to `all`', function() {
    var view = new views.CharmCollectionView({});
    view.get('filter').should.equal('all');
  });

  it('should not filter entries when `all` is the filter', function() {
    var entries = [
      {
        series: 'precise',
        charms: [
          new models.Charm({id: 'cs:precise/foo-1'}),
          new models.Charm({id: 'cs:precise/logger-1',
            is_subordinate: true})
        ]
      }
    ];

    var filtered = views.filterEntries(entries, 'all');
    filtered.length.should.equal(1);
    filtered[0].charms.length.should.equal(2);
  });

  it('should filter for `subordinate`', function() {
    var entries = [
      {
        series: 'precise',
        charms: [
          new models.Charm({id: 'cs:precise/foo-1'}),
          new models.Charm({id: 'cs:precise/logger-1',
            is_subordinate: true}),
          new models.Charm({id: 'cs:precise/sub-1',
            is_subordinate: true}),
          new models.Charm({id: 'cs:precise/nosub-3',
            is_subordinate: false})
        ]
      },
      {
        series: 'oneiric',
        charms: [
          new models.Charm({id: 'cs:precise/foo-1',
            is_subordinate: true})
        ]
      }
    ];

    var filtered = views.filterEntries(entries, 'subordinates');
    filtered.length.should.equal(2);
    filtered[0].charms.length.should.equal(2);
    filtered[0].charms[0].get('id').should.equal('cs:precise/logger-1');
    filtered[0].charms[0].get('is_subordinate').should.equal(true);
    filtered[0].charms[1].get('id').should.equal('cs:precise/sub-1');
    filtered[0].charms[1].get('is_subordinate').should.equal(true);
  });

  it('should filter out series with no remaining charms', function() {
    var entries = [
      {
        series: 'precise',
        charms: [
          new models.Charm({id: 'cs:precise/foo-1'}),
          new models.Charm({id: 'cs:precise/logger-1',
            is_subordinate: true}),
          new models.Charm({id: 'cs:precise/sub-1',
            is_subordinate: true}),
          new models.Charm({id: 'cs:precise/nosub-3',
            is_subordinate: false})
        ]
      },
      {
        series: 'oneiric',
        charms: [
          new models.Charm({id: 'cs:oneiric/foo-1',
            is_subordinate: false})
        ]
      }
    ];

    var filtered = views.filterEntries(entries, 'subordinates');
    filtered.length.should.equal(1);
  });


  it('should filter for `deployed` charms', function() {
    var entries = [
      {
        series: 'precise',
        charms: [
          new models.Charm({id: 'cs:precise/foo-1'}),
          new models.Charm({id: 'cs:precise/logger-1',
            is_subordinate: true}),
          new models.Charm({id: 'cs:precise/sub-1',
            is_subordinate: true}),
          new models.Charm({id: 'cs:precise/nosub-3',
            is_subordinate: false})
        ]
      },
      {
        series: 'oneiric',
        charms: [
          new models.Charm({id: 'cs:oneiric/foo-2',
            is_subordinate: true})
        ]
      }
    ];

    db.services.add([
      {id: 'wordpress', charm: 'cs:edgy/wordpress-9'},
      {id: 'foo', charm: 'cs:oneiric/foo-2'},
      {id: 'sub', charm: 'cs:precise/sub-1'}]);

    var filtered = views.filterEntries(entries, 'deployed', db.services);

    filtered.length.should.equal(2);
    filtered[0].charms.length.should.equal(1);
    filtered[0].charms[0].get('id').should.equal('cs:precise/sub-1');
    filtered[1].charms.length.should.equal(1);
    filtered[1].charms[0].get('id').should.equal('cs:oneiric/foo-2');
  });


});
