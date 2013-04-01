'use strict';


describe('charm token', function() {
  var charm_container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-charm-token', 'node-event-simulate'], function(Y) {
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

  it('exists', function() {
    var charm = new Y.juju.widgets.browser.CharmToken();
    assert.isObject(charm);
  });

  it('renders with the right metadata', function() {
    var cfg = {
      name: 'some-charm',
      description: 'some description',
      recent_commits: 1,
      recent_downloads: 1,
      tested_providers: ['ec2']
    };
    var charm = new Y.juju.widgets.browser.CharmToken(cfg);
    charm.render(charm_container);
    var rendered_charm = Y.one('.yui3-charmtoken');
    assert.equal('some-charm', rendered_charm.one('.title a').get('text'));
    assert.equal(
        'some description',
        rendered_charm.one('.description').get('text'));
    assert.equal(
        '1', rendered_charm.one('.downloads').get('text'),
        'Wrong number of downloads.');
    assert.equal(
        '1', rendered_charm.one('.commits').get('text'),
        'Wrong number of commits.');
    var actual_url = rendered_charm.one('.providers').one('img').get('src');
    assert.equal(
        actual_url.split('/').slice(3).join('/'),
        'juju-ui/assets/svgs/provider-ec2.svg');
  });
});
