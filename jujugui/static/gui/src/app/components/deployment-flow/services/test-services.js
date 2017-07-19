/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentServices', function() {
  let acl, sortDescriptionsByApplication;
  let getServiceByName = key => ({name: key});

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-services', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    sortDescriptionsByApplication = sinon.stub().returns(
      JSON.parse('{"kibana":[{"id":"service-131","icon":"https://api.jujucharms.com/charmstore/v5/trusty/kibana-15/icon.svg","description":" kibana will be added to the model.","time":"1:28 pm"},{"id":"addUnits-655","icon":"changes-units-added","description":" 1 kibana unit will be added.","time":"1:28 pm"}],"elasticsearch":[{"id":"setConfig-169","icon":"changes-config-changed","description":"Configuration values will be changed for elasticsearch.","time":"1:28 pm"}]}') // eslint-disable-line max-len
    );
  });

  it('can render', function() {
    var listPlansForCharm = sinon.stub();
    const charmsGetById = sinon.stub();
    const parseTermId = sinon.stub();
    const showTerms = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentServices
        acl={acl}
        changesFilterByParent={sinon.stub()}
        charmsGetById={charmsGetById}
        generateAllChangeDescriptions={sinon.stub()}
        getCurrentChangeSet={sinon.stub()}
        getServiceByName={getServiceByName}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        showTerms={showTerms}
        sortDescriptionsByApplication={sortDescriptionsByApplication}
        withPlans={true} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.BudgetTable
          acl={acl}
          allocationEditable={true}
          charmsGetById={charmsGetById}
          extraInfo={{
            elasticsearch:
              (<ul className="deployment-services__changes">
                <DeploymentChangeItem
                  change={{
                    description: 'Configuration values will be changed for elasticsearch.', // eslint-disable-line max-len
                    icon: 'changes-config-changed',
                    id: 'setConfig-169',
                    time: '1:28 pm'
                  }}
                  showTime={false}/>
              </ul>),
            kibana:
              <ul className="deployment-services__changes">
                <DeploymentChangeItem
                  change={{
                    description: ' kibana will be added to the model.',
                    icon: 'https://api.jujucharms.com/charmstore/v5/trusty/kibana-15/icon.svg', // eslint-disable-line max-len
                    id: 'service-131',
                    time: '1:28 pm'
                  }}
                  showTime={false}/>
                <DeploymentChangeItem
                  change={{
                    description: ' 1 kibana unit will be added.',
                    icon: 'changes-units-added',
                    id: 'addUnits-655',
                    time: '1:28 pm'
                  }}
                  showTime={false}/>
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
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without plans', function() {
    var listPlansForCharm = sinon.stub();
    const charmsGetById = sinon.stub();
    const parseTermId = sinon.stub();
    const showTerms = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentServices
        acl={acl}
        changesFilterByParent={sinon.stub()}
        charmsGetById={charmsGetById}
        generateAllChangeDescriptions={sinon.stub()}
        getCurrentChangeSet={sinon.stub()}
        getServiceByName={getServiceByName}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        showChangelogs={false}
        showTerms={showTerms}
        sortDescriptionsByApplication={sortDescriptionsByApplication}
        withPlans={false} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.BudgetTable
          acl={acl}
          allocationEditable={true}
          charmsGetById={charmsGetById}
          extraInfo={{
            elasticsearch:
              (<ul className="deployment-services__changes">
                <DeploymentChangeItem
                  change={{
                    description: 'Configuration values will be changed for elasticsearch.', // eslint-disable-line max-len
                    icon: 'changes-config-changed',
                    id: 'setConfig-169',
                    time: '1:28 pm'
                  }}
                  showTime={false}/>
              </ul>),
            kibana:
              <ul className="deployment-services__changes">
                <DeploymentChangeItem
                  change={{
                    description: ' kibana will be added to the model.',
                    icon: 'https://api.jujucharms.com/charmstore/v5/trusty/kibana-15/icon.svg', // eslint-disable-line max-len
                    id: 'service-131',
                    time: '1:28 pm'
                  }}
                  showTime={false}/>
                <DeploymentChangeItem
                  change={{
                    description: ' 1 kibana unit will be added.',
                    icon: 'changes-units-added',
                    id: 'addUnits-655',
                    time: '1:28 pm'
                  }}
                  showTime={false}/>
              </ul>
          }}
          listPlansForCharm={listPlansForCharm}
          parseTermId={parseTermId}
          plansEditable={true}
          services={[{name: 'kibana'}, {name: 'elasticsearch'}]}
          showTerms={showTerms}
          withPlans={false} />
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
