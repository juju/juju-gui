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


describe('Browser Cache', function() {
  var cache, utils, Y;

  before(function(done) {
    var modules = ['browser-cache', 'juju-bundle-models', 'juju-tests-utils'];
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      utils = Y['juju-tests'].utils;
      done();
    });
  });

  beforeEach(function() {
    cache = new Y.juju.BrowserCache();
  });

  afterEach(function() {
    // This method is tested below but if the afterEach is failing you're best
    // bet is to comment this line out and let the tests run below to see which
    // fails.
    if (cache._storage) {
      cache.empty();
    }
    cache = null;
  });

  it('sets up the storage model list on instantiation', function() {
    assert.equal(cache instanceof Y.juju.BrowserCache, true);
    assert.equal(typeof cache._storage, 'object');
    assert.equal(cache._storage._entities instanceof Y.ModelList, true);
  });

  describe('accessors', function() {
    it('supplies functional getters and setters', function() {
      var data = 'foobar';
      var key = 'baz';
      assert.strictEqual(cache.get(key), undefined);
      cache.set(key, data);
      assert.equal(cache.get(key), data);
    });

    it('clones complex objects on set', function() {
      var data = { foo: { bar: 'baz' }};
      var key = 'bax';
      cache.set(key, data);
      assert.deepEqual(cache._storage[key], data);
      data.foo.bar = 'bax';
      assert.notEqual(cache._storage[key].foo.bar, data.foo.bar);
    });
  });

  describe('updateEntityList', function() {
    it('adds individual entity models into the entity database', function() {
      cache.updateEntityList(new Y.Model({ id: 'foobar' }));
      var entities = cache._storage._entities;
      assert.equal(entities.size(), 1);
      assert.equal(entities.item(0).get('id'), 'foobar');
    });

    it('adds structured entity models into the entity database', function() {
      // It should deconstruct the object passed in and store each model in the
      // entity cache.
      cache.updateEntityList({
        // as an array
        recommended: [new Y.Model({ id: 'recommendedone' })],
        // as a model
        other: new Y.Model({ id: 'otherone' })
      });
      var entities = cache._storage._entities;
      assert.equal(entities.size(), 2);
      assert.equal(entities.item(0).get('id'), 'recommendedone');
      assert.equal(entities.item(1).get('id'), 'otherone');
    });
  });

  describe('getEntity', function() {
    it('returns a charm from the charm cache', function() {
      var charm = new Y.Model({ id: 'cs:precise/mysql-45' });
      cache.updateEntityList(charm);
      // The id returned from the state system does not have the full path.
      assert.deepEqual(cache.getEntity('precise/mysql-45'), charm);
    });

    it('returns a bundle from the charm cache', function() {
      // The bundle model formats the id into a new format and saves it in
      // the `stateId` attribute which we compare against. If this test fails
      // be sure to check the bundle model tests.
      var bundle = new Y.juju.models.Bundle({
        id: '~charmers/mongodb/5/cluster'
      });
      cache.updateEntityList(bundle);
      assert.deepEqual(cache.getEntity('bundle/mongodb/5/cluster'), bundle);
    });
  });

  describe('empty', function() {
    it('destroys the entities model list', function() {
      var destroyCalled = false;
      // We need to do this because it's nulled out afterwards so we can't use
      // the stub methods.
      cache._storage._entities.destroy = function() {
        destroyCalled = true;
      };
      var destroyModels = utils.makeStubMethod(cache, '_destroyModels');
      var init = utils.makeStubMethod(cache, 'init');
      cache.empty();
      assert.equal(destroyCalled, true);
      assert.equal(destroyModels.calledOnce(), true);
      assert.equal(init.calledOnce(), true);
      // _storage needs to be set to null in empty.
      assert.isNull(cache._storage);
    });

    it('recursively destroys all of the cached entity models', function() {
      // Search and curated results are stored in their strucured formats.
      var recommended = new Y.Model({ id: 'foo' });
      recommended.destroy = utils.makeStubFunction();
      var other = new Y.Model({ id: 'bar' });
      other.destroy = utils.makeStubFunction();
      var curated = {
        recommended: recommended,
        other: other
      };
      cache.set('curated', curated);
      assert.deepEqual(cache.get('curated'), curated);
      cache.empty();
      assert.equal(recommended.destroy.calledOnce(), 1,
          'recommended destroy not called once');
      assert.equal(other.destroy.calledOnce(), true,
          'other destroy not called once');
      assert.strictEqual(cache.get('curated'), undefined);
    });

    it('resets itself back to a functional state after empty', function() {
      cache.empty();
      // cache._storage is set to null in empty()
      assert.isNotNull(cache._storage);
      assert.equal(cache._storage._entities instanceof Y.ModelList, true);
      assert.equal(cache._storage._entities.size(), 0);
    });
  });

});
