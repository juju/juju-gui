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

describe('UnitList', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('unit-list', () => { done(); });
  });

  it('renders a list of unit components', () => {
    var units = [{
      displayName: 'mysql/0'
    }, {
      displayName: 'mysql/1'
    }];
    var unitsList = {
      toArray: () => units
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          units={unitsList} />);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children, [
      <juju.components.UnitListItem
        key="select-all"
        label="Select all units"
        whenChanged={children[0].props.whenChanged}/>,
      <juju.components.UnitListItem
        key={units[0].displayName}
        label={units[0].displayName}
        action={output.props.children[1].props.children[1].props.action}
        checked={false} />,
      <juju.components.UnitListItem
        key={units[1].displayName}
        label={units[1].displayName}
        action={output.props.children[1].props.children[2].props.action}
        checked={false} />
    ]);
  });

  it('renders the Scale Service action component', () => {
    var units = [{
      displayName: 'mysql/0'
    }];
    var unitsList = {
      toArray: () => units
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          units={unitsList} />);
    var child = output.props.children[0].props.children;
    assert.deepEqual(child,
      <juju.components.OverviewAction
        action={child.props.action}
        title="Scale Service"/>);
  });

  it('propagates select-all to all children', () => {
    var units = [{
      displayName: 'mysql/0'
    }, {
      displayName: 'mysql/1'
    }];
    var unitsList = {
      toArray: () => units
    };
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.UnitList
          units={unitsList} />, true);
    var output = shallowRenderer.getRenderOutput();
    var selectAll = output.props.children[1].props.children[0];

    // Trigger the select callback;
    selectAll.props.whenChanged(true);
    // re-render the component
    shallowRenderer.render(
        <juju.components.UnitList
          units={unitsList} />);
    output = shallowRenderer.getRenderOutput();

    var children = output.props.children[1].props.children;
    assert.deepEqual(children, [
      <juju.components.UnitListItem
        key="select-all"
        label="Select all units"
        whenChanged={children[0].props.whenChanged}/>,
      <juju.components.UnitListItem
        key={units[0].displayName}
        label={units[0].displayName}
        action={output.props.children[1].props.children[1].props.action}
        checked={true} />,
      <juju.components.UnitListItem
        key={units[1].displayName}
        label={units[1].displayName}
        action={output.props.children[1].props.children[2].props.action}
        checked={true} />
    ]);
  });

  it('navigates to the unit when a list item is clicked', function() {
    var units = [{
      displayName: 'mysql/5'
    }];
    var unitsList = {
      toArray: () => units
    };
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          changeState={changeState}
          serviceId="mysql"
          units={unitsList} />);
    output.props.children[1].props.children[1].props.action({
      currentTarget: {
        getElementsByTagName: function() {
          return [{innerText: 'mysql/5'}];
        }
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'mysql',
          unit: '5',
          activeComponent: 'unit'
        }
      }
    });
  });
});
