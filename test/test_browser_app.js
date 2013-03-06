/*global YUI: false, window: false, describe: false, before:false,
  should: false, GlobalConfig: false, beforeEach: false, document: false,
  afterEach: false, it: false*/

'use strict';

(function() {

  describe('browser fullscreen view', function() {
    var browser, FullScreen, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-views', 'juju-browser', 'subapp-browser-fullscreen'
      ], function(Y) {
        browser = Y.namespace('juju.browser');
        views = Y.namespace('juju.browser.views');
        FullScreen = views.FullScreen;
        done();
      });
    });

    beforeEach(function() {
      // The charms panel needs these elements
      var docBody = Y.one(document.body);
      Y.Node.create('<div id="browser">' +
          '</div>').appendTo(docBody);
    });

    afterEach(function() {
      Y.one('#browser').remove(true);
    });

    // Ensure the search results are rendered inside the container.
    it('must correctly render the initial browser ui', function() {
      var container = Y.one('#browser'),
          view = new FullScreen();
      view.render(container);

      // And the hide button is rendered to the container node.
      should.exist(container.one('#fullscreen'));
    });

  });

})();
