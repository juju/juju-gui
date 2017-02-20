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
  var acl, groupedChanges, servicesGetById;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-services', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    groupedChanges = {
      '_deploy': {
        'add1': {command: {options: {modelId: 'apache2'}}},
        'add2': {command: {options: {modelId: 'mysql'}}}
      }
    };
    servicesGetById = (id) => {
      return {service: id};
    };
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
        generateAllChangeDescriptions={sinon.stub().returns([{id: 'change1'}])}
        groupedChanges={groupedChanges}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        servicesGetById={servicesGetById}
        showChangelogs={false}
        showTerms={showTerms}
        withPlans={true} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.BudgetTable
          acl={acl}
          allocationEditable={true}
          charmsGetById={charmsGetById}
          extraInfo={{
            'apache2': (
              <ul className="deployment-services__changes">
                {[<juju.components.DeploymentChangeItem
                  change={{id: 'change1'}}
                  key="change1"
                  showTime={false} />]}
              </ul>),
            'mysql': (
              <ul className="deployment-services__changes">
                {[<juju.components.DeploymentChangeItem
                  change={{id: 'change1'}}
                  key="change1"
                  showTime={false} />]}
              </ul>)
          }}
          listPlansForCharm={listPlansForCharm}
          parseTermId={parseTermId}
          plansEditable={true}
          services={[{service: 'apache2'}, {service: 'mysql'}]}
          showExtra={false}
          showTerms={showTerms}
          withPlans={true} />
        <div className="prepend-seven">
          Maximum monthly spend:&nbsp;
          <span className="deployment-services__max">
            $100
          </span>
        </div>
      </div>);
    assert.deepEqual(output, expected);
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
        generateAllChangeDescriptions={sinon.stub().returns([{id: 'change1'}])}
        groupedChanges={groupedChanges}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        servicesGetById={servicesGetById}
        showChangelogs={false}
        showTerms={showTerms}
        withPlans={false} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.BudgetTable
          acl={acl}
          allocationEditable={true}
          charmsGetById={charmsGetById}
          extraInfo={{
            'apache2': (
              <ul className="deployment-services__changes">
                {[<juju.components.DeploymentChangeItem
                  change={{id: 'change1'}}
                  key="change1"
                  showTime={false} />]}
              </ul>),
            'mysql': (
              <ul className="deployment-services__changes">
                {[<juju.components.DeploymentChangeItem
                  change={{id: 'change1'}}
                  key="change1"
                  showTime={false} />]}
              </ul>)
          }}
          listPlansForCharm={listPlansForCharm}
          parseTermId={parseTermId}
          plansEditable={true}
          services={[{service: 'apache2'}, {service: 'mysql'}]}
          showExtra={false}
          showTerms={showTerms}
          withPlans={false} />
        {undefined}
      </div>);
    assert.deepEqual(output, expected);
  });
});
