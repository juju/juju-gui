'use strict';

describe('charm search', function() {
  var Y, models, views, juju, ENTER,
      searchResult = '{"results": [{"data_url": "this is my URL", ' +
      '"name": "membase", "series": "precise", "summary": ' +
      '"Membase Server", "relevance": 8.728194117350437, ' +
      '"owner": "charmers"}]}';

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
    // The "charms search" feature needs these elements
    var docBody = Y.one(document.body);
    Y.Node.create('<div id="charm-search-test">' +
        '<div id="charm-search-icon"><i></i></div>' +
        '<div id="content"></div>' +
        '<input type="text" id="charm-search-field" />' +
        '</div>').appendTo(docBody);
  });

  afterEach(function() {
    Y.namespace('juju.views').CharmSearchPopup.killInstance();
    Y.one('#charm-search-test').remove(true);
  });

  it('must be able to show and hide the panel', function() {
    var panel = Y.namespace('juju.views').CharmSearchPopup
          .getInstance({testing: true}),
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
        panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({
          charm_store: new juju.CharmStore({datasource: {
            sendRequest: function(params) {
              searchTriggered = true;
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
          testing: true
        }),
        node = panel.node;
    panel.show(true);
    var field = Y.one('#charm-search-field');
    field.set('value', 'aaa');
    field.simulate('keydown', { keyCode: ENTER });

    searchTriggered.should.equal(true);
    node.one('.charm-entry .btn.deploy').getData('url').should.equal(
        'cs:precise/membase');
  });

  it('must be able to trigger charm details', function() {
    var db = new models.Database(),
        panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({
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
          app: {db: db},
          testing: true
        }),
        node = panel.node;
    db.charms.add({id: 'cs:precise/membase'});

    panel.show();
    var field = Y.one('#charm-search-field');
    field.set('value', 'aaa');
    field.simulate('keydown', { keyCode: ENTER });
    node.one('a.charm-detail').simulate('click');
    node.one('.charm-description > h3').get('text').trim()
      .should.equal('membase');
  });

  it('must be able to deploy from the description panel by going to the ' +
     'configuration panel', function() {
        var db = new models.Database(),
            panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({
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
              app: {db: db},
              testing: true
            }),
            node = panel.node,
            charm = db.charms.add({id: 'cs:precise/membase'});
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
});

describe('charm description', function() {
  var Y, models, views, juju, conn, env, container, db, app, charm,
      charm_store_data, charm_store;

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
    env = new (Y.namespace('juju')).Environment({conn: conn});
    env.connect();
    conn.open();
    container = Y.Node.create('<div id="test-container" />');
    Y.one('#main').append(container);
    db = new models.Database();
    charm = db.charms.add({ id: 'cs:precise/mysql-7' });
    charm_store_data = [];
    charm_store = new juju.CharmStore(
      {datasource: new Y.DataSource.Local({source: charm_store_data})});
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
        { container: container, app: app, model: charm }).render(),
        html = container.one('.charm-description'),
        description_div = html.one('.charm-section div'),
        interface_div = html.one('div.charm-section:nth-of-type(2)'),
        last_change_div = html.one('div.charm-section:nth-of-type(3)');
    html.one('h3').get('text').trim().should.equal('mysql');
    description_div.getStyle('height').should.not.equal('0px');
    var _ = expect(interface_div).to.not.exist;
    _ = expect(last_change_div).to.not.exist;
  });

  it('can render fuller charm', function() {
    charm.setAttrs(
        { summary: 'A DB',
          provides: {munin: {'interface': 'munin-node'}},
          last_change:
              { created: 1349797266.032,
                committer: 'fred',
                message: 'fixed EVERYTHING'}});
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm }).render(),
        html = container.one('.charm-description'),
        description_div = html.one('.charm-section div'),
        interface_div = html.one('div.charm-section:nth-of-type(2) div'),
        last_change_div = html.one('div.charm-section:nth-of-type(3) div');
    description_div.get('text').should.contain('A DB');
    interface_div.getStyle('height').should.equal('0px');
    interface_div.get('text').should.contain('munin');
    last_change_div.getStyle('height').should.equal('0px');
    last_change_div.get('text').should.contain('fixed EVERYTHING');
    last_change_div.get('text').should.contain('2012-10-09');
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
        { container: container, app: app, model: charm }).render(),
        html = container.one('.charm-description'),
        section_container = html.one('div.charm-section:nth-of-type(3)');
    section_container.one('div').getStyle('height').should.equal('0px');
    assert(section_container.one('h4 i').hasClass('icon-chevron-right'));
    section_container.one('h4').simulate('click');
    assert(section_container.one('h4 i').hasClass('icon-chevron-down'));
    section_container.one('div').getStyle('height').should.not.equal('0px');
    section_container.one('h4').simulate('click');
    assert(section_container.one('h4 i').hasClass('icon-chevron-right'));
    // The transition is still running, so we can't check display.
  });

  it('can respond to the "back" link', function(done) {
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm }).render();
    view.on('changePanel', function(ev) {
      ev.name.should.equal('charms');
      done();
    });
    container.one('.charm-nav-back').simulate('click');
  });

});
