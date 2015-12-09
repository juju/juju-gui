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

describe('MachineViewMachine', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-machine', function() { done(); });
  });

  it('can render a machine', function() {
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      hardware: {
        cpuCores: 2,
        cpuPower: 200,
        disk: 2048,
        mem: 4096,
      }
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var services = {
      getById: sinon.stub().returns({
        get: sinon.stub().returns('icon.svg')
      })
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachine
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        type="machine"
        units={units}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="machine-view__machine machine-view__machine--machine"
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        <juju.components.MoreMenu
          items={[{
            label: 'Destroy',
            action: instance._destroyMachine
          }]} />
        <div className="machine-view__machine-name">
          new0
        </div>
        <div className="machine-view__machine-hardware">
          {2} unit{"s"}, {2}x{2}GHz,{' '}{"4.00"}GB, {"2.00"}GB
        </div>
        <ul className="machine-view__machine-units">
          <li className="machine-view__machine-unit"
            key="wordpress/0">
            <img
              alt="wordpress/0"
              src="icon.svg"
              title="wordpress/0" />
            {undefined}
            {undefined}
          </li>
          <li className="machine-view__machine-unit"
            key="wordpress/1">
            <img
              alt="wordpress/1"
              src="icon.svg"
              title="wordpress/1" />
            {undefined}
            {undefined}
          </li>
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render a machine with no hardware', function() {
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0'
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var services = {
      getById: sinon.stub().returns({
        get: sinon.stub().returns('icon.svg')
      })
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachine
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        type="machine"
        units={units}/>);
    var expected = (
      <div className="machine-view__machine-hardware">
        Hardware details not available
      </div>);
    assert.deepEqual(output.props.children[2], expected);
  });

  it('can render a container', function() {
    var machine = {
      displayName: 'new0/lxc/0',
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var services = {
      getById: sinon.stub().returns({
        get: sinon.stub().returns('icon.svg')
      })
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachine
        machine={machine}
        services={services}
        type="container"
        units={units}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var units = output.props.children[3].props.children;
    var expected = (
      <div className="machine-view__machine machine-view__machine--container"
        onClick={instance._handleSelectMachine}
        role="button"
        tabIndex="0">
        <juju.components.MoreMenu
          items={[{
            label: 'Destroy',
            action: instance._destroyMachine
          }]} />
        <div className="machine-view__machine-name">
          new0/lxc/0
        </div>
        {undefined}
        <ul className="machine-view__machine-units">
          <li className="machine-view__machine-unit"
            key="wordpress/0">
            <img
              alt="wordpress/0"
              src="icon.svg"
              title="wordpress/0" />
            wordpress/0
            <juju.components.MoreMenu
              items={[{
                label: 'Destroy',
                action: units[0].props.children[2].props.items[0].action
              }]} />
          </li>
          <li className="machine-view__machine-unit"
            key="wordpress/1">
            <img
              alt="wordpress/1"
              src="icon.svg"
              title="wordpress/1" />
            wordpress/1
            <juju.components.MoreMenu
              items={[{
                label: 'Destroy',
                action: units[1].props.children[2].props.items[0].action
              }]} />
          </li>
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can destroy a machine', function() {
    var destroyMachines = sinon.stub();
    var selectMachine = sinon.stub();
    var machine = {
      displayName: 'new0',
      id: 'new0'
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var services = {
      getById: sinon.stub().returns({
        get: sinon.stub().returns('icon.svg')
      })
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachine
        destroyMachines={destroyMachines}
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        type="machine"
        units={units}/>);
    output.props.children[0].props.items[0].action();
    assert.equal(destroyMachines.callCount, 1);
    assert.deepEqual(destroyMachines.args[0][0], ['new0']);
  });

  it('can remove a unit', function() {
    var machine = {
      displayName: 'new0/lxc/0',
    };
    var units = {
      filterByMachine: sinon.stub().returns([{
        displayName: 'wordpress/0',
        id: 'wordpress/0'
      }, {
        displayName: 'wordpress/1',
        id: 'wordpress/1'
      }])
    };
    var services = {
      getById: sinon.stub().returns({
        get: sinon.stub().returns('icon.svg')
      })
    };
    var removeUnits = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachine
        machine={machine}
        services={services}
        type="container"
        removeUnits={removeUnits}
        units={units}/>, true);
    var output = renderer.getRenderOutput();
    var units = output.props.children[3].props.children;
    units[1].props.children[2].props.items[0].action();
    assert.equal(removeUnits.callCount, 1);
    assert.deepEqual(removeUnits.args[0][0], ['wordpress/1']);
  });
});
