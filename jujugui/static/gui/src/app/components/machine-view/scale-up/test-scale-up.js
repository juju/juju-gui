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

describe('MachineViewScaleUp', function() {
  let acl, applications;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-scale-up', function() { done(); });
  });

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
    applications = {
      toArray: sinon.stub().returns([{
        get: function (val) {
          switch (val) {
            case 'id':
              return '111111$';
              break;
            case 'name':
              return 'django';
              break;
            case 'icon':
              return 'data:image/gif;base64,';
              break;
          }
        }
      }, {
        get: function (val) {
          switch (val) {
            case 'id':
              return '222222$';
              break;
            case 'name':
              return 'mysql';
              break;
            case 'icon':
              return 'data:image/gif;base64,';
              break;
          }
        }
      }, {
        // Subordinate applications should not appear in the list.
        get: function (val) {
          switch (val) {
            case 'id':
              return '333333$';
              break;
            case 'name':
              return 'ntp';
              break;
            case 'icon':
              return 'ntp.svg';
              break;
            case 'subordinate':
              return true;
              break;
          }
        }
      }]),
      getById: function (val) {
        switch (val) {
          case '111111$':
            return '111111$';
            break;
          case '222222$':
            return '222222$';
            break;
        }
      }
    };
  });

  it('can render', function() {
    const addGhostAndEcsUnits = sinon.stub();
    const toggleScaleUp = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewScaleUp
        acl={acl}
        dbAPI={{
          addGhostAndEcsUnits: addGhostAndEcsUnits,
          applications: applications
        }}
        toggleScaleUp={toggleScaleUp} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <form className="machine-view__scale-up"
        onSubmit={instance._handleAddUnits}>
        <ul className="machine-view__scale-up-units">
          <li className="machine-view__scale-up-unit"
            key="111111$">
            <img alt="django"
              className="machine-view__scale-up-unit-icon"
              src="data:image/gif;base64," />
            <div className="machine-view__scale-up-unit-name"
              title="django">
              django
            </div>
            <input
              className="machine-view__scale-up-unit-input"
              disabled={false}
              placeholder="units"
              ref="scaleUpUnit-111111$"
              type="number"
              min="0"
              step="1" />
          </li>
          <li className="machine-view__scale-up-unit"
            key="222222$">
            <img alt="mysql"
              className="machine-view__scale-up-unit-icon"
              src="data:image/gif;base64," />
            <div className="machine-view__scale-up-unit-name"
              title="mysql">
              mysql
            </div>
            <input
              className="machine-view__scale-up-unit-input"
              disabled={false}
              placeholder="units"
              ref="scaleUpUnit-222222$"
              type="number"
              min="0"
              step="1" />
          </li>
        </ul>
        <juju.components.ButtonRow buttons={[{
          action: toggleScaleUp,
          title: 'Cancel',
          type: 'base'
        }, {
          action: instance._handleAddUnits,
          disabled: false,
          title: 'Add units',
          type: 'neutral'
        }]} />
      </form>);
    expect(output).toEqualJSX(expected);
  });

  it('can disable controls when read only', function() {
    acl = shapeup.deepFreeze({isReadOnly: () => true});

    const addGhostAndEcsUnits = sinon.stub();
    const toggleScaleUp = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewScaleUp
        acl={acl}
        dbAPI={{
          addGhostAndEcsUnits: addGhostAndEcsUnits,
          applications: applications
        }}
        toggleScaleUp={toggleScaleUp} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <form className="machine-view__scale-up"
        onSubmit={instance._handleAddUnits}>
        <ul className="machine-view__scale-up-units">
          <li className="machine-view__scale-up-unit"
            key="111111$">
            <img alt="django"
              className="machine-view__scale-up-unit-icon"
              src="data:image/gif;base64," />
            <div className="machine-view__scale-up-unit-name"
              title="django">
              django
            </div>
            <input
              className="machine-view__scale-up-unit-input"
              disabled={true}
              placeholder="units"
              ref="scaleUpUnit-111111$"
              type="number"
              min="0"
              step="1" />
          </li>
          <li className="machine-view__scale-up-unit"
            key="222222$">
            <img alt="mysql"
              className="machine-view__scale-up-unit-icon"
              src="data:image/gif;base64," />
            <div className="machine-view__scale-up-unit-name"
              title="mysql">
              mysql
            </div>
            <input
              className="machine-view__scale-up-unit-input"
              disabled={true}
              placeholder="units"
              ref="scaleUpUnit-222222$"
              type="number"
              min="0"
              step="1"
            />
          </li>
        </ul>
        <juju.components.ButtonRow buttons={[{
          action: toggleScaleUp,
          title: 'Cancel',
          type: 'base'
        }, {
          action: instance._handleAddUnits,
          disabled: true,
          title: 'Add units',
          type: 'neutral'
        }]} />
      </form>);
    expect(output).toEqualJSX(expected);
  });

  it('can scale applications', function() {
    const addGhostAndEcsUnits = sinon.stub();
    const toggleScaleUp = sinon.stub();
    const output = testUtils.renderIntoDocument(
      <juju.components.MachineViewScaleUp
        acl={acl}
        dbAPI={{
          addGhostAndEcsUnits: addGhostAndEcsUnits,
          applications: applications
        }}
        toggleScaleUp={toggleScaleUp}
      />, true);
    const confirm = ReactDOM.findDOMNode(output).querySelector(
      '.button--neutral');
    const input1 = output.refs['scaleUpUnit-111111$'];
    input1.value = '5';
    const input2 = output.refs['scaleUpUnit-222222$'];
    input2.value = '9';
    testUtils.Simulate.click(confirm);
    assert.equal(addGhostAndEcsUnits.callCount, 2);
    assert.equal(addGhostAndEcsUnits.args[0][0], '111111$');
    assert.equal(addGhostAndEcsUnits.args[0][1], '5');
    assert.equal(addGhostAndEcsUnits.args[1][0], '222222$');
    assert.equal(addGhostAndEcsUnits.args[1][1], '9');
  });

  it('can scale applications with dashes in the name', () => {
    const addGhostAndEcsUnits = sinon.stub();
    const toggleScaleUp = sinon.stub();
    const applications = {
      toArray: sinon.stub().returns([{
        get: function (val) {
          switch (val) {
            case 'id':
              return 'juju-gui';
              break;
            case 'name':
              return 'juju-gui';
              break;
            case 'icon':
              return 'data:image/gif;base64,';
              break;
          }
        }
      }]),
      getById: function (val) {
        return 'juju-gui';
      }
    };
    const output = testUtils.renderIntoDocument(
      <juju.components.MachineViewScaleUp
        acl={acl}
        dbAPI={{
          addGhostAndEcsUnits: addGhostAndEcsUnits,
          applications: applications
        }}
        toggleScaleUp={toggleScaleUp}
      />, true);
    const confirm = ReactDOM.findDOMNode(output).querySelector(
      '.button--neutral');
    const input1 = output.refs['scaleUpUnit-juju-gui'];
    input1.value = '5';
    testUtils.Simulate.click(confirm);
    assert.equal(addGhostAndEcsUnits.callCount, 1);
    assert.equal(addGhostAndEcsUnits.args[0][0], 'juju-gui');
    assert.equal(addGhostAndEcsUnits.args[0][1], '5');
  });
});
