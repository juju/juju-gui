'use strict';

describe('charm container widget', function() {
  var container, Y, charm_container;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'array',
      'browser-charm-container',
      'browser-charm-token',
      'node-event-simulate'],
    function(Y) {
      done();
    });
  });

  beforeEach(function() {
    container = Y.Node.create('<div id="container"></div>');
    Y.one(document.body).prepend(charm_container);
  });

  afterEach(function() {
    if (charm_container) {
      charm_container.destroy();
    }
    container.remove().destroy(true);
  });

  it('sets up values according to children and its cutoff', function() {
    charm_container = new Y.juju.widgets.browser.CharmContainer({
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    assert.equal(3, charm_container.get('cutoff'));
    assert.equal(1, charm_container.get('extra'));
  });

  it('only shows items up to the cutoff at first', function() {
    charm_container = new Y.juju.widgets.browser.CharmContainer({
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    charm_container.render(container);
    var charms = container.all('.yui3-charmtoken'),
        shown_charms = charms.slice(0, 3),
        hidden_charms = charms.slice(3, 4);
    Y.Array.each(shown_charms, function(charm) {
      assert.isFalse(charm.hasClass('yui3-charmtoken-hidden'));
    });
    Y.Array.each(hidden_charms, function(charm) {
      assert.isTrue(charm.hasClass('yui3-charmtoken-hidden'));
    });
  });

  it('renders', function() {
    charm_container = new Y.juju.widgets.browser.CharmContainer({
      name: 'Popular',
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    charm_container.render(container);
    assert.equal('Popular', container.one('h3').get('text'));
    assert.isFalse(container.one('.more').hasClass('hidden'));
    assert.isTrue(container.one('.less').hasClass('hidden'));
  });

  it('toggles between all or a just few items being shown', function() {
    var hidden;
    charm_container = new Y.juju.widgets.browser.CharmContainer({
      name: 'Popular',
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    charm_container.render(container);

    container.one('.expand').simulate('click');
    hidden = container.all('.yui3-charmtoken-hidden');
    assert.equal(
        0, hidden.size(),
        'Hidden items after all items should be visible.');
    assert.isFalse(container.one('.less').hasClass('hidden'));
    assert.isTrue(container.one('.more').hasClass('hidden'));

    container.one('.expand').simulate('click');
    hidden = container.all('.yui3-charmtoken-hidden');
    assert.equal(
        1, hidden.size(),
        'No hidden items after extra items should be hidden.');
    assert.isTrue(container.one('.less').hasClass('hidden'));
    assert.isFalse(container.one('.more').hasClass('hidden'));
  });

  it('handles having no charm tokens', function() {
    charm_container = new Y.juju.widgets.browser.CharmContainer({name: 'Foo'});
    charm_container.render(container);
    var rendered = container.one('.yui3-charmcontainer');
    assert.equal('Foo', rendered.one('h3').get('text'));
  });

  it('handles having less charms tokens than its cutoff', function() {
    charm_container = new Y.juju.widgets.browser.CharmContainer({
      name: 'Popular',
      cutoff: 6,
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    charm_container.render(container);

    var rendered = container.one('.yui3-charmcontainer');
    assert.equal('Popular', rendered.one('h3').get('text'));
    assert.equal(4, container.all('.yui3-charmtoken').size());
    assert.equal(0, container.all('.yui3-charmtoken-hidden').size());
    assert.equal(1, charm_container._events.length);
    assert.isNull(rendered.one('.expand'));
  });
});
