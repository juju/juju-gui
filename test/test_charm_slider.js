'use strict';

describe.only('charm slider', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-charm-slider', 'browser-charm-small', 'node'], function(Y) {
          done();
        });
  });

  beforeEach(function() {
    container = Y.Node.create('<div id="container"></div>');
    Y.one(document.body).prepend(container);
  });

  afterEach(function() {
    Y.one('#container').remove(true);
  });

  it('initializes', function() {
    var cs = new Y.juju.widgets.browser.CharmSlider();
    assert.isObject(cs);
  });

  it('creates the right DOM', function() {
    var cs = new Y.juju.widgets.browser.CharmSlider(),
        items = ['foo', 'bar', 'baz'];
    cs.set('items', items);
    var sliderDOM = cs._generateDOM();
    assert.equal(3, sliderDOM.all('li').size());
    var html = sliderDOM.get('outerHTML');
    Y.Array.each(items, function(item) {
      assert.notEqual(-1, html.indexOf(item)); 
    });
  });

  it('renders', function() {
    var cs = new Y.juju.widgets.browser.CharmSlider({
      items: ['<div id="foo"/>'] 
    });
    cs.render(this.container);
    assert.isObject(Y.one('#foo'));
  });
});
