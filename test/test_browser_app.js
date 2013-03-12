'use strict';

(function() {

  var addBrowserContainer = function(Y) {
    var docBody = Y.one(document.body);
    Y.Node.create('<div id="subapp-browser">' +
        '</div>').appendTo(docBody);
  };

  describe('browser fullscreen view', function() {
    var browser, FullScreen, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-views',
          'juju-browser',
          'subapp-browser-fullscreen', function(Y) {
            browser = Y.namespace('juju.browser');
            views = Y.namespace('juju.browser.views');
            FullScreen = views.FullScreen;
            done();
          });
    });

    beforeEach(function() {
      addBrowserContainer(Y);
    });

    afterEach(function() {
      Y.one('#subapp-browser').remove(true);
    });

    // Ensure the search results are rendered inside the container.
    it('must correctly render the initial browser ui', function() {
      var container = Y.one('#subapp-browser'),
          view = new FullScreen();
      view.render(container);

      // And the hide button is rendered to the container node.
      assert.isTrue(Y.Lang.isObject(container.one('#bws-fullscreen')));
    });

  });


  describe('browser sidebar view', function() {
    var Y, browser, views, Sidebar;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-browser',
          'juju-views',
          'subapp-browser-sidebar',
          function(Y) {
            browser = Y.namespace('juju.browser');
            views = Y.namespace('juju.browser.views');
            Sidebar = views.Sidebar;
            done();
          });
    });

    beforeEach(function() {
      addBrowserContainer(Y);
    });

    afterEach(function() {
      Y.one('#subapp-browser').remove(true);
    });

    it('must correctly render the initial browser ui', function() {
      var container = Y.one('#subapp-browser'),
          view = new Sidebar();
      view.render(container);

      // And the hide button is rendered to the container node.
      assert.isTrue(Y.Lang.isObject(container.one('#bws-sidebar')));
      // Also verify that the search widget has rendered into the view code.
      assert.isTrue(Y.Lang.isObject(container.one('input')));
    });

  });


  describe('browser app', function() {
    var Y, browser;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'app-subapp-extension',
          'juju-views',
          'juju-browser',
          'subapp-browser', function(Y) {
            browser = Y.namespace('juju.subapps');
            done();
          });
    });

    it('verify that route callables exist', function() {
      var app = new browser.Browser();
      Y.each(app.get('routes'), function(route) {
        assert.isTrue(typeof app[route.callback] === 'function');
      });

    });

  });

})();
