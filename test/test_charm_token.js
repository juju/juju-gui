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


describe('charm token', function() {
  var charm_container, CharmToken, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-charm-token', 'node-event-simulate',
         'juju-tests-utils'], function(Y) {
          CharmToken = Y.juju.widgets.browser.CharmToken;
          done();
        });
  });

  beforeEach(function() {
    charm_container = Y.namespace('juju-tests.utils')
                       .makeContainer('charm-container');
  });

  afterEach(function() {
    charm_container.remove(true);
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

  it('sets an icon per the category if available', function() {
    var cfg = {
      id: 'test',
      name: 'some-charm',
      description: 'some description',
      mainCategory: 'app-servers',
      recent_commit_count: 1,
      recent_download_count: 3,
      tested_providers: ['ec2']
    };

    var charm = new CharmToken(cfg);
    charm.render(charm_container);
    var iconNode = Y.one('.category-icon');
    assert.equal(iconNode.hasClass('charm-app-servers-64'), true);
  });

  it('sets an icon per the category respecting size', function() {
    var cfg = {
      id: 'test',
      name: 'some-charm',
      description: 'some description',
      mainCategory: 'app-servers',
      recent_commit_count: 1,
      recent_download_count: 3,
      size: 'large',
      tested_providers: ['ec2']
    };

    var charm = new CharmToken(cfg);
    charm.render(charm_container);
    var iconNode = Y.one('.category-icon');
    assert.equal(iconNode.hasClass('charm-app-servers-96'), true);
  });

});
