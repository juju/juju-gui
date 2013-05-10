'use strict';


(function() {

  describe('tabview', function() {
    var container, Y, tabview, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-tests-utils',
        'browser-tabview', 'node', 'node-event-simulate'
      ], function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      container = utils.makeContainer('container');
      tabview = new Y.juju.widgets.browser.TabView();
    });

    afterEach(function() {
      container.remove(true);
      tabview.destroy();
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
