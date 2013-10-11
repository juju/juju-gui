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

describe('Browser bundle detail view', function() {
  var Y, utils, data, container, origData, view, fakestore, browser;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'view',
        'juju-env-fakebackend',
        'juju-view-bundle',
        'subapp-browser', // required for handlebars helpers
        'subapp-browser-entitybaseview',
        'browser-overlay-indicator',
        'event-tracker',
        'subapp-browser-bundleview',
        'juju-view-utils',
        'juju-tests-utils',
        'event-simulate',
        'node-event-simulate',
        function(Y) {
          utils = Y.namespace('juju-tests.utils');
          var sampleData = Y.io('data/browserbundle.json', {sync: true});

          origData = Y.JSON.parse(sampleData.responseText);

          // Required to register the handlebars helpers
          browser = new Y.juju.subapps.Browser({
            store: modifyFakeStore()
          });

          done();
        });
  });

  beforeEach(function() {
    data = Y.clone(origData);
    container = utils.makeContainer();
    container.append('<div class="bws-view-data"></div>');
    view = new Y.juju.browser.views.BrowserBundleView({
      store: modifyFakeStore(),
      db: {},
      entityId: data.id,
      renderTo: container
    });
    view._setupLocalFakebackend = function() {
      this.fakebackend = utils.makeFakeBackend();
    };
  });

  afterEach(function() {
    container.remove().destroy(true);
    view.destroy();
  });

  function modifyFakeStore(options) {
    var defaults = {
      bundle: function(id, callbacks) {
        callbacks.success(data);
      },
      iconpath: function(id) {
        return 'foo';
      }
    };

    var fakebackend = Y.mix(defaults, options, true);
    if (view) {
      view.set('store', fakebackend);
    }
    return fakebackend;
  }

  it('can be instantiated', function() {
    assert.equal(view instanceof Y.juju.browser.views.BrowserBundleView, true);
  });

  it('displays the bundle data in a tabview', function(done) {
    view.after('renderedChange', function(e) {
      assert.isNotNull(container.one('.yui3-tabview'));
      done();
    });
    view.render();
  });

  it('fetches the readme when requested', function(done) {
    modifyFakeStore({
      file: function(id, filename, entityType, callbacks) {
        assert.equal(entityType, 'bundle');
        assert.equal(id, data.id);
        assert.equal(filename, 'README');
        assert.isFunction(callbacks.success);
        assert.isFunction(callbacks.failure);
        callbacks.success.call(view, '<div id="testit"></div>');
        assert.isNotNull(container.one('#testit'));
        done();
      }
    });
    view.after('renderedChange', function(e) {
      container.one('a.readme').simulate('click');
    });
    view.render();
  });

  it('fetches a source file when requested', function(done) {
    modifyFakeStore({
      file: function(id, filename, entityType, callbacks) {
        assert.equal(entityType, 'bundle');
        assert.equal(id, data.id);
        assert.equal(filename, 'bundles.yaml');
        assert.isFunction(callbacks.success);
        assert.isFunction(callbacks.failure);
        callbacks.success.call(view, '<div id="testit"></div>');
        assert.isNotNull(container.one('#testit'));
        done();
      }
    });
    view.after('renderedChange', function(e) {
      container.one('a.code').simulate('click');
      var codeNode = container.one('#bws-code');
      codeNode.all('select option').item(2).set('selected', 'selected');
      codeNode.one('select').simulate('change');
    });

    view.render();
  });

  it('renders the proper charm icons into the header', function(done) {
    view.after('renderedChange', function(e) {
      assert.equal(
          container.one('.header .details .charms').all('img').size(),
          4);
      done();
    });
    view.render();
  });

  it('deploys a bundle when \'add\' button is clicked', function(done) {
    // app.js sets this to its deploy bundle method so
    // as long as it's called it's successful.
    view.set('deployBundle', function(data) {
      assert.isObject(data);
      done();
    });
    view.after('renderedChange', function(e) {
      container.one('.bundle .add').simulate('click');
    });
    view.render();
  });

  it('fails gracefully if services don\'t provide xy annotations',
     function(done) {
       window.flags = { strictBundle: true };
       view._parseData = function() {
         return new Y.Promise(function(resolve) { resolve(); });
       };
       view.set('entity', {
          getAttrs: function() {
            return {
              charm_metadata: {},
              files: [],
              data: {
                services: {
                  foo: {
                    annotations: {
                      'gui-x': '',
                      'gui-y': ''
                    }
                  },
                  bar: {}
                }
              }
            };
          }});
       view.after('renderedChange', function(e) {
         assert.isNull(container.one('#bws-bundle'));
         assert.isNull(container.one('a[href=#bws-bundle]'));
         // Check that the charms tab is the landing tab
         assert.equal(view.tabview.get('selection').get('index'), 2);
         window.flags = {};
         done();
       });
       view.render();
     });

  it('renders the bundle topology into the view', function(done) {
    window.flags = { strictBundle: true };
    view._parseData = function() {
      return new Y.Promise(function(resolve) { resolve(); });
    };
    view.set('entity', {
      getAttrs: function() {
        return {
          charm_metadata: {},
          files: [],
          data: {
            services: {
              foo: {
                annotations: {
                  'gui-x': '1',
                  'gui-y': '2'
                }
              },
              bar: {
                annotations: {
                  'gui-x': '3',
                  'gui-y': '4'
                }
              }
            }
          }
        };
      }});
    view.after('renderedChange', function(e) {
      assert.isNotNull(container.one('.topology-canvas'));
      // Check that the bundle topology tab is the landing tab.
      assert.equal(view.tabview.get('selection').get('index'), 0);
      window.flags = {};
      done();
    });
    view.render();
  });


});
