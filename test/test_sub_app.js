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

describe('Sub Applications', function() {
  var Y, juju, subapp;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-routing',
                               'juju-gui'],
    function(Y) {
      juju = Y.namespace('juju');
      done();
    });

  });

  beforeEach(function() {
    subapp = new Y.juju.SubApp({
      routes: [
        { path: '/', callbacks: 'showRootView' },
        { path: '/charm/:id', callbacks: 'showCharmDetailView' }
      ],
      urlNamespace: 'charmbrowser'
    });

  });

  it('should fire a subNavigate event on navigate', function(done) {
    var path = 'path';
    subapp.on('subNavigate', function(e) {
      assert.equal('sub-app:subNavigate', e.type, 'Event names don\'t match');
      assert.equal(path, e.url);
      done();
    });
    subapp.navigate(path, {});
  });

  it('should return routes with a namespace', function() {
    var subAppRoutes = subapp.getSubAppRoutes();

    assert(Y.Array.some(subAppRoutes, function(route) {
      if (route.namespace === undefined) {
        return true;
      }
    }) === false);

  });

});
