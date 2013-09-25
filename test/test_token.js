/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';


describe('charm/bundle token', function() {
  var token_container, Token, cleanIconHelper, token, utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-token', 'node-event-simulate',
         'juju-tests-utils'], function(Y) {
          Token = Y.juju.widgets.browser.Token;
          utils = Y.namespace('juju-tests.utils');
          cleanIconHelper = utils.stubCharmIconPath();
          done();
        });
  });

  beforeEach(function() {
    token_container = utils.makeContainer('token-container');
  });

  afterEach(function() {
    token_container.remove(true);
    if (token) {
      token.destory();
    }
  });

  after(function() {
    cleanIconHelper();
  });

  it('exists', function() {
    var token = new Token();
    assert.isObject(token);
  });

  it('renders with correct metadata as approved charm', function() {
    var cfg = {
      id: 'test',
      name: 'some-charm',
      description: 'some description',
      commitCount: 1,
      downloads: 3,
      is_approved: true,
      owner: 'rharding',
      series: 'precise',
      tested_providers: ['ec2']
    };
    var token = new Token(cfg);
    token.render(token_container);
    var metadata = token_container.one('.metadata');
    assert.equal(
        ' Deployed 3 times precise | Recommended ',
        metadata.get('text').replace(/\s+/g, ' '));
    token.get('boundingBox').getAttribute('id').should.not.eql('test');
  });

  it('renders with correct metadata as non approved charm', function() {
    var cfg = {
      id: 'test',
      name: 'some-charm',
      description: 'some description',
      commitCount: 1,
      downloads: 3,
      is_approved: false,
      owner: 'rharding',
      series: 'precise',
      tested_providers: ['ec2']
    };
    var token = new Token(cfg);
    token.render(token_container);
    var metadata = token_container.one('.metadata');
    assert.equal(
        ' Deployed 3 times precise | rharding ',
        metadata.get('text').replace(/\s+/g, ' '));
    token.get('boundingBox').getAttribute('id').should.not.eql('test');
  });

  it('sets a default of small size', function() {
    var token = new Token();
    token.get('size').should.eql('small');

    // and the css class should be on the token once rendered.
    token.render(token_container);
    token_container.one('.token').hasClass('small').should.equal(true);
  });

  it('allows setting a large size', function() {
    var token = new Token({
      size: 'large'
    });
    token.get('size').should.eql('large');

    // and the css class should be on the token once rendered.
    token.render(token_container);
    token_container.one('.token').hasClass('large').should.equal(true);
  });

  it('allows setting a tiny size', function() {
    var token = new Token({
      size: 'tiny',
      description: 'some description',
      mainCategory: 'app-servers',
      commitCount: 1,
      downloads: 3
    });
    assert.equal('tiny', token.get('size'));

    // and the css class should be on the token once rendered.
    token.render(token_container);
    assert(token_container.one('.token').hasClass('tiny'));
  });

  it('allows overriding the charm icon url', function() {
    var token = new Token({
      size: 'tiny',
      description: 'some description',
      mainCategory: 'app-servers',
      iconUrl: 'http://localhost.svg'
    });

    token.render(token_container);
    assert.equal(
        token_container.one('img').getAttribute('src'),
        'http://localhost.svg');
  });

  it('can report that it represents a charm', function() {
    var charmToken = new Token({
      size: 'tiny',
      description: 'some description',
      mainCategory: 'app-servers',
      iconUrl: 'http://localhost.svg'
    });

    assert.equal(charmToken.get('type'), 'charm');
  });

  it('can report that it represents a bundle', function() {
    var bundleToken = new Token({
      size: 'small',
      basket_name: 'BASKET-NAME'
    });

    assert.equal(bundleToken.get('type'), 'bundle');
  });

  it('can render bundles', function() {
    var token = new Token({
      size: 'small',
      basket_name: 'BASKET-NAME'
    });

    token.render(token_container);
    assert.match(token_container.getHTML(), /This is a bundle token./);
  });

});
