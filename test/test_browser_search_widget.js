'use strict';


describe('browser search widget', function() {
  var Y, container, Search;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['browser-search-widget',
                              'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {
      Search = Y.juju.widgets.browser.Search;
      done();
    });
  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer('container');
  });

  afterEach(function() {
    container.remove(true);
  });

  it('needs to render from the template', function() {
    var search = new Search();
    search.render(container);
    assert.isObject(container.one('.search-container'));
    assert.isObject(container.one('.bws-icon'));
  });

  it('should support setting search string', function() {
    var search = new Search();
    search.render(container);

    search.updateSearch('test');
    container.one('input').get('value').should.eql('test');
  });

  it('should support clearing search string', function() {
    var search = new Search({
      filters: {
        text: 'test'
      }
    });
    search.render(container);
    container.one('input').get('value').should.eql('test');

    search.clearSearch();
    container.one('input').get('value').should.eql('');
  });

  it('should fire a toggle fullscreen event when expand clicked', function() {
    var search = new Search(),
        triggered = false;
    search.render(container);

    search.on(search.EVT_TOGGLE_FULLSCREEN, function(ev) {
      triggered = true;
    });

    var toggle = container.one('.toggle-fullscreen');
    toggle.simulate('click');
    triggered.should.eql(true);
  });

  it('should fire a toggle viewable event when icon clicked', function() {
    var search = new Search(),
        triggered = false;
    search.render(container);

    search.on(search.EVT_TOGGLE_VIEWABLE, function(ev) {
      triggered = true;
    });

    var toggle = container.one('.bws-icon');
    toggle.simulate('click');
    triggered.should.eql(true);
  });
});
