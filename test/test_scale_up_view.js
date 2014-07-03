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

describe('scale-up view', function() {

  var Y, utils, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'scale-up-view',
        'juju-tests-utils',
        function() {
          utils = Y.namespace('juju-tests').utils;
          View = Y.namespace('juju.viewlets').ScaleUp;
          done();
        });
  });

  beforeEach(function() {
    view = new View();
  });

  afterEach(function() {
    view.destroy();
  });

  it('can be instantiated', function() {
    assert.equal(view instanceof View, true);
  });

  it('can render its template to its container', function() {
    var container = view.render();
    assert.deepEqual(container, view.get('container'));
    assert.isNotNull(view.get('container').one('.view-container'));
  });
});
