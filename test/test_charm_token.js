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

  it('has the right metadata', function() {
    var cfg = {
      name: 'some-charm',
      description: 'some description',
      recent_commits: 1,
      recent_downloads: 1,
      tested_providers: ['ec2']
    };
    var charm = new Y.juju.widgets.browser.CharmToken(cfg),
        expected = cfg;
    expected.tested_providers = [{name: 'ec2'}];
    assert.equal(expected, charm._getTemplateAttrs(charm.getAttrs()));

  });

  it('renders with provider icons', function() {
    var cfg = {
      name: 'some-charm',
      description: 'some description',
      recent_commits: 1,
      recent_downloads: 1,
      tested_providers: ['ec2']
    };
    var charm = new Y.juju.widgets.browser.CharmToken(cfg);
    charm.render(charm_container);
    var actual_url = Y.one(
        '.yui3-charmtoken').one('.providers').one('img').get('src');
    assert.equal(
        actual_url.split('/').slice(3).join('/'),
        'juju-ui/assets/svgs/provider-ec2.svg');
  });
});
