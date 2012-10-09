'use strict';

describe('charm search', function() {
  var Y, models, views,
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

        function(Y) {
          models = Y.namespace('juju.models');
          views = Y.namespace('juju.views');
          done();
        });

  });

  beforeEach(function() {
    // The "charms search" feature needs these elements
    var docBody = Y.one(document.body);
    Y.Node.create('<div id="charm-search-test">' +
        '<div id="charm-search-icon"><i></i></div>' +
        '<div id="content"></div></div>').appendTo(docBody);
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
          charm_store: {
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
          },
          testing: true
        }),
        node = panel.node;
    panel.show(true);
    var field = node.one('.charms-search-field');
    field.set('value', 'aaa');
    field.simulate('keyup');

    searchTriggered.should.equal(true);
    node.one('.charm-entry .btn').getData('info-url').should.equal(
        'this is my URL');
  });

  it('must be able to reset the search result', function() {
    var panel = Y.namespace('juju.views').CharmSearchPopup.getInstance(
        { charm_store:
              { sendRequest: function(params) {
                // Mocking the server callback value
                params.callback.success({
                  response: {
                    results: [{
                      responseText: searchResult
                    }]
                  }
                });
              }},
          testing: true
        }),
        node = panel.node;
    panel.show();
    var field = node.one('.charms-search-field'),
        clearButton = node.one('.clear');
    field.set('value', 'aaa');
    field.simulate('keyup');
    clearButton.simulate('click');

    node.all('.charm-detail').isEmpty().should.equal(true);
    field.get('value').should.equal('');
  });

  it('must be able to trigger charm details', function() {
    var db = new models.Database(),
        panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({
          charm_store: {
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
          },
          app: {db: db},
          testing: true
        }),
        node = panel.node;
    db.charms.add({id: 'cs:precise/membase'});

    panel.show();
    var field = node.one('.charms-search-field');
    field.set('value', 'aaa');
    field.simulate('keyup');
    node.one('a.charm-detail').simulate('click');
    node.one('#charm-description > h3').get('text').trim()
      .should.equal('membase');
  });

  it('must deploy a charm for a new service when the button is clicked',
     function() {
       var deployed = false,
           panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({
             charm_store: {
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
             },
             app: {
               env: {
                 deploy: function() { deployed = true; }
               },
               db: {
                 services: {
                   getById: function(name) {
                     // Simulate the deployed service does not exist.
                     return undefined;
                   }
                 },
                 notifications: {
                   add: function() { return; }
                 }
               },
               fire: function() { return; }
             },
             testing: true
           }),
           node = panel.node;

       panel.show();

       // Search for something.
       var field = node.one('.charms-search-field');
       field.set('value', 'membase');
       field.simulate('keyup');
       // Now the deploy button should appear and is clickable which causes
       // the deploying.
       var deployButton = node.one('.charm-entry .btn');
       deployButton.simulate('click');
       deployed.should.equal(true);
     });

  it('must not deploy a charm for an existing service when deploy is clicked',
     function() {
       var deployed = false,
           showCharmCalled = false,
           panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({
             charm_store: {
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
             },
             app: {
               env: {
                 deploy: function() { deployed = true; }
               },
               db: {
                 services: {
                   getById: function(name) {
                     // Simulate the deployed service already exists.
                     return true;
                   }
                 },
                 notifications: {
                   add: function() { return; }
                 }
               },
               fire: function(name) {
                 showCharmCalled = (name === 'showCharm');
                 return; }
             },
             testing: true
           }),
           node = panel.node;

       panel.show();

       // Search for something.
       var field = node.one('.charms-search-field');
       field.set('value', 'membase');
       field.simulate('keyup');
       // Now the deploy button should appear and is clickable.  Since the
       // service is already deployed, the showCharm event should be fired
       // instead of the deploy method.
       var deployButton = node.one('.charm-entry .btn');
       deployButton.simulate('click');
       deployed.should.equal(false);
       showCharmCalled.should.equal(true);
     });

});

describe('charm description', function() {
  var Y, models, views, conn, env, container, db, app, charm,
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

        function(Y) {
          models = Y.namespace('juju.models');
          views = Y.namespace('juju.views');
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
    charm = db.charms.add({ id: 'cs:precise/mysql' });
    charm_store_data = [];
    charm_store = new Y.DataSource.Local({source: charm_store_data});
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
        html = container.one('#charm-description'),
        description_div = html.one('.charm-section div'),
        interface_div = html.one('div.charm-section:nth-of-type(2) div'),
        last_change_div = html.one('div.charm-section:nth-of-type(3) div');
    view.get('modelId').should.equal(charm.get('id'));
    html.one('h3').get('text').trim().should.equal('mysql');
    description_div.getStyle('display').should.equal('block');
    interface_div.getStyle('display').should.equal('none');
    last_change_div.getStyle('display').should.equal('none');
  });

  it('can render fuller charm', function() {
    charm.setAttrs(
        { summary: 'A DB',
          last_change:
              { created: 1349797266.032,
                committer: 'fred',
                message: 'fixed EVERYTHING'}});
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm }).render(),
        html = container.one('#charm-description'),
        description_div = html.one('.charm-section div'),
        last_change_div = html.one('div.charm-section:nth-of-type(3) div');
    description_div.get('text').should.contain('A DB');
    last_change_div.get('text').should.contain('fixed EVERYTHING');
    last_change_div.get('text').should.contain('2012');
  });

  it('can toggle visibility of subsections', function() {
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm }).render(),
        html = container.one('#charm-description'),
        section_container = html.one('div.charm-section:nth-of-type(3)');
    section_container.one('div').getStyle('display').should.equal('none');
    assert(section_container.one('h4 i').hasClass('icon-chevron-right'));
    section_container.one('h4').simulate('click');
    assert(section_container.one('h4 i').hasClass('icon-chevron-down'));
    section_container.one('div').getStyle('display').should.equal('block');
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

  it('deploys by sending the user to the configuration page', function() {
    // For now, we simply go to the charm page.  Later, we will fire an
    // event locally to show the config panel.
    var view = new views.CharmDescriptionView(
        { container: container, app: app, model: charm }).render(),
        app_events = [];
    app.fire = function() { app_events.push(arguments); };
    container.one('.btn').simulate('click');
    app_events[0][0].should.equal('showCharm');
    app_events[0][1].charm_data_url.should.equal('charms/precise/mysql/json');
  });

  // CharmPanelBaseView
  it('can get a charm by setting the modelId', function() {
    var view = new views.CharmDescriptionView(
        { container: container, app: app });
    view.set('modelId', charm.get('id'));
    view.get('model').should.equal(charm);
    // The view rendered automatically.
    container.one('#charm-description h3').get('text').trim()
          .should.equal('mysql');
  });

  it('can load a charm by setting the modelId', function() {
    charm_store_data.push(
        { responseText: Y.JSON.stringify({ summary: 'wowza' }) });
    var view = new views.CharmDescriptionView(
        { container: container, app: app });
    view.set('modelId', 'cs:precise/whatever');
    view.get('model').get('package_name').should.equal('whatever');
    view.get('model').get('summary').should.equal('wowza');
    container.one('#charm-description').get('text').should.contain('wowza');
    app.db.charms.getById(
        'cs:precise/whatever').get('summary').should.equal('wowza');
  });

});
