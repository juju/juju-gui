'use strict';

(function() {

  describe.only('browser_editorial', function() {
    var EditorialView, models, node, sampleData, view, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'node-event-simulate',
          'subapp-browser-editorial',
          function(Y) {
            views = Y.namespace('juju.browser.views');
            EditorialView = views.EditorialView;
            sampleData = Y.io('data/interesting.json', {sync: true});
            done();
          });
    });

    beforeEach(function() {
      var docBody = Y.one(document.body),
          testcontent = [
            '<div id=testcontent><div class="bws-view-data">',
            '</div><div class="bws-content"></div></div>'
          ].join();

      Y.Node.create(testcontent).appendTo(docBody);

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
    });

    it('renders sidebar with hidden charms', function() {
      var fakeStore = new Y.juju.Charmworld0({});
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

    it('renders fullscreen w/o hidden charms', function() {
      var fakeStore = new Y.juju.Charmworld0({});
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
      assert(node.all('.yui3-charmtoken-hidden').size() === 0);
    });

    it('clicking a charm navigates for fullscreen', function(done) {
      var fakeStore = new Y.juju.Charmworld0({});
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
        assert(ev.viewmode === 'fullscreen');
        assert(ev.charmID === 'precise/ceph-7');
        done();
      });

      node.one('.charm-token').simulate('click');
    });

    it('clicking a charm navigates for sidebar', function(done) {
      var fakeStore = new Y.juju.Charmworld0({});
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
        assert(ev.viewmode === 'sidebar');
        assert(ev.charmID === 'precise/ceph-7');
        done();
      });

      node.one('.charm-token').simulate('click');
    });

  });

})();
