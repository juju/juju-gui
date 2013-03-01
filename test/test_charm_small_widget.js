'use strict';


describe('charm small widget', function() {
  var charm_container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['browser-charm-small', 'node-event-simulate'], function(Y) {
          done();
        });
  });

  beforeEach(function() {
    charm_container = Y.Node.create('<div id="charm-container"></div>');
    Y.one(document.body).prepend(charm_container);
  });

  afterEach(function() {
    Y.one('#charm-container').remove(true);
  });

  it('should initialize', function() {
    var charm = new Y.juju.widgets.browser.CharmSmall();
    assert.isObject(charm);
    assert.equal(charm.get('title'), '');
    assert.equal(charm.get('description'), '');
    assert.equal(charm.get('rating'), 0);
    assert.equal(charm.get('iconfile'), '');
  });

  it('should render with name, rating, and description', function() {
    var cfg = {
      title: 'some-charm',
      description: 'some description',
      rating: 1
    };
    var charm = new Y.juju.widgets.browser.CharmSmall(cfg);
    charm.render(charm_container);
    var rendered_charm = Y.one('.yui3-charmsmall');
    assert.equal('some-charm', rendered_charm.one('.title').get('text'));
    assert.equal(
        'some description',
        rendered_charm.one('.description').get('text'));
    assert.equal('1', rendered_charm.one('.rating').get('text'));
  });

  it('should show an add button on hover', function() {
    var charm = new Y.juju.widgets.browser.CharmSmall();
    charm.render(charm_container);
    var rendered_charm = Y.one('.yui3-charmsmall');
    var add_button = rendered_charm.one('button');
    assert.isTrue(
        add_button.hasClass('hidden'),
        'Button did not start out hidden');
    rendered_charm.simulate('mouseover');
    assert.isFalse(
        add_button.hasClass('hidden'),
        'Button did not become revealed on mouseover');
    rendered_charm.simulate('mouseout');
    assert.isTrue(
        add_button.hasClass('hidden'),
        'Button did not become hidden on mouseout');
  });
});
