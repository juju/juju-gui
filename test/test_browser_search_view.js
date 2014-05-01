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


describe('search view', function() {
  var apiURL,
      cleanIconHelper,
      container,
      fakeStore,
      node,
      utils,
      view,
      Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'json',
        'juju-charm-store',
        'juju-tests-utils',
        'juju-models',
        'node',
        'node-event-simulate',
        'subapp-browser-searchview',
        function(Y) {
          utils = Y.namespace('juju-tests.utils');
          cleanIconHelper = utils.stubCharmIconPath();
          done();
        });
  });

  beforeEach(function() {
    // Mock out a dummy location for the Store used in view instances.
    window.juju_config = {charmworldURL: 'http://charmworld.example'};
    container = utils.makeContainer(this, 'container');
    var testcontent = [
      '<div id="subapp-browser">',
      '<div id="testcontent" class="charmbrowser">',
      '<div class="bws-view-data"></div>',
      '<div class="bws-header"></div>',
      '<div class="bws-content"></div>',
      '</div>',
      '</div>'
    ].join();
    Y.Node.create(testcontent).appendTo(container);
    node = Y.one('#testcontent');
    view = new Y.juju.browser.views.BrowserSearchView({
      filters: {text: 'foo'}
    });
    // Create monkeypatched store to verify right method is called.
    apiURL = '';
    fakeStore = new Y.juju.charmworld.APIv3({});
    var sampleData = {
      result: [{
        charm: {
          id: 'foo/bar-2',
          name: 'bar',
          description: 'some charm named bar',
          files: []
        }
      }]
    };
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        // Stubbing the server callback value
        apiURL = params.request;
        params.callback.success({
          response: {
            results: [{
              responseText: Y.JSON.stringify(sampleData)
            }]
          }
        });
      }
    });
    view.set('store', fakeStore);
    view.set('renderTo', container.one('.bws-content'));
  });

  afterEach(function() {
    delete window.juju_config;
    view.destroy();
    node.remove(true);
  });

  after(function() {
    cleanIconHelper();
  });

  it('exists', function() {
    assert.isObject(view);
  });

  it('renders correctly', function() {
    view.render();
    var container = view.get('container');
    assert.equal('search?text=foo', apiURL, 'search text is not in URL');
    assert.equal(1, container.all('.yui3-token').size());
    var charmText = container.one('.yui3-token').one('.title').get('text');
    assert.equal(charmText.replace(/\s+/g, ''), 'bar',
                 'Charm text is incorrect');
  });

  it('shows the home icon when instructed', function() {
    var renderStub = utils.makeStubMethod(fakeStore, 'search');
    this._cleanups.push(renderStub.reset);

    view.set('withHome', true);
    view.render();

    // The home buttons are not visible by default.
    assert.isTrue(view.get('withHome'));
    assert.isFalse(container.one('.browser-nav').hasClass('hidden'));
  });

  it('routes home when it catches a gohome event', function(done) {
    var renderStub = utils.makeStubMethod(fakeStore, 'search');
    this._cleanups.push(renderStub.reset);

    view.on('viewNavigate', function(ev) {
      assert.equal(ev.change.search, false);
      assert.equal(ev.change.filter.clear, true);
      done();
    });

    view.render();
    view.search._onHome({
      halt: function() {}
    });
  });

  it('picks up the search widget deploy event', function(done) {
    var renderStub = utils.makeStubMethod(fakeStore, 'search');
    this._cleanups.push(renderStub.reset);

    view.set('charmID', 'precise/jenkins-13');
    view._deployEntity = function() {
      container.remove(true);
      done();
    };

    view.render();
    view.search.fire(view.search.EVT_DEPLOY);
  });

  it('shows and hides an indicator', function(done) {
    var hit = 0;
    view.render();
    view.showIndicator = function() {
      hit += 1;
    };
    view.hideIndicator = function() {
      hit += 1;
      hit.should.equal(2);
      done();
    };
    view.render();
  });

  it('handles empty text for search', function() {
    view.set('filters', {text: ''});
    view.render();
    assert.equal('search?text=', apiURL);
  });

  it('clicking a charm navigates', function(done) {
    view.render();
    view.on('viewNavigate', function(ev) {
      ev.halt();
      assert(ev.change.charmID === 'foo/bar-2');
      done();
    });

    container.one('.token').simulate('click');
  });

  it('organizes results by approval status', function(done) {
    view._renderSearchResults = function(results) {
      assert.equal(results.recommended.length, 1);
      assert.equal(results.recommended[0].get('id'), 'precise/bar-2');
      assert.equal(results.more.length, 1);
      done();
    };
    var sampleData = {
      result: [{
        charm: {
          id: 'precise/bar-2',
          name: 'foo',
          description: 'some charm named bar',
          files: [],
          is_approved: true
        }
      }, {
        charm: {
          id: 'precise/flim-2',
          name: 'foo',
          description: 'some charm named bar',
          files: [],
          is_approved: false
        }
      }]
    };
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        // Stubbing the server callback value
        params.callback.success({
          response: {
            results: [{
              responseText: Y.JSON.stringify(sampleData)
            }]
          }
        });
      }
    });
    view.set('store', fakeStore);
    view.render();
  });

  it('organizes results by approval status', function(done) {
    view._renderSearchResults = function(results) {
      assert.equal(results.recommended.length, 2);
      assert.equal(results.recommended[0].get('id'), 'precise/bar-2');
      assert.equal(results.recommended[1].get('id'), '~charmers/bar/2/bar');
      assert.equal(results.more.length, 1);
      done();
    };
    var sampleData = {
      result: [{
        charm: {
          id: 'precise/bar-2',
          name: 'foo',
          description: 'some charm named bar',
          files: [],
          is_approved: true
        }
      }, {
        charm: {
          id: 'precise/flim-2',
          name: 'foo',
          description: 'some charm named bar',
          files: [],
          is_approved: false
        }
      }, {
        bundle: {
          id: '~charmers/bar/2/bar',
          name: 'bar bundle',
          description: '',
          files: [],
          promulgated: true,
          data: {
            series: 'precise'
          }
        }
      }]
    };
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        // Stubbing the server callback value
        params.callback.success({
          response: {
            results: [{
              responseText: Y.JSON.stringify(sampleData)
            }]
          }
        });
      }
    });
    view.set('store', fakeStore);
    view.render();
  });

  it('will render both charms and bundles', function(done) {
    view._renderSearchResults = function(results) {
      assert.equal(results.recommended.length, 1);
      assert.equal(results.recommended[0].get('id'), 'precise/bar-2');
      assert.equal(results.more.length, 1);
      done();
    };
    var sampleData = {
      result: [{
        charm: {
          id: 'precise/bar-2',
          name: 'foo',
          description: 'some charm named bar',
          files: [],
          is_approved: true
        }
      }, {
        bundle: {
          id: '~bac/wiki/3/wiki',
          name: 'wiki',
          basket_name: 'wiki',
          basket_revision: 3,
          branch_deleted: false
        }
      }]
    };
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        // Stubbing the server callback value.
        params.callback.success({
          response: {
            results: [{
              responseText: Y.JSON.stringify(sampleData)
            }]
          }
        });
      }
    });
    view.set('store', fakeStore);
    view.render();
  });

  it('organizes results by a default if there is no envSeries', function(done) {
    assert.isUndefined(view.get('envSeries'));
    view._renderSearchResults = function(results) {
      assert.equal(results.recommended.length, 1);
      assert.equal(results.recommended[0].get('id'), 'precise/bar-2');
      assert.equal(results.more.length, 1);
      done();
    };
    var sampleData = {
      result: [{
        charm: {
          id: 'precise/bar-2',
          name: 'foo',
          description: 'some charm named bar',
          files: [],
          is_approved: true
        }
      }, {
        charm: {
          id: 'lucid/flim-2',
          name: 'foo',
          description: 'some charm named bar',
          files: [],
          is_approved: true
        }
      }]
    };
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        // Stubbing the server callback value
        params.callback.success({
          response: {
            results: [{
              responseText: Y.JSON.stringify(sampleData)
            }]
          }
        });
      }
    });
    view.set('store', fakeStore);
    view.render();
  });

  it('clicking a charm navigates for sidebar', function(done) {
    view.render();
    view.on('viewNavigate', function(ev) {
      ev.halt();
      assert(ev.change.charmID === 'foo/bar-2');
      done();
    });

    container.one('.token').simulate('click');
  });

  it('tells listeners the cache has updated', function() {
    view.on(view.EV_CACHE_UPDATED, function(ev) {
      assert.isObject(ev.cache);
    });
    view.render();
  });

  it('uses passed in cache data if available', function() {
    var search_called = false,
        results = {
          recommended: new Y.juju.models.CharmList(),
          more: new Y.juju.models.CharmList()
        };

    view.get('store').search = function() {
      search_called = true;
      return results;
    };
    view.render(results);
    assert.isFalse(search_called);

    view.render();
    assert.isTrue(search_called);
  });
});
