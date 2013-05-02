'use strict';


describe('charm token', function() {
  var charm_container, CharmToken, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-charm-token', 'node-event-simulate'], function(Y) {
          CharmToken = Y.juju.widgets.browser.CharmToken;
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
    var charm = new CharmToken();
    assert.isObject(charm);
  });

  it('renders with correct metadata', function() {
    var cfg = {
      id: 'test',
      name: 'some-charm',
      description: 'some description',
      recent_commit_count: 1,
      recent_download_count: 3,
      tested_providers: ['ec2']
    };
    var charm = new CharmToken(cfg);
    charm.render(charm_container);
    var metadata = Y.one('.metadata');
    assert.equal(
        ' 3 downloads, 1 commit ',
        metadata.get('text').replace(/\s+/g, ' '));
    charm.get('boundingBox').getAttribute('id').should.not.eql('test');
  });

  it('sets a default of small size', function() {
    var charm = new CharmToken();
    charm.get('size').should.eql('small');

    // and the css class should be on the token once rendered.
    charm.render(charm_container);
    charm_container.one('.charm-token').hasClass('small').should.equal(true);
  });

  it('allows setting a large size', function() {
    var charm = new CharmToken({
      size: 'large'
    });
    charm.get('size').should.eql('large');

    // and the css class should be on the token once rendered.
    charm.render(charm_container);
    charm_container.one('.charm-token').hasClass('large').should.equal(true);
  });


});
