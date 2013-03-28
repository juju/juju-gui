'use strict';


describe('charm small widget', function() {
  var charm_container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-charm-small', 'node-event-simulate'], function(Y) {
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
    assert.equal(charm.get('name'), '');
    assert.equal(charm.get('description'), '');
    assert.equal(charm.get('iconfile'), '');
  });

  it('should render with name, rating, and description', function() {
    var cfg = {
      name: 'some-charm',
      description: 'some description',
      commits: 1,
      downloads: 1
      providers: [] 
    };
    var charm = new Y.juju.widgets.browser.CharmSmall(cfg);
    charm.render(charm_container);
    var rendered_charm = Y.one('.yui3-charmsmall');
    assert.equal('some-charm', rendered_charm.one('.title a').get('text'));
    assert.equal(
        'some description',
        rendered_charm.one('.description').get('text'));
    assert.equal('1', rendered_charm.one('.rating').get('text'));
  });
});
