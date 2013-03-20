'use strict';

describe.only('tabview', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-juju-tabview', 'node', 'node-event-simulate'], function(Y) {
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

  it('exists');

  it('can be rendered horizontally');

  it('can be rendered vertically');

  it('accepts tabs');

  it('accepts no tabs');

  it('calls callbacks if provided when a tab is focused');

  it('only calls the callback the first time');
});
