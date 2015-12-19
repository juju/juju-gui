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

describe('MachineViewHeader', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-header', function() { done(); });
  });

  it('can render', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewHeader
        title="Sandbox" />);
    var expected = (
        <div className="machine-view__header">
          Sandbox
          {undefined}
        </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with a menu', function() {
    var menuItems = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewHeader
        activeMenuItem="name"
        menuItems={menuItems}
        title="Sandbox" />);
    var expected = (
        <div className="machine-view__header">
          Sandbox
          <juju.components.MoreMenu
            activeItem="name"
            items={menuItems} />
        </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with a toggle', function() {
    var action = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewHeader
        toggle={{
          action: action,
          disabled: false,
          toggleOn: true
        }}
        title="Sandbox" />);
    var expected = (
        <div className="machine-view__header">
          Sandbox
          <juju.components.GenericButton
            action={action}
            disabled={false}
            type="grey"
            icon="close_16" />
        </div>);
    assert.deepEqual(output, expected);
  });
});
