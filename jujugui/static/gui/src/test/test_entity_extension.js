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

const charmstore = require('../app/jujulib/charmstore');

describe('Entity Extension', function() {
  var Y, EntityModel, entityModel, jujuConfig, models, utils, windowJujulib;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-models',
      'juju-tests-utils'
    ], function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    windowJujulib = window.jujulib;
    window.jujulib = {
      charmstoreAPIVersion: charmstore.charmstoreAPIVersion
    };
    jujuConfig = window.juju_config;
    EntityModel = Y.Base.create(
      'entity-model', Y.Base, [models.EntityExtension], {});
    entityModel = new EntityModel();
    var attrs = {
      id: '~owner/foobar',
      storeId: 'cs:~owner/foobar-132',
      owner: 'owner',
      name: 'foo-bar-entity',
      description: 'A test description.',
      revision_id: 132,
      downloads: '0',
      is_approved: false,
      revisions: [],
      url: 'http://example.com/',
      price: '8',
      supported: true,
      supportedDescription: 'supported description'
    };
    entityModel.setAttrs(attrs);
  });

  afterEach(function() {
    window.jujulib = windowJujulib;
    entityModel.destroy();
    window.juju_config = jujuConfig;
  });

  it('converts a charm to an entity POJO', function() {
    var attrs = {
      entityType: 'charm',
      series: 'trusty',
      tags: ['database', 'application']
    };
    var iconPath = 'v5/' + entityModel.get('id') + '/icon.svg';
    utils.getIconPath = sinon.stub().returns(iconPath);
    entityModel.setAttrs(attrs);
    var entity = entityModel.toEntity();
    var expected = {
      description: 'A test description.',
      displayName: 'foo bar entity',
      downloads: '0',
      id: '~owner/foobar',
      revision_id: 132,
      storeId: 'cs:~owner/foobar-132',
      model: entityModel,
      name: 'foo-bar-entity',
      owner: 'owner',
      price: '8',
      promulgated: false,
      revisions: [],
      special: undefined,
      supported: true,
      supportedDescription: 'supported description',
      type: 'charm',
      url: 'http://example.com/',
      iconPath: iconPath,
      series: 'trusty',
      tags: ['database', 'application']
    };

    assert.deepEqual(expected, entity,
      'charm POJO did not match expected object');
  });

  it('converts a bundle to an entity POJO', function() {
    entityModel.parseBundleServices = sinon.stub().returns([]);
    var attrs = {
      id: 'foobar',
      owner: 'foobar-charmers',
      entityType: 'bundle',
      revision_id: '132',
      applications: [],
      machineCount: 2,
      serviceCount: 3,
      unitCount: 5,
      price: '8',
      supported: true,
      supportedDescription: 'supported description'
    };
    entityModel.setAttrs(attrs);
    var entity = entityModel.toEntity();
    var expected = {
      description: 'A test description.',
      displayName: 'foo bar entity',
      downloads: '0',
      id: 'foobar',
      revision_id: '132',
      storeId: 'cs:~owner/foobar-132',
      machineCount: 2,
      model: entityModel,
      name: 'foo-bar-entity',
      owner: 'foobar-charmers',
      price: '8',
      promulgated: false,
      revisions: [],
      special: undefined,
      supported: true,
      supportedDescription: 'supported description',
      type: 'bundle',
      url: 'http://example.com/',
      // no staticURL is defined on window.juju_config.staticURL so this
      // path should not include a staticURL prefix.
      iconPath: 'static/gui/build/app/assets/images/non-sprites/bundle.svg',
      serviceCount: 3,
      applications: [],
      unitCount: 5
    };
    assert.deepEqual(expected, entity,
      'bundle POJO did not match expected object');
  });

  it('uses the staticURL for bundle asset if available', function() {
    window.juju_config = {
      staticURL: 'static'
    };
    entityModel.parseBundleServices = sinon.stub().returns([]);
    var attrs = {
      id: 'foobar',
      owner: 'foobar-charmers',
      entityType: 'bundle',
      services: []
    };
    entityModel.setAttrs(attrs);
    var entity = entityModel.toEntity();
    assert.deepEqual(
      entity.iconPath,
      'static/static/gui/build/app/assets/images/non-sprites/bundle.svg');
  });

  it('uses the correct name for the canonical-kubernetes bundle', function() {
    entityModel.parseBundleServices = sinon.stub().returns([]);
    entityModel.setAttrs({
      id: 'cs:~who/canonical-k8s/42',
      owner: 'foobar-charmers',
      name: 'canonical-kubernetes'
    });
    const entity = entityModel.toEntity();
    assert.strictEqual(
      entity.displayName, 'The Canonical Distribution Of Kubernetes');
  });
});
