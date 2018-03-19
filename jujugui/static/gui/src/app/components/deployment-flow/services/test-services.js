/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BasicTable = require('../../basic-table/basic-table');
const BudgetTable = require('../../budget-table/budget-table');
const DeploymentChangeItem = require('../change-item/change-item');
const DeploymentServices = require('./services');

describe('DeploymentServices', function() {
  let acl, sortDescriptionsByApplication;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentServices
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      changesFilterByParent={options.changesFilterByParent || sinon.stub()}
      charmsGetById={options.charmsGetById || sinon.stub()}
      generateAllChangeDescriptions={
        options.generateAllChangeDescriptions || sinon.stub()}
      generateChangeDescription={options.generateChangeDescription || sinon.stub()}
      getCurrentChangeSet={options.getCurrentChangeSet || sinon.stub()}
      getServiceByName={options.getServiceByName || sinon.stub()}
      listPlansForCharm={options.listPlansForCharm || sinon.stub()}
      parseTermId={options.parseTermId || sinon.stub()}
      showTerms={options.showTerms || sinon.stub()}
      sortDescriptionsByApplication={
        options.sortDescriptionsByApplication || sortDescriptionsByApplication}
      withPlans={options.withPlans} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    sortDescriptionsByApplication = sinon.stub().returns(
      JSON.parse('{"kibana":[{"id":"service-131","icon":"https://api.jujucharms.com/charmstore/v5/trusty/kibana-15/icon.svg","description":" kibana will be added to the model.","time":"1:28 pm"},{"id":"addUnits-655","icon":"changes-units-added","description":" 1 kibana unit will be added.","time":"1:28 pm"}],"elasticsearch":[{"id":"setConfig-169","icon":"changes-config-changed","description":"Configuration values will be changed for elasticsearch.","time":"1:28 pm"}]}') // eslint-disable-line max-len
    );
  });

  it('can render', function() {
    const wrapper = renderComponent({
      getCurrentChangeSet: sinon.stub().returns({}),
      withPlans: true
    });
    const expected = (
      <div>
        <BudgetTable
          acl={acl}
          addNotification={sinon.stub()}
          allocationEditable={true}
          charmsGetById={sinon.stub()}
          extraInfo={{
            elasticsearch:
              (<ul className="deployment-services__changes">
                <li>
                  <DeploymentChangeItem
                    change={{
                      description: 'Configuration values will be changed for elasticsearch.', // eslint-disable-line max-len
                      icon: 'changes-config-changed',
                      id: 'setConfig-169',
                      time: '1:28 pm'
                    }}
                    showTime={false} />
                </li>
              </ul>),
            kibana:
              <ul className="deployment-services__changes">
                <li>
                  <DeploymentChangeItem
                    change={{
                      description: ' kibana will be added to the model.',
                      icon: 'https://api.jujucharms.com/charmstore/v5/trusty/kibana-15/icon.svg', // eslint-disable-line max-len
                      id: 'service-131',
                      time: '1:28 pm'
                    }}
                    showTime={false} />
                </li>
                <li>
                  <DeploymentChangeItem
                    change={{
                      description: ' 1 kibana unit will be added.',
                      icon: 'changes-units-added',
                      id: 'addUnits-655',
                      time: '1:28 pm'
                    }}
                    showTime={false} />
                </li>
              </ul>
          }}
          listPlansForCharm={sinon.stub()}
          parseTermId={sinon.stub()}
          plansEditable={true}
          services={[{name: 'kibana'}, {name: 'elasticsearch'}]}
          showTerms={sinon.stub()}
          withPlans={true} />
        <div className="deployment-services__spend prepend-seven">
          Maximum monthly spend:&nbsp;
          <span className="deployment-services__max">
            $100
          </span>
        </div>
        {null}
      </div>);
    assert.compareJSX(wrapper, expected);
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
    const generateChangeDescription = sinon.stub();
    generateChangeDescription.onFirstCall().returns(machineChanges[0]);
    generateChangeDescription.onSecondCall().returns(machineChanges[1]);
    const wrapper = renderComponent({
      generateChangeDescription: generateChangeDescription,
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
      }),
      sortDescriptionsByApplication: sinon.stub().returns(null)
    });
    const expected = (
      <div>
        {null}
        {null}
        <BasicTable
          headers={[{
            content: 'Machines',
            columnSize: 12
          }]}
          rows={[{
            columns: [{
              columnSize: 12,
              content: (
                <DeploymentChangeItem
                  change={machineChanges[0]}
                  key={machineChanges[0].id}
                  showTime={false} />)
            }],
            key: machineChanges[0].id
          }, {
            columns: [{
              columnSize: 12,
              content: (
                <DeploymentChangeItem
                  change={machineChanges[1]}
                  key={machineChanges[1].id}
                  showTime={false} />)
            }],
            key: machineChanges[1].id
          }]} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
