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


describe('D3 StatusBar', function() {

  var Y, container, views, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['d3', 'd3-statusbar', 'juju-tests-utils'],
        function(Y) {
          views = Y.namespace('juju.views');
          utils = Y.namespace('juju-tests.utils');
          done();
        });
  });

  beforeEach(function() {
    container = utils.makeContainer(this);
  });

  it('should properly parse data', function() {
    var bar = new views.StatusBar({width: 300});
    var result = bar.mapData({'running': 4, 'pending': 4, 'error': 2 });
    assert.deepEqual(result, [
      {key: 'error', percent: 20, count: 2, start: 0 },
      {key: 'pending', percent: 40, count: 4, start: 20},
      {key: 'running', percent: 40, count: 4, start: 60}]);
  });

  it('should render to a container properly', function() {
    var bar = new views.StatusBar({
      container: container.getDOMNode(),
      width: 300,
      height: 20
    }).render();

    bar.update({'running': 4, 'pending': 4, 'error': 2});
    assert.ok(container.one('svg g.statusbar'));
    assert.equal(container.one('svg').getAttribute('width'), 300);

    // Verify the computed rendering itself.
    var rect = d3.select(container.getDOMNode()).select('rect');
    // X and Width are under a transition and varies.  without publishing the
    // transition from the object there isn't an easy way to catch transition
    // end to inspect values.
    assert.isTrue(rect.classed('error'));
    assert.equal(rect.attr('height'), 20);
  });
});
