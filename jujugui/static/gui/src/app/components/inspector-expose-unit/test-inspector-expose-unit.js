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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('InspectorExposeUnit', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-expose-unit', function() { done(); });
  });

  it('can render the unit', function() {
    var unit = {
      id: 'django/1',
      displayName: 'django/1',
      public_address: '20.20.20.199'
    };
    var action = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorExposeUnit
          action={action}
          unit={unit} />);
    assert.deepEqual(output,
      <li className="inspector-expose__unit" tabIndex="0" role="button"
        data-id="django/1"
        onClick={action}>
          <div className="inspector-expose__unit-detail">
              django/1
          </div>
          <div className="inspector-expose__unit-detail">
              20.20.20.199
          </div>
      </li>);
  });
});
