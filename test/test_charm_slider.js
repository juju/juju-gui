'use strict';

describe('charm slider', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-charm-slider'], function(Y) {
          done();
        });
  });

  beforeEach(function() {
    container = Y.Node.create('<div id="container"></div>');
    Y.one(document.body).prepend(charm_container);
  });

  afterEach(function() {
    Y.one('#container').remove(true);
  });

  it('should initialize', function() {
    var slider = new Y.juju.widgets.browser.CharmSlider();
    assert.isObject(slider);
  });
