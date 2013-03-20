'use strict';

describe('tabview', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-tabview', 'node', 'node-event-simulate'], function(Y) {
          done();
        });
  });

  beforeEach(function() {
    container = Y.Node.create('<div id="container"></div>');
    Y.one('body').prepend(container);
  });

  afterEach(function() {
    container.remove(true);
  });

  it('exists', function() {
    var tabview = new Y.juju.browser.widgets.TabView();
    assert.isObject(tabview);
  });

  it('can be rendered horizontally', function() {
    var tabview = new Y.juju.browser.widgets.TabView();
    assert.isFalse(tabview.get('vertical'));

    tabview.render(container);
    assert.isNull(container.one('.vertical'));
  });

  it('can be rendered vertically', function() {
    var tabview = new Y.juju.browser.widgets.TabView({vertical: true});
    assert.isTrue(tabview.get('vertical'));

    tabview.render(container);
    assert.isObject(container.one('.vertical'));
  });
});
