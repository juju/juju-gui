'use strict';

describe.only('charm container widget', function() {
  var container, Y, charm_container;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'array',
      'browser-charm-container',
      'browser-charm-small',
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
    container.remove(true);
    if (charm_container) {
      charm_container.destroy();
    }
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
    var charms = container.all('.yui3-charmsmall'),
        shown_charms = charms.slice(0, 3),
        hidden_charms = charms.slice(3, 4);
    assert.equal(3, shown_charms.size());
    assert.equal(1, hidden_charms.size());
    Y.Array.each(shown_charms, function(charm) {
      assert.isFalse(charm.hasClass('yui3-charmsmall-hidden'));
    });
    Y.Array.each(hidden_charms, function(charm) {
      assert.isTrue(charm.hasClass('yui3-charmsmall-hidden'));
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
    assert.equal('See 1 more', container.one('.expand').get('text'));
  });

  it('toggle between all or a just few items being shown', function() {
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
    var hidden = container.all('.yui3-charmsmall-hidden');
    assert.equal(1, hidden.size());
    container.one('.expand').simulate('click');
    hidden = container.all('.yui3-charmsmall-hidden');
    assert.equal(0, hidden.size());
    assert.equal('See less', container.one('.expand').get('text'));

    container.one('.expand').simulate('click');
    hidden = container.all('.yui3-charmsmall-hidden');
    assert.equal(1, hidden.size());
    assert.equal('See 1 more', container.one('.expand').get('text'));
  });
});
