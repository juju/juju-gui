'use strict';


describe('browser search widget', function() {
  var Y, container, Search;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['browser-search-widget',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {
      Search = Y.juju.widgets.browser.Search;
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

  it('needs to render from the template', function() {
    var search = new Search();
    search.render(container);
    assert.isObject(container.one('.search-container'));
    assert.isObject(container.one('.bws-icon'));
  });

  it('should support search change events', function(done) {
    // Need a small timeout for the valueChange to pick up the change in the
    // search input.
    this.timeout(200);
    var search = new Search();
    search.render(container);

    var triggered = false;

    search.on(search.EVT_SEARCH_CHANGED, function(ev) {
      triggered = true;
      // now trigger the event and make sure that it fired to our custom
      // watcher outside the widget.
      triggered.should.eql(true);
      done();
    });

    var input = container.one('input');
    input.focus();
    input.set('value', 'test');
  });

  it('should support setting search string', function() {
    var search = new Search();
    search.render(container);

    search.updateSearch('test');
    container.one('input').get('value').should.eql('test');
  });

  it('should supports clearing search string', function() {
    var search = new Search({
      term: 'test'
    });
    search.render(container);
    container.one('input').get('value').should.eql('test');

    search.clearSearch();
    container.one('input').get('value').should.eql('');
  });

  it('should supports clearing search string', function() {
    var search = new Search({
      term: 'test'
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
