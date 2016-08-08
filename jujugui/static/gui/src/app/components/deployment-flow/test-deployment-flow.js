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

describe('DeploymentFlow', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-flow', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    var addTemplate = sinon.stub();
    var changesFilterByParent = sinon.stub();
    var changeState = sinon.stub();
    var generateAllChangeDescriptions = sinon.stub();
    var listBudgets = sinon.stub();
    var listClouds = sinon.stub();
    var listPlansForCharm = sinon.stub();
    var listRegions = sinon.stub();
    var listTemplates = sinon.stub();
    var servicesGetById = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={addTemplate}
        changesFilterByParent={changesFilterByParent}
        changeState={changeState}
        groupedChanges={{}}
        generateAllChangeDescriptions={generateAllChangeDescriptions}
        listBudgets={listBudgets}
        listClouds={listClouds}
        listPlansForCharm={listPlansForCharm}
        listRegions={listRegions}
        listTemplates={listTemplates}
        servicesGetById={servicesGetById}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.Panel
        instanceName="deployment-flow-panel"
        visible={true}>
        <div className="deployment-flow">
          <div className="deployment-flow__header">
            <div className="deployment-flow__close">
              <juju.components.GenericButton
                action={instance._handleClose}
                type="neutral"
                title="Back to canvas" />
            </div>
          </div>
          <div className="deployment-flow__content">
            <div className="twelve-col">
              <div className="inner-wrapper">
                <juju.components.DeploymentSection
                  buttons={undefined}
                  completed={false}
                  disabled={false}
                  instance="deployment-cloud"
                  showCheck={true}
                  title="Choose cloud to deploy to">
                  <juju.components.DeploymentCloud
                    acl={acl}
                    cloud={null}
                    clouds={instance.CLOUDS}
                    listClouds={listClouds}
                    setCloud={instance._setCloud} />
                </juju.components.DeploymentSection>
                <juju.components.DeploymentSection
                  completed={false}
                  disabled={true}
                  instance="deployment-credential"
                  showCheck={false}>
                  <juju.components.DeploymentCredential
                    acl={acl}
                    addTemplate={addTemplate}
                    credential={null}
                    cloud={null}
                    clouds={instance.CLOUDS}
                    listRegions={listRegions}
                    listTemplates={listTemplates}
                    region={null}
                    setCredential={instance._setCredential}
                    setRegion={instance._setRegion}
                    setTemplate={instance._setTemplate}
                    template={null}
                    users={{}}
                    validateForm={instance._validateForm} />
                </juju.components.DeploymentSection>
                <juju.components.DeploymentSection
                  completed={false}
                  disabled={true}
                  instance="deployment-machines"
                  showCheck={false}
                  title="Machines to be deployed">
                  <juju.components.DeploymentMachines
                    acl={acl}
                    cloud={null} />
                </juju.components.DeploymentSection>
                <juju.components.DeploymentSection
                  completed={false}
                  disabled={true}
                  instance="deployment-services"
                  showCheck={true}
                  title={
                    <span className="deployment-flow__service-title">
                      Services to be deployed
                      <juju.components.GenericButton
                        action={instance._toggleChangelogs}
                        type="base"
                        title="Show changelog" />
                    </span>}>
                  <juju.components.DeploymentServices
                    acl={acl}
                    changesFilterByParent={changesFilterByParent}
                    generateAllChangeDescriptions={
                      generateAllChangeDescriptions}
                    groupedChanges={{}}
                    cloud={null}
                    listPlansForCharm={listPlansForCharm}
                    servicesGetById={servicesGetById}
                    showChangelogs={false} />
                </juju.components.DeploymentSection>
                <juju.components.DeploymentSection
                  completed={false}
                  disabled={true}
                  instance="deployment-budget"
                  showCheck={true}
                  title="Confirm budget">
                  <juju.components.DeploymentBudget
                    acl={acl}
                    listBudgets={listBudgets}
                    user={{}} />
                </juju.components.DeploymentSection>
                <div className="twelve-col">
                  <div className="deployment-flow__deploy">
                    <div className="deployment-flow__deploy-option">
                      <input className="deployment-flow__deploy-checkbox"
                        disabled={true}
                        id="emails"
                        type="checkbox" />
                      <label className="deployment-flow__deploy-label"
                        htmlFor="emails">
                        Please email me updates regarding feature
                        announcements, performance suggestions, feedback
                        surveys and special offers.
                      </label>
                    </div>
                    <div className="deployment-flow__deploy-option">
                      <input className="deployment-flow__deploy-checkbox"
                        disabled={true}
                        id="terms"
                        type="checkbox" />
                      <label className="deployment-flow__deploy-label"
                        htmlFor="terms">
                        I agree that my use of any services and related APIs
                        is subject to my compliance with the applicable&nbsp;
                        <a href="" target="_blank">Terms of service</a>.
                      </label>
                    </div>
                    <div className="deployment-flow__deploy-action">
                      <juju.components.GenericButton
                        action={undefined}
                        disabled={true}
                        type="positive"
                        title="Deploy" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('can close', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>);
    output.props.children.props.children[0].props.children.props.children
      .props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: {}
      }
    });
  });
});
