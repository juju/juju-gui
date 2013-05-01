'use strict';

describe('filter widget', function() {
  var container, handle, instance, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-filter-widget', 'node-event-simulate'], function(Y) {
          done();
        });
  });

  beforeEach(function() {
    container = Y.Node.create('<div></div>');
    Y.one(document.body).prepend(container);
    instance = new Y.juju.widgets.browser.Filter({
      filters: {
        text: 'foo',
        type: ['approved'],
        category: ['databases', 'app-servers']
      }
    });
  });

  afterEach(function() {
    container.remove(true);
    if (handle) {
      handle.detach();
    }
    if (instance) {
      instance.destroy();
    }
  });

  it('initializes correctly', function() {
    assert.isObject(instance.get('filters'));
    var categories = instance.get('category');

    instance.get('category')[0].value.should.eql('databases');
    instance.get('category')[0].name.should.eql('Databases');
    instance.get('category')[0].checked.should.eql(true);

    instance.get('type')[0].name.should.eql('Reviewed Charms');
    instance.get('type')[0].value.should.eql('approved');
    instance.get('type')[0].checked.should.eql(true);
  });

  it('renders provided filters', function() {
    instance.render(container);

    var checked = container.all('input[checked="checked"]');
    assert(checked.size() === 3);
  });

  it('checking an input fires a search changed event', function(done) {

    instance.render(container);

    handle = instance.on(instance.EV_FILTER_CHANGED, function(ev) {
      assert.isObject(ev.change);
      ev.change.field.should.eql('type');
      ev.change.value.should.eql([]);
      done();
    });

    var ftype = container.one('input[value="approved"]');
    ftype.simulate('click');
  });

  it('checking input not in current filters fires correctly', function(done) {

    instance.render(container);

    handle = instance.on(instance.EV_FILTER_CHANGED, function(ev) {
      assert.isObject(ev.change);
      ev.change.field.should.eql('series');
      ev.change.value.should.eql(['precise']);
      done();
    });

    var ftype = container.one('input[value="precise"]');
    ftype.simulate('click');
  });

  it('unchecking an input fires a search changed event', function(done) {
    instance.render(container);

    handle = instance.on(instance.EV_FILTER_CHANGED, function(ev) {
      assert.isObject(ev.change);
      ev.change.field.should.eql('category');
      ev.change.value.should.eql(['app-servers']);
      done();
    });

    var ftype = container.one('input[value="databases"]');
    ftype.simulate('click');
  });

});
