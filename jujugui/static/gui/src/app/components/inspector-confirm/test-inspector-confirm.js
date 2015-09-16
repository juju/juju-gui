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

describe('InspectorConfirm', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-confirm', function() { done(); });
  });

  it('generates the correct classes if it is closed', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorConfirm
          message="My message" />);
    assert.deepEqual(output,
      <div className="inspector-confirm">
        <p className="inspector-confirm__message">
          My message
        </p>
        <juju.components.ButtonRow
        buttons={undefined} />
      </div>);
  });

  it('generates the correct classes if it is open', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorConfirm
          message="My message"
          open={true} />);
    assert.deepEqual(output,
      <div className="inspector-confirm inspector-confirm--open">
        <p className="inspector-confirm__message">
          My message
        </p>
        <juju.components.ButtonRow
        buttons={undefined} />
      </div>);
  });

  it('displays the provided message', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorConfirm
          message="My message" />);
    assert.deepEqual(output.props.children[0],
      <p className="inspector-confirm__message">
        My message
      </p>);
  });

  it('hides the message if one is not provided', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorConfirm />);
    assert.deepEqual(output.props.children[0],
      <p className="inspector-confirm__message hidden">
        {undefined}
      </p>);
  });
});
