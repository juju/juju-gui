'use strict';

describe('charm search', function() {
  var Y, juju, models, views,
      searchResult = '{"results": [{"data_url": "this is my URL", ' +
      '"name": "membase", "series": "precise", "summary": ' +
      '"Membase Server", "relevance": 8.728194117350437, ' +
      '"owner": "charmers"}]}';

  before(function(done) {
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

      done();
    });
  });

  beforeEach(function(done) {
    // The "charms search" feature needs these elements
    var docBody = Y.one(document.body);
    Y.Node.create('<div id="charm-search-icon"/>').appendTo(docBody);
    Y.Node.create('<div id="content"/>').appendTo(docBody);

    done();
  });

  afterEach(function(done) {
    Y.namespace('juju.views').CharmSearchPopup.killInstance();

    Y.one('#charm-search-icon').remove();
    Y.one('#content').remove();

    done();
  });

  it('must be able to show and hide the panel', function(done) {
    var panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({});

    panel.show();
    assert.isNotNull(Y.one('#juju-search-charm-panel'));

    panel.hide();
    assert.isNull(Y.one('#juju-search-charm-panel'));

    panel.toggle();
    assert.isNotNull(Y.one('#juju-search-charm-panel'));

    panel.toggle();
    assert.isNull(Y.one('#juju-search-charm-panel'));

    done();
  });

  it('must be able to search', function(done) {
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
          }
        }),

        node = panel.getNode();

    panel.show();
    var field = Y.one('.charms-search-field');
    field.set('value', 'aaa');
    panel.setSearchDelay(0);

    field.simulate('keyup');
    assert.isTrue(searchTriggered);

    assert.equal('this is my URL',
        node.one('.charm-detail').getAttribute('data-charm-url'));

    done();
  });

  it('must be able to reset the search result', function(done) {
    var panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({
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
      }
    }),
        node = panel.getNode();

    panel.show();

    var field = Y.one('.charms-search-field'),
        buttonX = Y.one('.clear');

    field.set('value', 'aaa');
    panel.setSearchDelay(0);
    field.simulate('keyup');

    assert.equal('this is my URL',
        node.one('.charm-detail').getAttribute('data-charm-url'));
    assert.equal('aaa', field.get('value'));

    buttonX.simulate('click');

    assert.isTrue(node.all('.charm-detail').isEmpty());
    assert.equal('', field.get('value'));

    done();
  });

  it('must be able to trigger charm details', function(done) {
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
          }
        }),

        node = panel.getNode();

    panel.show();
    var field = Y.one('.charms-search-field');
    field.set('value', 'aaa');
    panel.setSearchDelay(0);

    field.simulate('keyup');

    Y.one('.charm-detail').simulate('click');
    assert.isTrue(navigateTriggered);

    done();
  });
});
