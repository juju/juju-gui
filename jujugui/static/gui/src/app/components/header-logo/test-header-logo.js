/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

describe('HeaderLogo', function() {
  let changeState;
  let user;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('header-logo', function() { done(); });
  });

  beforeEach(function() {
    changeState = sinon.stub();
    user = {
      username: 'admin'
    };
  });

  it('renders', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderLogo
        changeState={changeState}
        user={user} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();

    const expected = (<a onClick={instance._handleLogoClick}
      role="button">
      <juju.components.SvgIcon name="juju-logo"
        className="svg-icon"
        width="90" height="35" />
    </a>);
    assert.deepEqual(output, expected);
  });

  it('clicking the icon changes state', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderLogo
        changeState={changeState}
        user={user} />, true);
    const instance = renderer.getMountedInstance();

    instance._handleLogoClick();

    assert.isTrue(changeState.called);
    assert.deepEqual(changeState.args[0][0], {user: user});
  });
});
