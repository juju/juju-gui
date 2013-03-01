'use strict';

describe('charm small widget', function() {
  var charm_container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['charm-small', 'node-event-simulate'], function(Y) {
      done();
    });
  });

  beforeEach(function() {
    charm_container = Y.Node.create('<div id="charm-container"></div>');
    Y.one(document.body).prepend(charm_container);
  });

  afterEach(function() {
    Y.one("#charm-container").remove(true);
  });

  it('should initialize', function() {
    var cfg = {container: charm_container};
    var charm = new Y.juju.widgets.CharmSmall(cfg);
    assert.isObject(charm);
    assert.equal(charm.get('title'), '');
    assert.equal(charm.get('description'), '');
    assert.equal(charm.get('rating'), 0);
    assert.equal(charm.get('iconfile'), '');
    assert.equal(charm.get('container'), charm_container);
  });

  it('should render with name, rating, and description', function() {
    var cfg = {
      container: charm_container,
      title: 'some-charm',
      description: 'some description',
      rating: 1,
    };
    var charm = new Y.juju.widgets.CharmSmall(cfg);
    charm.render();
    var rendered_charm = Y.one('.charm-small');
    assert.equal('some-charm', rendered_charm.one(".charm-title").get('text'));
    assert.equal(
      'some description',
      rendered_charm.one(".charm-description").get('text'));
    assert.equal('1', rendered_charm.one(".charm-rating").get('text'));
  });
});
