'use strict';

describe.only('tabview', function() {
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
    var tab = new Y.juju.browser.widgets.Tab(),
        tabview = new Y.juju.browser.widgets.TabView();
    assert.isObject(tab);
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

  it('accepts tab data', function() {
    var tabview = new Y.juju.browser.widgets.TabView({
      children: [
        {
          label: 'foo',
          content: 'this is foo'
        }, {
          label: 'bar',
          content: 'this is bar'
        }]
    });

    tabview.render(container);
    var text = container.get('text');
    assert.notEqual(-1, text.indexOf('foo'));
    assert.notEqual(-1, text.indexOf('bar'));
    assert.notEqual(-1, text.indexOf('this is foo'));
    assert.notEqual(-1, text.indexOf('this is bar'));
  });

  it('calls callbacks if provided when a tab is focused', function() {
    var callback_called = false,
        tabview = new Y.juju.browser.widgets.TabView({
          children: [
            {
              label: 'foo',
              content: 'this is foo'
            }, {
              label: 'bar',
              content: 'this is bar',
              callback: function() {
                callback_called = true;
            }
            }]
        });
    tabview.render(container);
    var bar = container.all('li').slice(1,2).item(0);
    bar.simulate('click');
    assert.isTrue(callback_called);
  });

  it('only calls the callback the first time', function() {
    var num_calls = 0,
        tabview = new Y.juju.browser.widgets.TabView({
          children: [
            {
              label: 'foo',
              content: 'this is foo'
            }, {
              label: 'bar',
              content: 'this is bar',
              callback: function() {
                num_calls = num_calls + 1;
            }
            }]
        });
    tabview.render(container);
    var foo = container.one('li');
    assert.equal(foo.get('text'), 'foo');
    var bar = container.all('li').slice(1,2).item(0);
    bar.simulate('click');
    assert.equal(1, num_calls);
    foo.simulate('click');
    bar.simulate('click');
    assert.equal(1, num_calls);
  });
});
