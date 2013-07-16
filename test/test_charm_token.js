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


describe.only('charm token', function() {
  var charm_container, CharmToken, cleanIconHelper, token, utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-charm-token', 'node-event-simulate',
         'juju-tests-utils'], function(Y) {
          CharmToken = Y.juju.widgets.browser.CharmToken;
          utils = Y.namespace('juju-tests.utils');
          cleanIconHelper = utils.stubCharmIconPath();
          done();
        });
  });

  beforeEach(function() {
    charm_container = utils.makeContainer('charm-container');
  });

  afterEach(function() {
    charm_container.remove(true);
    if (token) {
      token.destory();
    }
  });

  after(function() {
    cleanIconHelper();
  });

  it('exists', function() {
    var token = new CharmToken();
    assert.isObject(token);
  });

  it('renders with correct metadata', function() {
    var cfg = {
      id: 'test',
      name: 'some-charm',
      description: 'some description',
      commitCount: 1,
      downloads: 3,
      tested_providers: ['ec2']
    };
    var token = new CharmToken(cfg);
    token.render(charm_container);
    var metadata = charm_container.one('.metadata');
    assert.equal(
        ' 3 downloads, 1 commit ',
        metadata.get('text').replace(/\s+/g, ' '));
    token.get('boundingBox').getAttribute('id').should.not.eql('test');
  });

  it('sets a default of small size', function() {
    var token = new CharmToken();
    token.get('size').should.eql('small');

    // and the css class should be on the token once rendered.
    token.render(charm_container);
    charm_container.one('.charm-token').hasClass('small').should.equal(true);
  });

  it('allows setting a large size', function() {
    var token = new CharmToken({
      size: 'large'
    });
    token.get('size').should.eql('large');

    // and the css class should be on the token once rendered.
    token.render(charm_container);
    charm_container.one('.charm-token').hasClass('large').should.equal(true);
  });

  it('allows setting a tiny size', function() {
    var token = new CharmToken({
      size: 'tiny',
      description: 'some description',
      mainCategory: 'app-servers',
      commitCount: 1,
      downloads: 3
    });
    assert.equal('tiny', token.get('size'));

    // and the css class should be on the token once rendered.
    token.render(charm_container);
    assert(charm_container.one('.charm-token').hasClass('tiny'));
  });

});
