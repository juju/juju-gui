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
    var slider = new Y.juju.widgets.browser.CharmSlider();
    assert.isObject(slider);
  });

  it('renders the charm small widgets its given', function() {
    var charm = new Y.juju.widgets.browser.CharmSmall(); 
    var cfg = {charms: [charm]};
    var slider = new Y.juju.widgets.browser.CharmSlider(cfg);
    slider.render(container);
    assert.isObject(Y.one('.yui3-charmslider'));
    assert.isObject(Y.one('.yui3-charmsmall'));
  });

  it('only shows one charm small widget at a time');

  it('automatically scrolls through its charms');

  it('has one button for each charm');

  it('scrolls to charms when buttons are clicked');
});
