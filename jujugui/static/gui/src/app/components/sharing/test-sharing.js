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

describe('Sharing', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('sharing', () => { done(); });
  });

  beforeEach(() => {
  });

  it('can render with no users', () => {
    const modelUserInfo = sinon.stub().returns([]);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        modelUserInfo={modelUserInfo} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expectedButtons = [{
      title: 'Cancel',
      action: undefined,
      type: 'base'
    }, {
      title: 'Done',
      action: undefined,
      type: 'neutral'
    }];
    const expected = (
      <juju.components.Popup
        title="Sharing"
        buttons={expectedButtons}>
        <div className="sharing__users">
          <h5>Users with access</h5>
          {undefined}
        </div>
      </juju.components.Popup>
    );
    assert.deepEqual(output, expected);
  });

  it('can render with users', () => {
    const modelUserInfo = sinon.stub().returns([
    ]);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        modelUserInfo={modelUserInfo} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    // Get all the children except the header, which is the first item in the
    // array.
    const actual = output.props.children.props.children.slice(1);
    const expected = [];
    assert.deepEqual(output, expected);
  });
});
