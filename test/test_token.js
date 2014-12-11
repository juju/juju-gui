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
    token_container = utils.makeContainer(this, 'token-container');
  });

  afterEach(function() {
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
      id: 'cs:bundle/foo'
    });

    assert.equal(bundleToken.get('type'), 'bundle');
  });

  it('can render bundles', function() {
    var token = new Token({
      size: 'small'
    });

    token.render(token_container);
    assert(token_container.one('.token'));
  });

  it('renders a bundle token properly with data', function() {
    var token = new Token({
      id: 'cs:bundle/foo',
      downloads: 5,
      serviceCount: 4,
      size: 'small',
      unitCount: 5
    });

    token.render(token_container);
    assert.notEqual(
        token_container.get('innerHTML').indexOf('4 services'),
        -1
    );
    assert.notEqual(
        token_container.get('innerHTML').indexOf('5 units'),
        -1
    );
    assert.notEqual(
        token_container.get('innerHTML').indexOf('Deployed 5 times'),
        -1
    );
    assert.notEqual(
        token_container.one('a').getData('charmid').indexOf('/'),
        -1
    );
  });

  it('Renders the proper charm icons into the token', function() {
    var bundleData = {
      haproxy: {
        id: 'precise/haproxy-18',
        is_approved: true,
        name: 'haproxy'
      },
      mediawiki: {
        id: 'precise/mediawiki-10',
        is_approved: true,
        name: 'mediawiki'
      },
      memcached: {
        id: 'precise/memcached-7',
        is_approved: true,
        name: 'memcached'
      },
      mysql: {
        id: 'precise/mysql-27',
        is_approved: true,
        name: 'mysql'
      }
    };
    var token = new Token({
      id: 'cs:bundle/foo',
      size: 'small',
      services: bundleData
    });
    // The token needs to be rendered for the attributes to be set???
    token.render(token_container);

    var expected = [
      'haproxy',
      'mediawiki',
      'memcached',
      'mysql'
    ];
    var images = token_container.one('span.charms').all('img');
    var names = images.getDOMNodes().map(function(image) {
      return Y.one(image).getAttribute('alt');
    });
    assert.deepEqual(names, expected);
    assert.equal(images.size(), 4);
  });

  it('renders the deployer button when asked to', function() {
    var token = new Token({
      size: 'tiny',
      id: 'test',
      deployButton: true,
      description: 'some description',
      mainCategory: 'app-servers',
      iconUrl: 'http://localhost.svg'
    });

    token.render(token_container);
    assert.notEqual(
        token_container.get('innerHTML').indexOf('deployButton'),
        -1
    );

    var button = token_container.one('.deployButton');
    var sprite = button.one('i');
    assert.equal(sprite.getAttribute('data-charmid'), 'test');
  });

});
