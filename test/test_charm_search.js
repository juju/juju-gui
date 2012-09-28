'use strict';

describe('charm search', function () {
  var Y, juju, models, views;

  before(function (done) {
    Y = YUI(GlobalConfig).use([
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-env',
      'juju-tests-utils',
      'node-event-simulate'],

      function (Y) {
        juju = Y.namespace('juju');
        models = Y.namespace('juju.models');
        views = Y.namespace('juju.views');
        done();
      });
  });

  it('must be able to show and hide the panel', function () {
    var panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({});

    panel.showPanel(true);
    assert.isNotNull(Y.one('#juju-search-charm-panel'));

    panel.showPanel(false);
    assert.isNull(Y.one('#juju-search-charm-panel'));

    panel.togglePanel();
    assert.isNotNull(Y.one('#juju-search-charm-panel'));

    panel.togglePanel();
    assert.isNull(Y.one('#juju-search-charm-panel'));
  });

  it('must be able to search', function () {
    Y.namespace('juju.views').CharmSearchPopup.killInstance();

    var searchTriggered = false,

        searchResult = '{"results": [{"data_url": "this is my URL", ' +
          '"name": "membase", "series": "precise", "summary": ' +
          '"Membase Server", "relevance": 8.728194117350437, ' +
          '"owner": "charmers"}]}',

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

    panel.showPanel(true);
    var field = Y.one('.charms-search-field');
    field.set('value', 'aaa');
    panel.setSearchDelay(0);

    field.simulate('keyup');
    assert.isTrue(searchTriggered);

    node.getHTML().should.contain('this is my URL');
  });

  it('must be able to reset the search result', function () {
    var panel = Y.namespace('juju.views').CharmSearchPopup.getInstance({}),
      node = panel.getNode();

    panel.showPanel(true);


    var field = Y.one('.charms-search-field'),
      buttonX = Y.one('.clear');

    node.getHTML().should.contain('this is my URL');
    assert.equal('aaa', field.get('value'));

    buttonX.simulate('click');

    node.getHTML().should.not.contain('this is my URL');
    assert.equal('', field.get('value'));
  });
});
