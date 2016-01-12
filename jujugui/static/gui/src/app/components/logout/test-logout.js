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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Logout', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('logout-component', () => { done(); });
  });

  it('renders properly', () => {
    var logout = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Logout
        logout={logout} />);
    var expected = (
      <span>
        <a href="#" onClick={output.props.children.props.onClick}>Logout</a>
      </span>);
    assert.deepEqual(output, expected);
  });

  it('calls the logout prop on click', () => {
    var logout = sinon.stub();
    var prevent = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Logout
        logout={logout} />);
    assert.equal(logout.callCount, 0);
    output.props.children.props.onClick({ preventDefault: prevent });
    assert.equal(logout.callCount, 1);
    assert.equal(prevent.callCount, 1);
  });

});
