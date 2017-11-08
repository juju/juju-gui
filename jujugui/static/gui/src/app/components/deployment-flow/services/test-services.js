/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const BasicTable = require('../../basic-table/basic-table');
const BudgetTable = require('../../budget-table/budget-table');
const DeploymentChangeItem = require('../change-item/change-item');
const DeploymentServices = require('./services');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentServices', function() {
  let acl, sortDescriptionsByApplication;
  let getServiceByName = key => ({name: key});

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    sortDescriptionsByApplication = sinon.stub().returns(
      JSON.parse('{"kibana":[{"id":"service-131","icon":"https://api.jujucharms.com/charmstore/v5/trusty/kibana-15/icon.svg","description":" kibana will be added to the model.","time":"1:28 pm"},{"id":"addUnits-655","icon":"changes-units-added","description":" 1 kibana unit will be added.","time":"1:28 pm"}],"elasticsearch":[{"id":"setConfig-169","icon":"changes-config-changed","description":"Configuration values will be changed for elasticsearch.","time":"1:28 pm"}]}') // eslint-disable-line max-len
    );
  });

  it('can render', function() {
    const addNotification = sinon.stub();
    const listPlansForCharm = sinon.stub();
    const charmsGetById = sinon.stub();
    const parseTermId = sinon.stub();
    const showTerms = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentServices
        acl={acl}
        addNotification={addNotification}
        changesFilterByParent={sinon.stub()}
        charmsGetById={charmsGetById}
        generateAllChangeDescriptions={sinon.stub()}
        generateChangeDescription={sinon.stub()}
        getCurrentChangeSet={sinon.stub().returns({})}
        getServiceByName={getServiceByName}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        showTerms={showTerms}
        sortDescriptionsByApplication={sortDescriptionsByApplication}
        withPlans={true} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div>
        <BudgetTable
          acl={acl}
          addNotification={addNotification}
          allocationEditable={true}
          charmsGetById={charmsGetById}
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
          listPlansForCharm={listPlansForCharm}
          parseTermId={parseTermId}
          plansEditable={true}
          services={[{name: 'kibana'}, {name: 'elasticsearch'}]}
          showTerms={showTerms}
          withPlans={true} />
        <div className="prepend-seven">
          Maximum monthly spend:&nbsp;
          <span className="deployment-services__max">
            $100
          </span>
        </div>
        {null}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without plans', function() {
    const addNotification = sinon.stub();
    const listPlansForCharm = sinon.stub();
    const charmsGetById = sinon.stub();
    const parseTermId = sinon.stub();
    const showTerms = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentServices
        acl={acl}
        addNotification={addNotification}
        changesFilterByParent={sinon.stub()}
        charmsGetById={charmsGetById}
        generateAllChangeDescriptions={sinon.stub()}
        generateChangeDescription={sinon.stub()}
        getCurrentChangeSet={sinon.stub().returns({})}
        getServiceByName={getServiceByName}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        showChangelogs={false}
        showTerms={showTerms}
        sortDescriptionsByApplication={sortDescriptionsByApplication}
        withPlans={false} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div>
        <BudgetTable
          acl={acl}
          addNotification={addNotification}
          allocationEditable={true}
          charmsGetById={charmsGetById}
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
          listPlansForCharm={listPlansForCharm}
          parseTermId={parseTermId}
          plansEditable={true}
          services={[{name: 'kibana'}, {name: 'elasticsearch'}]}
          showTerms={showTerms}
          withPlans={false} />
        {null}
        {null}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render with machines and no services', function() {
    const addNotification = sinon.stub();
    const listPlansForCharm = sinon.stub();
    const charmsGetById = sinon.stub();
    const parseTermId = sinon.stub();
    const showTerms = sinon.stub();
    const machineChanges = [
      {id: 'machine0'},
      {id: 'machine1'}
    ];
    const generateChangeDescription = sinon.stub();
    generateChangeDescription.onFirstCall().returns(machineChanges[0]);
    generateChangeDescription.onSecondCall().returns(machineChanges[1]);
    const renderer = jsTestUtils.shallowRender(
      <DeploymentServices
        acl={acl}
        addNotification={addNotification}
        changesFilterByParent={sinon.stub()}
        charmsGetById={charmsGetById}
        generateAllChangeDescriptions={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        getCurrentChangeSet={sinon.stub().returns({
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
        })}
        getServiceByName={getServiceByName}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        showChangelogs={false}
        showTerms={showTerms}
        sortDescriptionsByApplication={
          sortDescriptionsByApplication.returns(null)}
        withPlans={false} />, true);
    const output = renderer.getRenderOutput();
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
    expect(output).toEqualJSX(expected);
  });
});
