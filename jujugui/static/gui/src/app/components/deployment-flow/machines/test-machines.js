/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentMachines = require('./machines');

describe('DeploymentMachines', function() {
  var acl, machines;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentMachines
      acl={options.acl || acl}
      cloud={options.cloud === undefined ? {name: 'My cloud'} : options.cloud}
      formatConstraints={options.formatConstraints || sinon.stub()}
      generateMachineDetails={options.generateMachineDetails || sinon.stub()}
      machines={options.machines || machines} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    machines = {
      machine1: {
        command: {
          args: [[{
            constraints: {},
            series: 'xenial'
          }]],
          options: {
            modelId: 'machine1'
          }
        },
        id: 'addMachine1'
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
          }]],
          options: {
            modelId: 'machine2'
          }
        },
        id: 'addMachine1'
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
          }]],
          options: {
            modelId: 'machine3'
          }
        },
        id: 'addMachine1'
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
          }]],
          options: {
            modelId: 'machine4'
          }
        },
        id: 'addMachine1'
      },
      machine5: {
        command: {
          args: [[{
            constraints: {},
            series: null
          }]],
          options: {
            modelId: 'machine5'
          }
        },
        id: 'addMachine1'
      }
    };
  });

  it('can render', function() {
    const generateMachineDetails = sinon.stub();
    generateMachineDetails.onCall(0).returns(
      'xenial, (constraints not set)');
    generateMachineDetails.onCall(1).returns(
      'cores: 2, CPU: 0.03GHz, mem: 1.00GB, disk: 4.00GB');
    generateMachineDetails.onCall(2).returns(
      'trusty, cores: 2, CPU: 0.03GHz, mem: 1.00GB, disk: 4.00GB');
    generateMachineDetails.onCall(3).returns(
      '(constraints not set)');
    generateMachineDetails.onCall(4).returns(
      'cores: 2, CPU: 0.03GHz, mem: 1.00GB, disk: 4.00GB');
    const wrapper = renderComponent({ generateMachineDetails });
    var expected = (
      <div>
        <p className="deployment-machines__message">
          These machines will be provisioned on {'My cloud'}.&nbsp;
          {'You may incur charges from your cloud provider.'}
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
                xenial, (constraints not set)
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
                cores: 2, CPU: 0.03GHz, mem: 1.00GB, disk: 4.00GB
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
                trusty, cores: 2, CPU: 0.03GHz, mem: 1.00GB, disk: 4.00GB
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
    assert.compareJSX(wrapper, expected);
  });

  it('can render for a local cloud', function() {
    const wrapper = renderComponent({ cloud: {name: 'localhost'} });
    var expected = (
      <p className="deployment-machines__message">
        These machines will be provisioned on {'localhost'}.&nbsp;
        {''}
      </p>);
    assert.compareJSX(wrapper.find('.deployment-machines__message'), expected);
  });

  it('can render with unknown cloud', function() {
    const wrapper = renderComponent({ cloud: null });
    var expected = (
      <p className="deployment-machines__message">
        These machines will be provisioned on {'the cloud'}.&nbsp;
        {'You may incur charges from your cloud provider.'}
      </p>);
    assert.compareJSX(wrapper.find('.deployment-machines__message'), expected);
  });
});
