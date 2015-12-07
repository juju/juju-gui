/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('MachineViewUnplacedUnit', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-unplaced-unit', function() { done(); });
  });

  it('can render', function() {
    var unit = {displayName: 'django/7'};
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewUnplacedUnit
        icon="icon.svg"
        unit={unit} />);
    var expected = (
      <li className="machine-view__unplaced-unit">
        <img src="icon.svg" alt="django/7"
          className="machine-view__unplaced-unit-icon" />
        django/7
      </li>);
    assert.deepEqual(output, expected);
  });
});
