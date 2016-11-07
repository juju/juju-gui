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

fdescribe('DeploymentFlow', function() {
  var acl, groupedChanges;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-flow', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    groupedChanges = {
      _deploy: {service: 'service1'},
      _addMachines: {machine: 'machine1'}
    };
  });

  it('can render', function() {
    var updateCloudCredential = sinon.stub();
    var changesFilterByParent = sinon.stub();
    var changeState = sinon.stub();
    var generateAllChangeDescriptions = sinon.stub();
    var listBudgets = sinon.stub();
    var listClouds = sinon.stub();
    var listPlansForCharm = sinon.stub();
    var getCloudCredentials = sinon.stub();
    var getCloudCredentialNames = sinon.stub();
    var servicesGetById = sinon.stub();
    const getCloudProviderDetails = sinon.stub();
    const changes = {};
    const generateCloudCredentialName = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        updateCloudCredential={updateCloudCredential}
        changes={changes}
        changesFilterByParent={changesFilterByParent}
        changeState={changeState}
        controller={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={generateAllChangeDescriptions}
        generateCloudCredentialName={generateCloudCredentialName}
        getAuth={sinon.stub()}
        getCloudCredentials={getCloudCredentials}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        groupedChanges={groupedChanges}
        listBudgets={listBudgets}
        listClouds={listClouds}
        listPlansForCharm={listPlansForCharm}
        modelCommitted={false}
        modelName="Pavlova"
        servicesGetById={servicesGetById}
        user="user-admin"
        withPlans={true}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentPanel
        changeState={changeState}
        title="Pavlova">
        <juju.components.DeploymentSection
          instance="deployment-model-name"
          showCheck={false}
          title="Model name">
          <div className="six-col">
            <juju.components.GenericInput
              disabled={false}
              key="modelName"
              label="Model name"
              required={true}
              ref="modelName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/,
                error: 'This field must only contain lowercase ' +
                  'letters, numbers, and hyphens. It must not start ' +
                  'or end with a hyphen.'
              }]}
              value="" />
          </div>
        </juju.components.DeploymentSection>
        <juju.components.DeploymentSection
          instance="deployment-model-login"
          showCheck={false}>
          <div className="six-col">
            <juju.components.GenericButton
              action={instance._handleLogin}
              type="positive"
              title="Sign up or Login" />
          </div>
        </juju.components.DeploymentSection>
        {undefined}
        <juju.components.DeploymentSection
          completed={false}
          disabled={true}
          instance="deployment-credential"
          showCheck={false}>
          <juju.components.DeploymentCredential
            acl={acl}
            updateCloudCredential={updateCloudCredential}
            cloud={null}
            getCloudProviderDetails={getCloudProviderDetails}
            credential={undefined}
            editable={true}
            generateCloudCredentialName={generateCloudCredentialName}
            getCloudCredentials={getCloudCredentials}
            getCloudCredentialNames={getCloudCredentialNames}
            region={undefined}
            setCredential={instance._setCredential}
            setRegion={instance._setRegion}
            user="user-admin"
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
            cloud={null}
            machines={groupedChanges._addMachines} />
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
            groupedChanges={groupedChanges}
            listPlansForCharm={listPlansForCharm}
            servicesGetById={servicesGetById}
            showChangelogs={false}
            withPlans={true} />
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
            setBudget={instance._setBudget}
            user="user-admin" />
        </juju.components.DeploymentSection>
        <juju.components.DeploymentSection
          completed={false}
          disabled={true}
          instance="deployment-changes"
          showCheck={false}
          title="Model changes">
          <juju.components.DeploymentChanges
          changes={changes}
          generateAllChangeDescriptions={
            generateAllChangeDescriptions} />
        </juju.components.DeploymentSection>
        <div className="twelve-col">
          <div className="deployment-flow__deploy">
            {undefined}
            <div className="deployment-flow__deploy-action">
              <juju.components.GenericButton
                action={instance._handleDeploy}
                disabled={true}
                type="positive"
                title="Deploy" />
            </div>
          </div>
        </div>
      </juju.components.DeploymentPanel>);
    assert.deepEqual(output, expected);
  });

  it('can render for Juju 1', function() {
    var updateCloudCredential = sinon.stub();
    var changesFilterByParent = sinon.stub();
    var changeState = sinon.stub();
    var generateAllChangeDescriptions = sinon.stub();
    var listBudgets = sinon.stub();
    var listClouds = sinon.stub();
    var listPlansForCharm = sinon.stub();
    var getCloudCredentials = sinon.stub();
    var getCloudCredentialNames = sinon.stub();
    var servicesGetById = sinon.stub();
    const changes = {};
    const generateCloudCredentialName = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        updateCloudCredential={updateCloudCredential}
        changes={changes}
        controllerAPI={sinon.stub()}
        changesFilterByParent={changesFilterByParent}
        changeState={changeState}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={generateAllChangeDescriptions}
        generateCloudCredentialName={generateCloudCredentialName}
        getAuth={sinon.stub()}
        getCloudCredentials={getCloudCredentials}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        isLegacyJuju={true}
        listBudgets={listBudgets}
        listClouds={listClouds}
        listPlansForCharm={listPlansForCharm}
        modelCommitted={false}
        modelName="Pavlova"
        servicesGetById={servicesGetById}
        user="user-admin"
        withPlans={true}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentPanel
        changeState={changeState}
        title="Pavlova">
        {undefined}
        {undefined}
        {undefined}
        {undefined}
        <juju.components.DeploymentSection
          completed={false}
          disabled={false}
          instance="deployment-machines"
          showCheck={false}
          title="Machines to be deployed">
          <juju.components.DeploymentMachines
            acl={acl}
            cloud={null}
            machines={groupedChanges._addMachines} />
        </juju.components.DeploymentSection>
        <juju.components.DeploymentSection
          completed={false}
          disabled={false}
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
            groupedChanges={groupedChanges}
            listPlansForCharm={listPlansForCharm}
            servicesGetById={servicesGetById}
            showChangelogs={false}
            withPlans={true} />
        </juju.components.DeploymentSection>
        {undefined}
        <juju.components.DeploymentSection
          completed={false}
          disabled={false}
          instance="deployment-changes"
          showCheck={false}
          title="Model changes">
          <juju.components.DeploymentChanges
          changes={changes}
          generateAllChangeDescriptions={
            generateAllChangeDescriptions} />
        </juju.components.DeploymentSection>
        <div className="twelve-col">
          <div className="deployment-flow__deploy">
            {undefined}
            <div className="deployment-flow__deploy-action">
              <juju.components.GenericButton
                action={instance._handleDeploy}
                disabled={false}
                type="positive"
                title="Deploy" />
            </div>
          </div>
        </div>
      </juju.components.DeploymentPanel>);
    assert.deepEqual(output, expected);
  });

  it('can display the cloud section as complete', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    assert.isTrue(output.props.children[2].props.completed);
  });

  it('does not show the model name when comitting', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var output = renderer.getRenderOutput();
    assert.isUndefined(output.props.children[0]);
  });

  it('correctly sets the cloud title if no cloud is chosen', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
      getAuth={sinon.stub().returns(true)}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[2].props.title, 'Choose cloud to deploy to');
  });

  it('correctly sets the cloud title if a public cloud is chosen', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'azure'});
    var output = renderer.getRenderOutput();
    assert.equal(output.props.children[2].props.title, 'Public cloud');
  });

  it('correctly sets the cloud title if local is chosen', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'local'});
    var output = renderer.getRenderOutput();
    assert.equal(output.props.children[2].props.title, 'Local cloud');
  });

  it('can clear the cloud and credential when changing clouds', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'local'});
    instance._setCredential('local');
    var output = renderer.getRenderOutput();
    assert.isNotNull(instance.state.cloud);
    assert.isNotNull(instance.state.credential);
    output.props.children[2].props.buttons[0].action();
    assert.isNull(instance.state.cloud);
    assert.isNull(instance.state.credential);
  });

  it('can enable the credential section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    var output = renderer.getRenderOutput();
    assert.isFalse(output.props.children[2].props.disabled);
  });

  it('can enable the machines section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    assert.isFalse(output.props.children[3].props.disabled);
  });

  it('can enable the services section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    assert.isFalse(output.props.children[4].props.disabled);
  });

  it('can enable the budget section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin"
        withPlans={true}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    assert.isFalse(output.props.children[5].props.disabled);
  });

  it('can hide the agreements section', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    assert.isUndefined(
      output.props.children[8].props.children.props.children[0]);
  });

  it('can deploy', function() {
    var deploy = sinon.stub().callsArg(0);
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        controllerAPI={sinon.stub()}
        deploy={deploy}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {
      modelName: {
        getValue: sinon.stub().returns('Lamington')
      }
    };
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    instance._setRegion('north');
    var output = renderer.getRenderOutput();
    output.props.children[8].props.children.props.children[1].props.children
      .props.action();
    assert.equal(deploy.callCount, 1);
    assert.equal(deploy.args[0][2], 'Lamington');
    assert.equal(deploy.args[0][3], 'cred');
    assert.equal(deploy.args[0][4], 'cloud');
    assert.equal(deploy.args[0][5], 'north');
    assert.equal(changeState.callCount, 1);
  });

  it('can deploy without a model name', function() {
    var deploy = sinon.stub().callsArg(0);
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        deploy={deploy}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {};
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    instance._setRegion('north');
    var output = renderer.getRenderOutput();
    output.props.children[8].props.children.props.children[1].props.children
      .props.action();
    assert.equal(deploy.callCount, 1);
    assert.equal(deploy.args[0][2], '');
    assert.equal(deploy.args[0][3], 'cred');
    assert.equal(deploy.args[0][4], 'cloud');
    assert.equal(deploy.args[0][5], 'north');
    assert.equal(changeState.callCount, 1);
  });

  it('can deploy with Juju 1', function() {
    var deploy = sinon.stub().callsArg(0);
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        deploy={deploy}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        isLegacyJuju={true}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {};
    var output = renderer.getRenderOutput();
    output.props.children[8].props.children.props.children[1].props.children
      .props.action();
    assert.equal(deploy.callCount, 1);
    assert.equal(deploy.args[0][2], '');
    assert.equal(deploy.args[0][3], null);
    assert.equal(deploy.args[0][4], null);
    assert.equal(deploy.args[0][5], null);
    assert.equal(changeState.callCount, 1);
  });

  it('focuses on the model name field when loaded', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        deploy={sinon.stub()}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        user="user-admin">
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {modelName: {focus: sinon.stub()}};
    instance.componentDidMount();
    assert.equal(instance.refs.modelName.focus.callCount, 1);
  });
});
