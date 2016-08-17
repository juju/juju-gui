/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

describe('ISVProfile', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('isv-profile', () => { done(); });
  });

  it('renders a ISV profile page', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.ISVProfile />, true);
    var output = component.getRenderOutput();
    var content = output.props.children.props.children;
    var expected = (<div className="inner-wrapper">
        <div className="isv-profile__header">
          <h1>ISV Profile</h1>
        </div>
      </div>);
    assert.deepEqual(content, expected);
  });
});
