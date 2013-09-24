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
  var data, expected, instance, models, origData, relatedData, utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'io',
      'juju-bundle-models',
      'juju-tests-utils'
    ], function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      var sampleData = Y.io('data/browserbundle.json', {sync: true});
      origData = Y.JSON.parse(sampleData.responseText);
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

  it('must store the title', function() {
    expected = 'My Bountiful Bundle';
    data.title = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('title'));
  });

  it('must store the basket_name', function() {
    expected = 'wiki-basket';
    data.basket_name = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('basket_name'));
  });

  it('must store the basket_revision', function() {
    expected = 3;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('basket_revision'));
  });

  it('must have a relations getter', function() {
    instance = new models.Bundle(data);
    expected = [
      {
        'wiki:db': 'db'
      },
      {
        'wiki': ['haproxy', 'memcached']
      }
    ];
    var results = instance.get('relations');
    assert.deepEqual(expected, results);
  });

  it('must have a series getter', function() {
    expected = 'saucy';
    data.data.series = expected;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('series'));
  });

  it('must have a services getter', function() {
    expected = data.data.services;
    instance = new models.Bundle(data);
    assert.equal(expected, instance.get('services'));
  });


});
