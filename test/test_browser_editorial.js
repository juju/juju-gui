'use strict';

(function() {

  describe('browser_editorial', function() {
    var container, EditorialView, fakeStore, models, node, sampleData, view, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'node-event-simulate',
          'juju-tests-utils',
          'subapp-browser-editorial',
          function(Y) {
            views = Y.namespace('juju.browser.views');
            EditorialView = views.EditorialView;
            sampleData = Y.io('data/interesting.json', {sync: true});
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

    it('renders sidebar with hidden charms', function() {
      fakeStore = new Y.juju.Charmworld0({});
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
      assert(node.all('.yui3-charmtoken-hidden').size() > 0);
    });

    it('shows and hides an indicator', function(done) {
      var hit = 0;
      fakeStore = new Y.juju.Charmworld0({});
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
      fakeStore = new Y.juju.Charmworld0({});
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
      assert(node.all('.yui3-charmtoken-hidden').size() === 14);
    });

    it('clicking a charm navigates for fullscreen', function(done) {
      fakeStore = new Y.juju.Charmworld0({});
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
        assert(ev.change.charmID === 'precise/ceph-7');
        done();
      });

      node.one('.charm-token').simulate('click');
    });

    it('clicking a charm navigates for sidebar', function(done) {
      fakeStore = new Y.juju.Charmworld0({});
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
        assert(ev.change.charmID === 'precise/ceph-7');
        done();
      });

      node.one('.charm-token').simulate('click');
    });

    it('setting the activeID marks the div active', function() {
      fakeStore = new Y.juju.Charmworld0({});
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
      node.all('.yui3-charmtoken.active').size().should.equal(1);
    });

    it('unsetting the activeID will remove the active markings', function() {
      fakeStore = new Y.juju.Charmworld0({});
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
      node.all('.yui3-charmtoken.active').size().should.equal(0);
    });

  });

})();
