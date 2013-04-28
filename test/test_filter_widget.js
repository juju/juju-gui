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

  it('initializes correctly', function() {
    var filter = new Y.juju.widgets.browser.Filter({
      filters: {
        text: 'foo',
        type: 'approved',
        category: ['databases', 'app_servers']
      }
    });
    assert.isObject(filter.get('filters'));
    var categories = filter.get('category');

    filter.get('category')[0].value.should.eql('databases');
    filter.get('category')[0].name.should.eql('Databases');
    filter.get('category')[0].checked.should.eql(true);

    filter.get('type')[0].name.should.eql('Reviewed Charms');
    filter.get('type')[0].value.should.eql('approved');
    filter.get('type')[0].checked.should.eql(true);
  });

  it('renders provided filters', function() {
    var filter = new Y.juju.widgets.browser.Filter({
      filters: {
        text: 'foo',
        type: ['approved'],
        category: ['databases', 'app_servers']
      }
    });
    filter.render(container);

    var checked = container.all('input[checked="checked"]');
    assert(checked.size() === 3);

  });

  it('unchecking an input fires a search changed event', function(done) {
    var filter = new Y.juju.widgets.browser.Filter({
      filters: {
        text: 'foo',
        type: ['approved'],
        category: ['databases', 'app_servers']
      }
    });
    filter.render(container);

    filter.on(filter.EV_FILTER_CHANGED, function(ev) {
      assert.isObject(ev.change);
      ev.change.field.should.eql('type');
      ev.change.value.should.eql([]);
      done();
    });

    var ftype = container.one('input[value="approved"]');
    ftype.simulate('click');
  });

  it('unchecking an input fires a search changed event', function(done) {
    var filter = new Y.juju.widgets.browser.Filter({
      filters: {
        text: 'foo',
        type: ['approved'],
        category: ['app_servers']
      }
    });
    filter.render(container);

    filter.on(filter.EV_FILTER_CHANGED, function(ev) {
      assert.isObject(ev.change);
      ev.change.field.should.eql('category');
      ev.change.value.should.eql(['app_servers', 'databases']);
      done();
    });

    var ftype = container.one('input[value="databases"]');
    ftype.simulate('click');
  });

});
