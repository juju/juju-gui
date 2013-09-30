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

  describe('browser_editorial', function() {
    var container, cleanIconHelper, EditorialView, fakeStore, models,
        node, sampleData, utils, view, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'node-event-simulate',
          'juju-tests-utils',
          'subapp-browser-editorial',
          function(Y) {
            utils = Y.namespace('juju-tests.utils');
            views = Y.namespace('juju.browser.views');
            EditorialView = views.EditorialView;
            sampleData = Y.io('data/interesting.json', {sync: true});
            cleanIconHelper = utils.stubCharmIconPath();
            done();
          });
    });

    beforeEach(function() {
      container = Y.namespace('juju-tests.utils').makeContainer('container');
      var testcontent = [
        '<div id=testcontent><div class="bws-view-data">',
        '</div><div class="bws-content"></div></div>'
      ].join();

      Y.Node.create(testcontent).appendTo(container);

      // Mock out a dummy location for the Store used in view instances.
      window.juju_config = {
        charmworldURL: 'http://localhost'
      };
      node = Y.one('#testcontent');
    });

    afterEach(function() {
      if (view) {
        view.destroy();
      }
      node.remove(true);
      delete window.juju_config;
      if (fakeStore) {
        fakeStore.destroy();
      }
      container.remove(true);
    });

    after(function() {
      cleanIconHelper();
    });

    it('renders sidebar with hidden charms', function() {
      fakeStore = new Y.juju.charmworld.APIv2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [sampleData]
            }
          });
        }
      });
      view = new EditorialView({
        renderTo: Y.one('.bws-content'),
        store: fakeStore
      });
      view.render();
      assert(node.all('.yui3-token-hidden').size() > 0);
    });

    it('shows and hides an indicator', function(done) {
      var hit = 0;
      fakeStore = new Y.juju.charmworld.APIv2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [sampleData]
            }
          });
        }
      });
      view = new EditorialView({
        renderTo: Y.one('.bws-content'),
        store: fakeStore
      });
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

    it('renders fullscreen 14/22 charms hidden', function() {
      fakeStore = new Y.juju.charmworld.APIv2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [sampleData]
            }
          });
        }
      });
      view = new EditorialView({
        isFullscreen: true,
        renderTo: Y.one('.bws-content'),
        store: fakeStore
      });
      view.render();
      assert(node.all('.yui3-token-hidden').size() === 14);
    });

    it('clicking a charm navigates for fullscreen', function(done) {
      fakeStore = new Y.juju.charmworld.APIv2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [sampleData]
            }
          });
        }
      });
      view = new EditorialView({
        isFullscreen: true,
        renderTo: Y.one('.bws-content'),
        store: fakeStore
      });
      view.render();

      view.on('viewNavigate', function(ev) {
        ev.halt();
        ev.change.charmID.should.eql('precise/ceph-9');
        done();
      });

      node.one('.token').simulate('click');
    });

    it('clicking a charm navigates for sidebar', function(done) {
      fakeStore = new Y.juju.charmworld.APIv2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [sampleData]
            }
          });
        }
      });
      view = new EditorialView({
        renderTo: Y.one('.bws-content'),
        store: fakeStore
      });
      view.render();

      view.on('viewNavigate', function(ev) {
        ev.halt();
        ev.change.charmID.should.eql('precise/ceph-9');
        done();
      });

      node.one('.token').simulate('click');
    });

    it('setting the activeID marks the div active', function() {
      fakeStore = new Y.juju.charmworld.APIv2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [sampleData]
            }
          });
        }
      });
      view = new EditorialView({
        renderTo: Y.one('.bws-content'),
        store: fakeStore,
        activeID: 'precise/ceph-9'
      });
      view.render();
      node.all('.yui3-token.active').size().should.equal(1);
    });

    it('unsetting the activeID will remove the active markings', function() {
      fakeStore = new Y.juju.charmworld.APIv2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [sampleData]
            }
          });
        }
      });
      view = new EditorialView({
        renderTo: Y.one('.bws-content'),
        store: fakeStore,
        activeID: 'precise/ceph-7'
      });
      view.render();

      view.set('activeID', null);
      node.all('.yui3-token.active').size().should.equal(0);
    });

    it('tells listeners the cache has updated', function() {
      view = new EditorialView({
        renderTo: Y.one('.bws-content')
      });
      var results = {
        featuredCharms: [],
        newCharms: [],
        popularCharms: []
      };
      view.on(view.EV_CACHE_UPDATED, function(ev) {
        assert.isObject(ev.cache);
      });
      view.render(results);
    });

    it('uses passed in cache data if available', function() {
      fakeStore = new Y.juju.charmworld.APIv2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [sampleData]
            }
          });
        }
      });
      var interesting_called = false,
          results = {
            featuredCharms: [],
            newCharms: [],
            popularCharms: []
          };

      fakeStore.interesting = function() {
        interesting_called = true;
        return results;
      };
      view = new EditorialView({
        renderTo: Y.one('.bws-content'),
        store: fakeStore,
        activeID: 'precise/ceph-7'
      });
      view.render(results);
      assert.isFalse(interesting_called);

      view.render();
      assert.isTrue(interesting_called);
    });

    it('renders bundles and charms', function(done) {
      var sampleData = {
        result: {
          featured: [
            {
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
            }
          ],
          'new': [],
          popular: []
        }
      };

      fakeStore = new Y.juju.charmworld.APIv3({});
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
      view = new EditorialView({
        renderTo: Y.one('.bws-content'),
        store: fakeStore,
        activeID: 'precise/ceph-7'
      });
      view._renderInteresting = function(results) {
        assert.equal(results.featuredCharms.length, 2,
            'featureCharm length wrong');
        assert.equal(results.newCharms.length, 0,
            'newCharms length wrong');
        assert.equal(results.popularCharms.length, 0,
            'popularCharms length wrong');
        assert.equal(results.featuredCharms[0].get('id'), 'precise/bar-2');
        assert.equal(results.featuredCharms[1].get('id'), '~bac/wiki/3/wiki');
        done();
      };
      view.render();
    });
  });

})();
