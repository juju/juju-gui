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

describe('Bundle initialization', function() {
  var models;

  before(function(done) {
    YUI(GlobalConfig).use('juju-models', 'juju-bundle-models', function(Y) {
      models = Y.namespace('juju.models');
      done();
    });
  });

  it('must be able to create a bundle', function() {
    var expected = '~bac/wiki/3/wiki';
    var bundle = new models.Bundle(
        {id: expected});
    assert.equal(expected, bundle.get('id'));
  });

});

describe('The bundle model', function() {
  var charmstore, data, expected, instance, models, origData,
      utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'io',
      'juju-bundle-models',
      'juju-tests-utils',
      'charmstore-api'
    ], function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      charmstore = new window.jujulib.charmstore('local/');
      origData = charmstore._processEntityQueryData(
          utils.loadFixture('data/apiv5-bundle.json', true));
      done();
    });
  });

  beforeEach(function() {
    data = Y.clone(origData);
  });

  afterEach(function() {
    if (instance) {
      instance.destroy();
    }
  });

  it('must store the description', function() {
    expected = 'New bundle';
    data.description = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('description'));
  });

  it('must store the name', function() {
    expected = 'my-bundle';
    data.name = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('name'));
  });

  it('must store the owner', function() {
    expected = 'abentley';
    data.owner = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('owner'));
  });

  it('must store the permanent_url', function() {
    expected = 'jc:~abentley/wiki/wiki';
    data.permanent_url = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('permanent_url'));
  });

  it('must store the promulgated', function() {
    expected = true;
    data.promulgated = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('promulgated'));
  });

  it('must support is_approved as a proxy to promulgated', function() {
    instance = new models.Bundle({promulgated: true});
    assert.equal(instance.get('is_approved'), true);
  });

  it('sets is_approved if promulgated is not provided', function() {
    instance = new models.Bundle({is_approved: true});
    assert.equal(instance.get('is_approved'), true);
  });

  it('must store the title', function() {
    expected = 'My Bountiful Bundle';
    data.title = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('title'));
  });

  it('must have a relations getter', function() {
    instance = new models.Bundle(data);
    expected = [
      ['mongos:mongos', 'shard3:database'],
      ['mongos:mongos-cfg', 'configsvr:configsvr'],
      ['mongos:mongos', 'shard1:database'],
      ['mongos:mongos', 'shard2:database']
    ];
    var results = instance.get('relations');
    assert.deepEqual(results, expected);
  });

  it('must have a series getter', function() {
    expected = 'saucy';
    data.series = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('series'));
  });

  it('must have a services getter', function() {
    expected = data.services;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('services'));
  });

  it('must provide a serviceCount attribute', function() {
    instance = new models.Bundle(data);
    assert.equal(instance.get('serviceCount'), 5);
  });

  it('must provide a unitCount attribute', function() {
    instance = new models.Bundle(data);
    assert.equal(instance.get('unitCount'), 5);
  });

  it('must provide a downloads attribute', function() {
    instance = new models.Bundle(data);
    assert.equal(instance.get('downloads'), 0);
  });

  it('must init a downloads attribute to 0', function() {
    instance = new models.Bundle();
    assert.equal(instance.get('downloads'), 0);
  });

  it('has an entityType static property', function() {
    instance = new models.Bundle(data);
    assert.equal(instance.constructor.entityType, 'bundle');
  });

  it('parses full name-email string', function() {
    instance = new models.Bundle();
    var parts = instance.parseNameEmail(
        'Jorge O. O\'Castro <jcastro@example.com>');
    assert.deepEqual(['Jorge O. O\'Castro', 'jcastro@example.com'], parts);
  });

  it('gracefully handles unparseable name-email', function() {
    instance = new models.Bundle();
    var parts = instance.parseNameEmail('Jorge O. Castro');
    assert.deepEqual(['Jorge O. Castro', 'n/a'], parts);
  });

  // These two tests around the stateId use two different methods for setting
  // the id because of a bug in YUI https://github.com/yui/yui3/issues/1859
  // See the initializer in the Bundle model for more information.
  it('creates a stateId when the id attribute is set (charmers)', function() {
    instance = new models.Bundle();
    instance.set('id', '~charmers/wiki/5/wiki');
    assert.equal(instance.get('stateId'), 'bundle/wiki/5/wiki');
  });

  it('creates a stateId when the id attribute is set', function() {
    instance = new models.Bundle(data);
    assert.equal(instance.get('stateId'), 'bundle/cs:bundle/mongodb-cluster-4');
  });
  // See comment above regarding these two tests

});
