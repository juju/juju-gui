/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('test/fake-analytics');
const DeploymentPricing = require('./pricing');

describe('DeploymentPricing', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentPricing
      addNotification={options.addNotification || sinon.stub()}
      analytics={Analytics}
      applications={options.applications || []}
      changeState={options.addNotification || sinon.stub()}
      charms={options.charms || {}}
      estimate={options.estimate || '3500'}
      generatePath={options.addNotification || sinon.stub()}
      getSLAMachineRates={options.getSLAMachineRates || sinon.stub()}
      listPlansForCharm={options.listPlansForCharm || sinon.stub()}
      machineCount={options.machineCount || '3'}
      setSLA={options.setSLA || sinon.stub()} />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
