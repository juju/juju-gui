/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusModel = require('./model');

describe('StatusModel', function() {
  let counts, model;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusModel
      changeFilter={options.changeFilter || sinon.stub()}
      counts={options.counts || counts}
      highestStatus={options.highestStatus || 'error'}
      model={options.model || model}
      statusFilter={options.statusFilter} />
  );

  beforeEach(() => {
    counts = {
      applications: 5,
      machines: 3,
      relations: 9,
      remoteApplications: 7,
      units: 1
    };
    model = {
      cloud: 'aws',
      environmentName: 'my-model',
      modelUUID: 'myuuid',
      region: 'neutral zone',
      sla: 'advanced',
      version: '2.42.47'
    };
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can filter by status', () => {
    const changeFilter = sinon.stub();
    const wrapper = renderComponent({changeFilter});
    wrapper.find('select').simulate('change', {currentTarget: {value: 'error'}});
    assert.equal(changeFilter.callCount, 1);
    assert.equal(changeFilter.args[0][0], 'error');
  });

  it('can filter by nothing', () => {
    const changeFilter = sinon.stub();
    const wrapper = renderComponent({changeFilter});
    wrapper.find('select').simulate('change', {currentTarget: {value: 'none'}});
    assert.equal(changeFilter.callCount, 1);
    assert.equal(changeFilter.args[0][0], null);
  });
});
