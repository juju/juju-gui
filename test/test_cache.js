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


describe('Generic Cache', function() {
  var utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use('generic-cache', 'juju-tests-utils', function(Y) {
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  it('can be instantiated', function() {
    var cache = new Y.GenericCache();
    assert.equal(cache instanceof Y.GenericCache, true);
  });

  it('can generate accessors on instantiation for supplied keys', function() {
    var cache = new Y.GenericCache(['interesting', 'apache']);
    assert.equal(typeof cache.getinteresting, 'function');
    assert.equal(typeof cache.setinteresting, 'function');
    assert.equal(typeof cache.getapache, 'function');
    assert.equal(typeof cache.setapache, 'function');
  });

  it('supplies functional getters and setters', function() {
    var cache = new Y.GenericCache(['interesting']);
    var data = 'foobar';
    cache.setinteresting(data);
    assert.equal(cache.__storage.interesting, data);
    assert.equal(cache.getinteresting(), data);
  });

  it('clones complex objects on set', function() {
    var cache = new Y.GenericCache(['interesting']);
    var data = { foo: { bar: 'baz' }};
    cache.setinteresting(data);
    assert.deepEqual(cache.__storage.interesting, data);
    data.foo.bar = 'bax';
    assert.notEqual(cache.__storage.interesting.foo.bar, data.foo.bar);
  });

  it('allows merging on setters', function() {
    var cache = new Y.GenericCache(['interesting']);
    var data = { foo: { bar: 'baz' }};
    var data2 = { foo: { bax: 'rat' }};
    cache.setinteresting(data);
    cache.setinteresting(data2, true);
    assert.deepEqual(cache.getinteresting(), Y.mix(data, data2, true));
  });

  it('can generate new accessors after instantiation', function() {
    var cache = new Y.GenericCache(['interesting']);
    cache.generateGettersSetters(['search']);
    assert.equal(typeof cache.setsearch, 'function');
    assert.equal(typeof cache.getsearch, 'function');
  });

  it('allows custom accessors to be provided', function() {
    var data = { foo: 'bar' };
    var getter = utils.makeStubFunction();
    var setter = utils.makeStubFunction(data);
    var cache = new Y.GenericCache([{
      key: 'interesting',
      getter: getter,
      setter: setter
    }]);
    cache.setinteresting(data);
    assert.equal(setter.calledOnce(), true);
    assert.deepEqual(cache.__storage.interesting, data);
    cache.getinteresting();
    assert.equal(getter.calledOnce(), true);
    assert.deepEqual(getter.lastArguments()[0], data);
  });

});
