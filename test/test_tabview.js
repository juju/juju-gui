'use strict';


(function() {

  describe('tabview', function() {
    var container, Y, tabview;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'browser-tabview', 'node', 'node-event-simulate'
      ], function(Y) {
        done();
      });
    });

    beforeEach(function() {
      container = Y.Node.create('<div id="container"></div>');
      Y.one('body').prepend(container);
      tabview = new Y.juju.widgets.browser.TabView();
    });

    afterEach(function() {
      container.remove(true);
    });

    it('exists', function() {
      assert.isObject(tabview);
    });

    it('can be rendered horizontally', function() {
      assert.isFalse(tabview.get('vertical'));

      tabview.render(container);
      assert.isNull(container.one('.vertical'));
    });

    it('can be rendered vertically', function() {
      tabview = new Y.juju.widgets.browser.TabView({vertical: true});
      assert.isTrue(tabview.get('vertical'));

      tabview.render(container);
      assert.isObject(container.one('.vertical'));
    });
  });

})();
