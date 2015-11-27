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

describe('MachineView', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view', function() { done(); });
  });

  it('can render', function() {
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineView
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    var expected = (
      <div className="machine-view">
        <div className="machine-view__content">
          <div className="machine-view__column">
            <juju.components.MachineViewHeader
              title="New units" />
            <div className="machine-view__column-content">
              <div className="machine-view__column-onboarding">
                <juju.components.SvgIcon name="add_16"
                  size="16" />
                Add services to get started
              </div>
            </div>
          </div>
          <div className="machine-view__column">
            <juju.components.MachineViewHeader
              title="My Env (3)" />
          </div>
          <div className="machine-view__column">
            <juju.components.MachineViewHeader
              title="0 containers, 0 units" />
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display onboarding if there are no services', function() {
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(0)
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineView
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    var expected = (
      <div className="machine-view__column-content">
        <div className="machine-view__column-onboarding">
          <juju.components.SvgIcon name="add_16"
            size="16" />
          Add services to get started
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can display onboarding if there are no unplaced units', function() {
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
    var units = {
      filterByMachine: sinon.stub().returns([])
    };
    var services = {
      size: sinon.stub().returns(1)
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineView
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    var expected = (
      <div className="machine-view__column-content">
        <div className="machine-view__column-onboarding">
          <juju.components.SvgIcon name="task-done_16"
            size="16" />
          You have placed all of your units
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can display a list of unplaced units', function() {
    var autoPlaceUnits = sinon.stub();
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
    var unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    var units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    var services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: sinon.stub().returns('django.svg')
      })
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineView
        autoPlaceUnits={autoPlaceUnits}
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    var expected = (
      <div className="machine-view__column-content">
        <div>
          <div className="machine-view__auto-place">
            <button onClick={autoPlaceUnits}>
              Auto place
            </button>
            or manually place
          </div>
          <ul className="machine-view__list">
            <juju.components.MachineViewUnplacedUnit
              key="django/0"
              icon="django.svg"
              unit={unitList[0]} />
            <juju.components.MachineViewUnplacedUnit
              key="django/1"
              icon="django.svg"
              unit={unitList[1]} />
          </ul>
        </div>
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can auto place units', function() {
    var autoPlaceUnits = sinon.stub();
    var machines = {
      filterByParent: sinon.stub().returns([1, 2, 3])
    };
    var unitList = [{
      id: 'django/0',
      service: 'django'
    }, {
      id: 'django/1',
      service: 'django'
    }];
    var units = {
      filterByMachine: sinon.stub().returns(unitList)
    };
    var services = {
      size: sinon.stub().returns(1),
      getById: sinon.stub().returns({
        get: sinon.stub().returns('django.svg')
      })
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineView
        autoPlaceUnits={autoPlaceUnits}
        environmentName="My Env"
        units={units}
        services={services}
        machines={machines} />);
    output.props.children.props.children[0].props.children[1]
      .props.children.props.children[0].props.children[0].props.onClick();
    assert.equal(autoPlaceUnits.callCount, 1);
  });
});
