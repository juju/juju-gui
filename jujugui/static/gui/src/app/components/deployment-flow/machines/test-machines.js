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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentMachines', function() {
  var acl, machines;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-machines', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    machines = {
      machine1: {
        command: {
          args: [[{
            constraints: {},
            series: 'xenial'
          }]]
        }
      },
      machine2: {
        command: {
          args: [[{
            constraints: {
              cores: 2,
              'cpu-power': 3,
              'root-disk': 4096,
              mem: 1024
            },
            series: null
          }]]
        }
      },
      machine3: {
        command: {
          args: [[{
            constraints: {
              cores: 2,
              'cpu-power': 3,
              'root-disk': 4096,
              mem: 1024
            }
          }]]
        }
      },
      machine4: {
        command: {
          args: [[{
            constraints: {
              cores: 2,
              'cpu-power': 3,
              'root-disk': 4096,
              mem: 1024
            },
            series: 'trusty'
          }]]
        }
      },
      machine5: {
        command: {
          args: [[{
            constraints: {},
            series: null
          }]]
        }
      }
    };
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentMachines
        acl={acl}
        cloud={{name: 'My cloud'}}
        machines={machines} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <p className="deployment-machines__message">
          These machines will be provisioned on {'My cloud'}.&nbsp;
          {'You will incur a charge from your cloud provider.'}
        </p>
        <ul className="deployment-machines__list">
          <li className="deployment-flow__row-header twelve-col">
            <div className="eight-col">
              Type
            </div>
            <div className="three-col">
              Provider
            </div>
            <div className="one-col last-col">
              Quantity
            </div>
          </li>
          {[
            <li className="deployment-flow__row twelve-col"
              key="xenial (constraints not set)">
              <div className="eight-col">
                xenial (constraints not set)
              </div>
              <div className="three-col">
                My cloud
              </div>
              <div className="one-col last-col">
                {1}
              </div>
            </li>,
            <li className="deployment-flow__row twelve-col"
              key="2x0.03GHz, 1024, 4096">
              <div className="eight-col">
                2x0.03GHz, 1024, 4096
              </div>
              <div className="three-col">
                My cloud
              </div>
              <div className="one-col last-col">
                {2}
              </div>
            </li>,
            <li className="deployment-flow__row twelve-col"
              key="trusty, 2x0.03GHz, 1024, 4096">
              <div className="eight-col">
                trusty, 2x0.03GHz, 1024, 4096
              </div>
              <div className="three-col">
                My cloud
              </div>
              <div className="one-col last-col">
                {1}
              </div>
            </li>,
            <li className="deployment-flow__row twelve-col"
              key="(constraints not set)">
              <div className="eight-col">
                (constraints not set)
              </div>
              <div className="three-col">
                My cloud
              </div>
              <div className="one-col last-col">
                {1}
              </div>
            </li>
          ]}
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render for a local cloud', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentMachines
        acl={acl}
        cloud={{name: 'localhost'}}
        machines={machines} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <p className="deployment-machines__message">
        These machines will be provisioned on {'localhost'}.&nbsp;
        {''}
      </p>);
    assert.deepEqual(output.props.children[0], expected);
  });

  it('can render with unknown cloud', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentMachines
        acl={acl}
        machines={machines} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <p className="deployment-machines__message">
        These machines will be provisioned on {'the cloud'}.&nbsp;
        {'You will incur a charge from your cloud provider.'}
      </p>);
    assert.deepEqual(output.props.children[0], expected);
  });
});
