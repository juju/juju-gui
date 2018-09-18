/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Status = require('./status');

describe('Status', () => {
  let entities;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Status
      entities={options.entities || entities}
      generateApplicationOnClick={options._generateApplicationOnClick || sinon.stub()}
      generateApplicationURL={options._generateApplicationURL || sinon.stub()}
      generateCharmURL={options._generateCharmURL || sinon.stub()}
      generateMachineOnClick={options._generateMachineOnClick || sinon.stub()}
      generateMachineURL={options._generateMachineURL || sinon.stub()}
      generateUnitOnClick={options._generateUnitOnClick || sinon.stub()}
      generateUnitURL={options._generateUnitURL || sinon.stub()}
      navigateToApplication={options._navigateToApplication || sinon.stub()}
      navigateToCharm={options._navigateToCharm || sinon.stub()}
      navigateToMachine={options._navigateToMachine || sinon.stub()} />
  );

  beforeEach(() => {
    entities = {
      applications: [{
        getAttrs: sinon.stub().returns({
          status: {}
        })
      }],
      machines: [{}],
      model: {
        cloud: 'aws',
        environmentName: 'my-model',
        modelUUID: 'myuuid',
        region: 'neutral zone',
        sla: 'advanced',
        version: '2.42.47'
      },
      relations: [{}],
      remoteApplications: [{}],
      units: [{}]
    };
  });

  it('renders when not connected to a model', () => {
    entities.model = {};
    const wrapper = renderComponent();
    const expected = (
      <div className="status-view__content">
        Cannot show the status: the GUI is not connected to a model.
      </div>
    );
    assert.compareJSX(wrapper.find('.status-view__content'), expected);
  });

  it('renders without entities', () => {
    entities.applications = [];
    entities.machines = [];
    entities.relations = [];
    entities.remoteApplications = [];
    entities.units = [];
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('renders with entities', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can set the highest status', () => {
    entities.units = [{ agentStatus: 'error' }];
    const wrapper = renderComponent();
    assert.equal(wrapper.find('StatusModel').prop('highestStatus'), 'error');
  });
});
