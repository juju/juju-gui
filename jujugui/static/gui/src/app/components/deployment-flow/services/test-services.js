/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const shapeup = require('shapeup');

const BasicTable = require('../../shared/basic-table/basic-table');
const BudgetTable = require('../../budget-table/budget-table');
const DeploymentChangeItem = require('../change-item/change-item');
const DeploymentServices = require('./services');

describe('DeploymentServices', function() {
  let acl, changesUtils;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentServices
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      changesUtils={options.changesUtils || changesUtils}
      charmsGetById={options.charmsGetById || sinon.stub()}
      getCurrentChangeSet={options.getCurrentChangeSet || sinon.stub()}
      getServiceByName={options.getServiceByName || sinon.stub()}
      listPlansForCharm={options.listPlansForCharm || sinon.stub()}
      parseTermId={options.parseTermId || sinon.stub()}
      showTerms={options.showTerms || sinon.stub()}
      withPlans={options.withPlans} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    changesUtils = shapeup.addReshape({
      generateAllChangeDescriptions: sinon.stub(),
      generateChangeDescription: sinon.stub(),
      sortDescriptionsByApplication: sinon.stub().returns(
        JSON.parse('{"kibana":[{"id":"service-131","icon":"https://api.jujucharms.com/charmstore/v5/trusty/kibana-15/icon.svg","description":" kibana will be added to the model.","time":"1:28 pm"},{"id":"addUnits-655","icon":"changes-units-added","description":" 1 kibana unit will be added.","time":"1:28 pm"}],"elasticsearch":[{"id":"setConfig-169","icon":"changes-config-changed","description":"Configuration values will be changed for elasticsearch.","time":"1:28 pm"}]}') // eslint-disable-line max-len
      )
    });
  });

  it('can render', function() {
    const wrapper = renderComponent({
      getCurrentChangeSet: sinon.stub().returns({}),
      withPlans: true
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('can render without plans', function() {
    const wrapper = renderComponent({
      getCurrentChangeSet: sinon.stub().returns({}),
      withPlans: false
    });
    assert.equal(wrapper.find('BudgetTable').prop('withPlans'), false);
    assert.equal(wrapper.find('.deployment-services__spend').length, 0);
  });

  it('can render with machines and no services', function() {
    const machineChanges = [
      {id: 'machine0'},
      {id: 'machine1'}
    ];
    changesUtils.generateChangeDescription.onFirstCall().returns(machineChanges[0]);
    changesUtils.generateChangeDescription.onSecondCall().returns(machineChanges[1]);
    changesUtils.sortDescriptionsByApplication.returns(null);
    const wrapper = renderComponent({
      getCurrentChangeSet: sinon.stub().returns({
        destroy1: {
          command: {
            method: '_destroyMachines'
          }
        },
        destroy2: {
          command: {
            method: '_addMachines'
          }
        }
      })
    });
    expect(wrapper).toMatchSnapshot();
  });
});
