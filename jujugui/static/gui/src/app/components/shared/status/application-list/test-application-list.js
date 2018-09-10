/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusApplicationList = require('./application-list');

describe('StatusApplicationList', () => {
  let applications;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusApplicationList
      applications={options.applications || applications}
      changeState={options.changeState || sinon.stub()}
      generateApplicationClickState={
        options.generateApplicationClickState || sinon.stub().returns('http://example.com')}
      generateCharmURL={options.generateCharmURL || sinon.stub()}
      generatePath={options.generatePath || sinon.stub()}
      onCharmClick={options.onCharmClick || sinon.stub()}
      statusFilter={options.statusFilter} />
  );

  beforeEach(() => {
    applications = [{
      getAttrs: sinon.stub().returns({
        charm: '~who/xenial/django-42',
        exposed: true,
        icon: 'django.svg',
        id: 'django',
        name: 'django',
        pending: false,
        status: {current: 'active'},
        units: [],
        workloadVersion: '1.10'
      })
    }];
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
