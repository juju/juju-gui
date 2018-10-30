/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BasicTable = require('../../../shared/basic-table/basic-table');
const DeploymentPlanTable = require('./plan-table');

describe('DeploymentPlanTable', () => {
  let applications, charms, listPlansForCharm;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentPlanTable
      addNotification={options.addNotification || sinon.stub()}
      applications={options.applications || applications}
      charms={options.charms || charms}
      listPlansForCharm={options.listPlansForCharm || listPlansForCharm} />
  );

  beforeEach(() => {
    applications = [{
      getAttrs: sinon.stub().returns({
        icon: 'apache2.svg',
        charm: 'cs:apache2',
        id: 'apache2-123',
        name: 'apache2'
      })
    }, {
      getAttrs: sinon.stub().returns({
        charm: 'cs:mysql'
      })
    }];
    charms = {
      getById: sinon.stub()
    };
    charms.getById.withArgs('cs:apache2').returns({
      get: sinon.stub().withArgs('id').returns('cs:apache2'),
      hasMetrics: sinon.stub().returns(true)
    });
    charms.getById.withArgs('cs:mysql').returns({
      hasMetrics: sinon.stub().returns(false)
    });
    listPlansForCharm = sinon.stub().callsArgWith(1, null, [{
      description: 'The standard plan description',
      metrics: {
        memory: 'something'
      },
      price: '$3.25 per GB of RAM per month'
    }]);
  });

  it('can render', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can handle errors when getting plans', function() {
    const addNotification = sinon.stub();
    listPlansForCharm.callsArgWith(1, 'Uh oh!', null);
    renderComponent({addNotification});
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Fetching plans failed',
      message: 'Fetching plans failed: Uh oh!',
      level: 'error'
    });
  });
});
