'use strict';

describe('charm search', function() {
  var Y, juju, models, views,
      searchResult = '{"results": [{"data_url": "this is my URL", ' +
      '"name": "membase", "series": "precise", "summary": ' +
      '"Membase Server", "relevance": 8.728194117350437, ' +
      '"owner": "charmers"}]}';

  before(function() {
    Y = YUI(GlobalConfig).use([
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-env',
      'juju-tests-utils',
      'node-event-simulate'],

    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
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
    var navigateTriggered = false,
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
            navigate: function() {
              navigateTriggered = true;
            }
          },
          testing: true
        }),
        node = panel.node;

    panel.show();
    var field = node.one('.charms-search-field');
    field.set('value', 'aaa');
    field.simulate('keyup');
    node.one('a.charm-detail').simulate('click');

    navigateTriggered.should.equal(true);
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
     });

});
