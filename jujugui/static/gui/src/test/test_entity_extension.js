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

describe('Entity Extension', function() {
  var Y, EntityModel, entityModel, models, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
        'juju-models',
        'juju-tests-utils'
      ],
      function(Y) {
        models = Y.namespace('juju.models');
        utils = Y.namespace('juju-tests.utils');
        done();
      }
    );
  });

  beforeEach(function() {
    EntityModel = Y.Base.create('entity-model', Y.Base,
                                [models.EntityExtension], {});
    entityModel = new EntityModel();
    var attrs = {
      id: '~owner/foobar',
      name: 'foo-bar',
      downloads: '0',
      is_approved: false,
      revisions: [],
      url: 'http://example.com/'
    };
    entityModel.setAttrs(attrs);
  });

  /*
  afterEach(function() {
    entityModel.destroy();
  });
  */

  it('parses owner from the ID', function() {
    assert.equal('owner', entityModel.ownerFromId(),
                 'owner was not extracted properly from the ID');
  });

  it('defaults to charmers when owner is not in ID', function() {
    entityModel.set('id', 'foobar');
    assert.equal('charmers', entityModel.ownerFromId(),
                 'default owner was not set to "charmers"');
  });

  it('converts a charm to an entity POJO', function() {
    var attrs = {
      entityType: 'charm',
      series: 'trusty',
      categories: {0: 'database', 1: 'application'},
    };
    var iconPath = '/' + entityModel.get('id') + '/icon.svg';
    utils.makeStubMethod(utils, 'getIconPath', iconPath);
    entityModel.setAttrs(attrs);
    var entity = entityModel.toEntity();
    var expected = {
      displayName: 'foo bar',
      downloads: '0',
      id: '~owner/foobar',
      name: 'foo-bar',
      owner: 'owner',
      promulgated: false,
      revisions: [],
      special: undefined,
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
    utils.makeStubMethod(entityModel, 'parseBundleServices', []);
    var attrs = {
      id: 'foobar',
      owner: 'foobar-charmers',
      entityType: 'bundle',
      services: [],
    };
    entityModel.setAttrs(attrs);
    var entity = entityModel.toEntity();
    var expected = {
      displayName: 'foo bar',
      downloads: '0',
      id: 'foobar',
      name: 'foo-bar',
      owner: 'foobar-charmers',
      promulgated: false,
      revisions: [],
      special: undefined,
      type: 'bundle',
      url: 'http://example.com/',
      iconPath: '/juju-ui/assets/images/non-sprites/bundle.svg',
      services: []
    };
    assert.deepEqual(expected, entity,
                     'bundle POJO did not match expected object');
  });
});
