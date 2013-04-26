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
    var filter = new Y.juju.widgets.browser.Filter();
    assert.isObject(filter);
    assert.isObject(filter.get('data'));
  });

  it('renders provided filter names', function() {
    var filter_data = {
      categories: {
        test: 'foo'
      },
      providers: {
        test: 'bar'
      },
      series: {
        test: 'spoo'
      },
      types: {
        test: 'fleem'
      }
    };
    var filter = new Y.juju.widgets.browser.Filter(filter_data);
    filter.render(container);

    var checkboxes = container.all('input');
    assert.equal(4, checkboxes.size());
    checkboxes.each(function(box) {
      assert.equal('test', box.get('value'));
    });
    ['foo', 'bar', 'spoo', 'fleem'].map(function(item) {
      assert.notEqual(-1, container.get('text').indexOf(item));
    });
  });

  it('renders checkboxes selected when appropriate');
  it('keeps track of selected checkboxes');
  it('notifies listeners when the filters have been submitted');
});
