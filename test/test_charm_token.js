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

  it('renders with correct metadata', function() {
    var cfg = {
      name: 'some-charm',
      description: 'some description',
      recent_commits: 2,
      recent_downloads: 3,
      tested_providers: ['ec2']
    };
    var charm = new Y.juju.widgets.browser.CharmToken(cfg);
    charm.render(charm_container);
    var metadata = Y.one('.metadata');
    assert.equal(
        ' Recent activity: 2 commits 3 downloads ',
        metadata.get('text').replace(/\s+/g, ' '));
  });
});
