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

  it('can render', function() {
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
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachine
        machine={machine}
        selected={false}
        selectMachine={selectMachine}
        services={services}
        type="machine"
        units={units}/>);
    var expected = (
      <div className="machine-view__machine machine-view__machine--machine"
        onClick={selectMachine}
        role="button"
        tabIndex="0">
        <div className="machine-view__machine-name">
          new0
        </div>
        <div className="machine-view__machine-hardware">
          <div>
            {2} unit{"s"}, {2}x{2}GHz,{' '}{"4.00"}GB, {"2.00"}GB
          </div>
        </div>
        <div className="machine-view__machine-units">
        <img
          alt="wordpress/0"
          key="wordpress/0"
          src="icon.svg"
          title="wordpress/0" />
        <img
          alt="wordpress/1"
          key="wordpress/1"
          src="icon.svg"
          title="wordpress/1" />
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can with no hardware', function() {
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
        <div>
          Hardware details not available
        </div>
      </div>);
    assert.deepEqual(output.props.children[1], expected);
  });
});
