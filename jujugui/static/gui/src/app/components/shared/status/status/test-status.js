/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Status = require('./status');

describe('Status', () => {
  let model, valueStore;

  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <Status
        generateApplicationOnClick={options.generateApplicationOnClick || sinon.stub()}
        generateApplicationURL={options.generateApplicationURL || sinon.stub()}
        generateCharmURL={options.generateCharmURL || sinon.stub()}
        generateMachineOnClick={options.generateMachineOnClick || sinon.stub()}
        generateMachineURL={options.generateMachineURL || sinon.stub()}
        generateUnitOnClick={options.generateUnitOnClick || sinon.stub()}
        generateUnitURL={options.generateUnitURL || sinon.stub()}
        getIconPath={options.getIconPath || sinon.stub()}
        model={options.model || model}
        navigateToApplication={options.navigateToApplication || sinon.stub()}
        navigateToCharm={options.navigateToCharm || sinon.stub()}
        navigateToMachine={options.navigateToMachine || sinon.stub()}
        valueStore={options.valueStore || valueStore}
      />
    );

  beforeEach(() => {
    model = {
      cloud: 'aws',
      environmentName: 'my-model',
      modelUUID: 'myuuid',
      region: 'neutral zone',
      sla: 'advanced',
      version: '2.42.47'
    };
    valueStore = {
      applications: {
        app: {
          status: {
            current: ''
          }
        }
      },
      machines: {
        machine: {
          agentStatus: {
            current: ''
          }
        }
      },
      relations: {relation: {}},
      remoteApplications: {app: {}},
      units: {
        unit: {
          agentStatus: {
            current: ''
          },
          workloadStatus: {
            current: ''
          }
        }
      }
    };
  });

  it('renders when not connected to a model', () => {
    model = {};
    const wrapper = renderComponent();
    const expected = (
      <div className="status-view__content">
        Cannot show the status: the GUI is not connected to a model.
      </div>
    );
    assert.compareJSX(wrapper.find('.status-view__content'), expected);
  });

  it('renders without entities', () => {
    valueStore.applications = {};
    valueStore.machines = {};
    valueStore.relations = {};
    valueStore.remoteApplications = {};
    valueStore.units = {};
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('renders with entites', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can set the highest status', () => {
    valueStore.units = {
      unit: {
        agentStatus: {
          current: 'error'
        },
        workloadStatus: {
          current: ''
        }
      }
    };
    const wrapper = renderComponent();
    assert.equal(wrapper.find('StatusModel').prop('highestStatus'), 'error');
  });
});
