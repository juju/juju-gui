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

describe('HashLink', () => {
  beforeAll(done => {
    // By loading these files it makes their classes available in the tests.
    YUI().use('hash-link', function() { done(); });
  });

  it('can render', () => {
    const renderer = jsTestUtils.shallowRender(
        <juju.components.HashLink
          changeState={sinon.stub()}
          hash="readme" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="hash-link"
        onClick={instance._handleClick}>
        <juju.components.SvgIcon
          name="get-link-url_16"
          size="16" />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can change the has state', () => {
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
        <juju.components.HashLink
          changeState={changeState}
          hash="readme" />, true);
    const output = renderer.getRenderOutput();
    output.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: 'readme'
    });
  });
});
