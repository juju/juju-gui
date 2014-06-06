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
  var Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use('browser-cache', function(Y) {
      done();
    });
  });

  it('can be instantiated', function() {
    var cache = new Y.juju.BrowserCache();
    assert.equal(cache instanceof Y.juju.BrowserCache, true);
  });

  it('supplies functional getters and setters', function() {
    var cache = new Y.juju.BrowserCache();
    var data = 'foobar';
    var key = 'baz';
    assert.strictEqual(cache.get(key), undefined);
    cache.set(key, data);
    assert.equal(cache.get(key), data);
  });

  it('clones complex objects on set', function() {
    var cache = new Y.juju.BrowserCache();
    var data = { foo: { bar: 'baz' }};
    var key = 'bax';
    cache.set(key, data);
    assert.deepEqual(cache._storage[key], data);
    data.foo.bar = 'bax';
    assert.notEqual(cache._storage[key].foo.bar, data.foo.bar);
  });

});
