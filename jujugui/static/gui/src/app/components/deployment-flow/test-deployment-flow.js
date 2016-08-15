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
        groupedChanges={{change: 'change1'}}
        generateAllChangeDescriptions={generateAllChangeDescriptions}
        listBudgets={listBudgets}
        listClouds={listClouds}
        listPlansForCharm={listPlansForCharm}
        listRegions={listRegions}
        listTemplates={listTemplates}
        modelName="Pavlova"
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
            <div className="deployment-flow__header-name">
              Pavlova
            </div>
          </div>
          <div className="deployment-flow__content">
            <div className="twelve-col">
              <div className="inner-wrapper">
                <div>
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
                      groupedChanges={{change: 'change1'}}
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
                      <div>
                        <div className="deployment-flow__deploy-option">
                          <input className="deployment-flow__deploy-checkbox"
                            disabled={false}
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
                            disabled={false}
                            id="terms"
                            type="checkbox" />
                          <label className="deployment-flow__deploy-label"
                            htmlFor="terms">
                            I agree that my use of any services and related APIs
                            is subject to my compliance with the
                            applicable&nbsp;
                            <a href="" target="_blank">Terms of service</a>.
                          </label>
                        </div>
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
        </div>
      </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('can render when there are no changes', function() {
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
                <div>
                  <h2>
                    No changes
                  </h2>
                  <p>
                    There are no changes to deploy. Make some changes to your
                    model and try again.
                  </p>
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
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>);
    output.props.children.props.children[0].props.children[0].props.children
      .props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: {}
      }
    });
  });

  it('can display the cloud section as complete', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('cloud');
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.isTrue(sections[0].props.completed);
  });

  it('correctly sets the cloud title if no cloud is chosen', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.equal(sections[0].props.title, 'Choose cloud to deploy to');
  });

  it('correctly sets the cloud title if a public cloud is chosen', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('azure');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.equal(sections[0].props.title, 'Public cloud');
  });

  it('correctly sets the cloud title if local is chosen', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('local');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.equal(sections[0].props.title, 'Local cloud');
  });

  it('can clear the cloud and credential when changing clouds', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('local');
    instance._setCredential('local');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.isNotNull(instance.state.cloud);
    assert.isNotNull(instance.state.credential);
    sections[0].props.buttons[0].action();
    assert.isNull(instance.state.cloud);
    assert.isNull(instance.state.credential);
  });

  it('can enable the credential section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('cloud');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.isFalse(sections[1].props.disabled);
  });

  it('can enable the machines section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('cloud');
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.isFalse(sections[2].props.disabled);
  });

  it('can enable the services section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('cloud');
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.isFalse(sections[3].props.disabled);
  });

  it('can enable the budget section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('cloud');
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.isFalse(sections[4].props.disabled);
  });

  it('can hide the agreements section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addTemplate={sinon.stub()}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        groupedChanges={{change: 'change1'}}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        user={{}}
        users={{}}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud('cloud');
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    var sections = output.props.children.props.children[1].props.children
      .props.children.props.children.props.children;
    assert.isUndefined(sections[5].props.children.props.children[0]);
  });
});
