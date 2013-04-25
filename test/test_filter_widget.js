'use strict';

describe('filter widget', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-filter-widget', 'node-event-simulate'], function(Y) {
          done();
        });
  });

  beforeEach(function() {
    container = Y.Node.create('<div></div>');
    Y.one(document.body).prepend(container);
  });

  afterEach(function() {
    container.remove(true);
  });

  it.only('exists', function() {
    var filter = new Y.juju.widgets.browser.Filter();
    assert.isObject(filter);
  });
});
