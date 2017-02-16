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
  let acl, applications, charmsGetById, getAgreementsByTerms, groupedChanges;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-flow', function() { done(); });
  });

  beforeEach(() => {
    const appId = 'service1';
    acl = {isReadOnly: sinon.stub().returns(false)};
    applications = [
      {get: sinon.stub().returns('service1')},
      {get: sinon.stub().returns('mysql')},
      {get: sinon.stub().returns('service1')}
    ];
    charmsGetById = sinon.stub();
    charmsGetById.withArgs('service1').returns({
      get: sinon.stub().returns(['service1-terms'])
    });
    charmsGetById.withArgs('mysql').returns({
      get: sinon.stub().returns(['mysql-terms', 'general-terms'])
    });
    getAgreementsByTerms = sinon.stub().callsArgWith(1, null, [{
      name: 'service1-terms',
      content: 'service1 terms.',
      owner: 'spinach',
      revision: 5
    }, {
      name: 'mysql-terms',
      content: 'Mysql terms.',
      revision: 9
    }]);
    groupedChanges = {
      _deploy: {
        appId: {
          command: {
            args: [{charmURL: appId}]
          }
        }
      },
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
    var updateModelName = sinon.stub();
    var getAgreementsByTerms = sinon.stub();
    var showTerms = sinon.stub();
    const getCloudProviderDetails = sinon.stub();
    const changes = {};
    const generateCloudCredentialName = sinon.stub();
    const getUserName = sinon.stub().returns('dalek');
    const loginToController = sinon.stub();
    const sendPost = sinon.stub();
    const getDischargeToken = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={changes}
        changesFilterByParent={changesFilterByParent}
        changeState={changeState}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={generateAllChangeDescriptions}
        generateCloudCredentialName={generateCloudCredentialName}
        getAgreementsByTerms={getAgreementsByTerms}
        getAuth={sinon.stub()}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudCredentials={getCloudCredentials}
        getCloudProviderDetails={getCloudProviderDetails}
        getDischargeToken={getDischargeToken}
        getUserName={getUserName}
        gisf={false}
        groupedChanges={groupedChanges}
        listBudgets={listBudgets}
        listClouds={listClouds}
        listPlansForCharm={listPlansForCharm}
        loginToController={loginToController}
        modelCommitted={false}
        modelName="Pavlova"
        sendPost={sendPost}
        servicesGetById={servicesGetById}
        showTerms={showTerms}
        updateCloudCredential={updateCloudCredential}
        updateModelName={updateModelName}
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
              onBlur={instance._updateModelName}
              ref="modelName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^([a-z0-9]([a-z0-9-]*[a-z0-9])?)?$/,
                error: 'This field must only contain lowercase ' +
                  'letters, numbers, and hyphens. It must not start ' +
                  'or end with a hyphen.'
              }]}
              value="Pavlova" />
          </div>
        </juju.components.DeploymentSection>
        <juju.components.DeploymentSection
          instance="deployment-model-login"
          showCheck={false}>
          <div className="six-col">
            <juju.components.USSOLoginLink
              callback={
                output.props.children[1]
                      .props.children.props.children.props.callback}
              displayType={'button'}
              gisf={false}
              sendPost={sendPost}
              getDischargeToken={getDischargeToken}
              loginToController={loginToController} />
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
            credential={undefined}
            cloud={null}
            getCloudProviderDetails={getCloudProviderDetails}
            editable={true}
            generateCloudCredentialName={generateCloudCredentialName}
            getCloudCredentials={getCloudCredentials}
            getCloudCredentialNames={getCloudCredentialNames}
            region={undefined}
            setCredential={instance._setCredential}
            setRegion={instance._setRegion}
            updateCloudCredential={updateCloudCredential}
            user="dalek"
            validateForm={instance._validateForm} />
        </juju.components.DeploymentSection>
        <juju.components.DeploymentSection
          completed={false}
          disabled={true}
          instance="deployment-ssh-key"
          showCheck={false}>
          <juju.components.DeploymentSSHKey
            cloud={null}
            setSSHKey={instance._setSSHKey}
          />
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
              Applications to be deployed
              <juju.components.GenericButton
                action={instance._toggleChangelogs}
                type="inline-neutral"
                extraClasses="right"
                title="Show changelog" />
            </span>}>
          <juju.components.DeploymentServices
            acl={acl}
            changesFilterByParent={changesFilterByParent}
            charmsGetById={charmsGetById}
            generateAllChangeDescriptions={
              generateAllChangeDescriptions}
            groupedChanges={groupedChanges}
            listPlansForCharm={listPlansForCharm}
            parseTermId={instance._parseTermId}
            servicesGetById={servicesGetById}
            showChangelogs={false}
            showTerms={showTerms}
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
            user="dalek" />
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
    const getUserName = sinon.stub();
    const getAgreementsByTerms = sinon.stub();
    const showTerms = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={changes}
        changesFilterByParent={changesFilterByParent}
        changeState={changeState}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={generateAllChangeDescriptions}
        generateCloudCredentialName={generateCloudCredentialName}
        getAgreementsByTerms={getAgreementsByTerms}
        getAuth={sinon.stub()}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudCredentials={getCloudCredentials}
        getCloudProviderDetails={sinon.stub()}
        getUserName={getUserName}
        groupedChanges={groupedChanges}
        isLegacyJuju={true}
        listBudgets={listBudgets}
        listClouds={listClouds}
        listPlansForCharm={listPlansForCharm}
        loginToController={sinon.stub()}
        modelCommitted={false}
        modelName="Pavlova"
        servicesGetById={servicesGetById}
        showTerms={showTerms}
        updateCloudCredential={updateCloudCredential}
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
              Applications to be deployed
              <juju.components.GenericButton
                action={instance._toggleChangelogs}
                type="inline-neutral"
                extraClasses="right"
                title="Show changelog" />
            </span>}>
          <juju.components.DeploymentServices
            acl={acl}
            changesFilterByParent={changesFilterByParent}
            charmsGetById={charmsGetById}
            generateAllChangeDescriptions={
              generateAllChangeDescriptions}
            groupedChanges={groupedChanges}
            listPlansForCharm={listPlansForCharm}
            parseTermId={instance._parseTermId}
            servicesGetById={servicesGetById}
            showChangelogs={false}
            showTerms={showTerms}
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var output = renderer.getRenderOutput();
    assert.isUndefined(output.props.children[0]);
  });

  it('correctly sets the cloud title if no cloud is chosen', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}
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
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    assert.isUndefined(
      output.props.children[9].props.children.props.children[0]);
  });

  it('can handle the agreements when there are no added apps', function() {
    delete groupedChanges['_deploy'];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    var output = renderer.getRenderOutput();
    assert.isUndefined(
      output.props.children[9].props.children.props.children[0]);
  });

  it('can display the agreements section', function() {
    charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['django-terms'])
    });
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={applications}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={getAgreementsByTerms}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        withPlans={true}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    const instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    const output = renderer.getRenderOutput();
    const agreements = output.props.children[9].props.children
      .props.children[0];
    const expected = (
      <div className="deployment-flow__deploy-option">
        <input className="deployment-flow__deploy-checkbox"
          onChange={instance._handleTermsAgreement}
          disabled={false}
          id="terms"
          type="checkbox" />
        <label className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
        </label>
      </div>);
    assert.deepEqual(agreements, expected);
  });

  it('can hide the agreements section', function() {
    getAgreementsByTerms = sinon.stub().callsArgWith(1, null, []);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={applications}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={getAgreementsByTerms}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        withPlans={true}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    const instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    const output = renderer.getRenderOutput();
    const agreements = output.props.children[9].props.children
      .props.children[0];
    assert.isUndefined(agreements);
  });

  it('can disable the agreements section', function() {
    charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['django-terms'])
    });
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={applications}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={getAgreementsByTerms}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        withPlans={true}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const agreements = output.props.children[9].props.children
      .props.children[0];
    const expected = (
      <div className={'deployment-flow__deploy-option ' +
        'deployment-flow__deploy-option--disabled'}>
        <input className="deployment-flow__deploy-checkbox"
          onChange={instance._handleTermsAgreement}
          disabled={true}
          id="terms"
          type="checkbox" />
        <label className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
        </label>
      </div>);
    assert.deepEqual(agreements, expected);
  });

  // Click log in and pass the given error string to the login callback used by
  // the component. Return the component instance.
  const login = function(err) {
    const loginToController = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(false)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={loginToController}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    const instance = renderer.getMountedInstance();
    assert.strictEqual(instance.state.loggedIn, false);
    instance.refs = {
      modelName: {
        getValue: sinon.stub().returns('Lamington')
      }
    };
    const output = renderer.getRenderOutput();
    const loginSection = output.props.children[1];
    const loginButton = loginSection.props.children.props.children.props;
    // Call the supplied callback function which is called after the user
    // logs in.
    loginButton.loginToController(loginButton.callback);
    assert.strictEqual(loginToController.callCount, 1);
    const cb = loginToController.args[0][0];
    cb(err);
    return instance;
  };

  it('can login (success)', function() {
    const instance = login(null);
    assert.strictEqual(instance.state.loggedIn, true);
  });

  it('can login (failure)', function() {
    const instance = login('bad wolf');
    assert.strictEqual(instance.state.loggedIn, false);
  });

  it('can deploy', function() {
    const deploy = sinon.stub().callsArg(0);
    const changeState = sinon.stub();
    let modelName;
    charmsGetById.withArgs('service1').returns({
      get: sinon.stub().returns([])
    });
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        charmsGetById={charmsGetById}
        deploy={deploy}
        environment={{set: (key, value) => {
          assert.strictEqual(key, 'name');
          modelName = value;
        }}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      modelName: {
        getValue: sinon.stub().returns('Lamington')
      }
    };
    instance._updateModelName();
    assert.strictEqual(modelName, 'Lamington');
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    instance._setRegion('north');
    const output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
      .props.action();
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'Lamington');
    assert.deepEqual(deploy.args[0][3], {
      credential: 'cred',
      cloud: 'cloud',
      region: 'north'
    });
    assert.equal(changeState.callCount, 1);
  });

  it('can agree to terms during deploy', function() {
    const deploy = sinon.stub().callsArg(0);
    const addAgreement = sinon.stub();
    charmsGetById.withArgs('service1').returns({
      get: sinon.stub().returns(['service1-terms'])
    });
    getAgreementsByTerms = sinon.stub().callsArgWith(1, null, [{
      name: 'service1-terms',
      owner: 'spinach',
      revision: 5
    }]);
    let modelName;
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={addAgreement}
        addNotification={sinon.stub()}
        applications={applications}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={deploy}
        environment={{set: (key, value) => {
          assert.strictEqual(key, 'name');
          modelName = value;
        }}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={getAgreementsByTerms}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      modelName: {
        getValue: sinon.stub().returns('Lamington')
      }
    };
    instance._updateModelName();
    assert.strictEqual(modelName, 'Lamington');
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    instance._setRegion('north');
    instance._handleTermsAgreement({target: {checked: true}});
    const output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
      .props.action();
    assert.equal(deploy.callCount, 0);
    assert.equal(addAgreement.callCount, 1);
    assert.deepEqual(addAgreement.args[0][0], [{
      name: 'service1-terms',
      owner: 'spinach',
      revision: 5
    }]);
  });

  it('allows or disallows deployments', function() {
    const tests = [{
      about: 'no model name',
      state: {modelName: ''},
      allowed: false
    }, {
      about: 'no model name: legacy juju',
      state: {modelName: ''},
      isLegacyJuju: true,
      allowed: false
    }, {
      about: 'legacy juju',
      state: {modelName: 'mymodel'},
      isLegacyJuju: true,
      allowed: true
    }, {
      about: 'no cloud',
      state: {modelName: 'mymodel'},
      modelCommitted: true,
      allowed: false
    }, {
      about: 'read only',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'}
      },
      isReadOnly: true,
      modelCommitted: true,
      allowed: false
    }, {
      about: 'deploying',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        deploying: true
      },
      modelCommitted: true,
      allowed: false
    }, {
      about: 'model committed',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: 'cred'
      },
      modelCommitted: true,
      noTerms: true,
      allowed: true
    }, {
      about: 'no ssh on azure',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'azure'},
        credential: 'cred'
      },
      allowed: false
    }, {
      about: 'no ssh on aws',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: 'cred'
      },
      noTerms: true,
      allowed: true
    }, {
      about: 'ssh provided on azure',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'azure'},
        credential: 'cred',
        sshKey: 'mykey'
      },
      noTerms: true,
      allowed: true
    }, {
      about: 'ssh provided on aws',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: 'cred',
        sshKey: 'mykey'
      },
      noTerms: true,
      allowed: true
    }, {
      about: 'terms not agreed',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: 'cred',
        terms: ['foo'],
        termsAgreed: false
      },
      allowed: false,
      includeAgreements: true
    }, {
      about: 'terms agreed',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: 'cred',
        terms: ['foo'],
        termsAgreed: true
      },
      noTerms: true,
      allowed: true
    }, {
      about: 'terms not finished loading',
      state: {
        loadingTerms: true,
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: 'cred',
        terms: ['foo'],
        termsAgreed: true
      },
      allowed: false
    }, {
      about: 'deploy should be disabled when there no credentials',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: null
      },
      allowed: false
    }];
    tests.forEach(test => {
      const isLegacyJuju = !!test.isLegacyJuju;
      const acl = {isReadOnly: () => !!test.isReadOnly};
      const modelCommitted = !!test.modelCommitted;
      if (test.noTerms) {
        charmsGetById.withArgs('service1').returns({
          get: sinon.stub().returns([])
        });
      } else {
        charmsGetById.withArgs('service1').returns({
          get: sinon.stub().returns(['service1-terms'])
        });
      }
      const renderer = jsTestUtils.shallowRender(
        <juju.components.DeploymentFlow
          acl={acl}
          addAgreement={sinon.stub()}
          addNotification={sinon.stub()}
          applications={applications}
          changes={{}}
          changesFilterByParent={sinon.stub()}
          changeState={sinon.stub()}
          charmsGetById={charmsGetById}
          deploy={sinon.stub()}
          environment={{}}
          generateAllChangeDescriptions={sinon.stub()}
          generateCloudCredentialName={sinon.stub()}
          getAgreementsByTerms={
            test.includeAgreements ? getAgreementsByTerms : sinon.stub()}
          getAuth={sinon.stub().returns(true)}
          getCloudCredentialNames={sinon.stub()}
          getCloudCredentials={sinon.stub()}
          getCloudProviderDetails={sinon.stub()}
          getUserName={sinon.stub()}
          groupedChanges={groupedChanges}
          isLegacyJuju={isLegacyJuju}
          listBudgets={sinon.stub()}
          listClouds={sinon.stub()}
          listPlansForCharm={sinon.stub()}
          loginToController={sinon.stub()}
          modelCommitted={modelCommitted}
          modelName="Pavlova"
          servicesGetById={sinon.stub()}
          showTerms={sinon.stub()}
          updateCloudCredential={sinon.stub()}>
          <span>content</span>
        </juju.components.DeploymentFlow>, true);
      const instance = renderer.getMountedInstance();
      instance.setState(test.state);
      const allowed = instance._deploymentAllowed();
      assert.strictEqual(allowed, test.allowed, test.about);
    });
  });

  it('can disable the deploy button on deploy', function () {
    var deploy = sinon.stub();
    var changeState = sinon.stub();
    charmsGetById.withArgs('service1').returns({
      get: sinon.stub().returns([])
    });
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        charmsGetById={charmsGetById}
        deploy={deploy}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
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
    let output = renderer.getRenderOutput();
    let deployButton = output.props.children[9].props.children.props
      .children[1].props.children.props;
    deployButton.action();

    // .action() rerenders the component so we need to get it again
    output = renderer.getRenderOutput();
    deployButton = output.props.children[9].props.children.props
      .children[1].props.children.props;

    assert.equal(deployButton.disabled, true);
    assert.equal(deployButton.title, 'Deploying...');
  });

  it('can deploy without updating the model name', function() {
    var deploy = sinon.stub().callsArg(0);
    var changeState = sinon.stub();
    charmsGetById.withArgs('service1').returns({
      get: sinon.stub().returns([])
    });
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        charmsGetById={charmsGetById}
        deploy={deploy}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {};
    instance._setCloud({name: 'cloud'});
    instance._setCredential('cred');
    instance._setRegion('north');
    var output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
      .props.action();
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'Pavlova');
    assert.deepEqual(deploy.args[0][3], {
      credential: 'cred',
      cloud: 'cloud',
      region: 'north'
    });
    assert.equal(changeState.callCount, 1);
  });

  it('can deploy with SSH keys', function() {
    var deploy = sinon.stub().callsArg(0);
    var changeState = sinon.stub();
    charmsGetById.withArgs('service1').returns({
      get: sinon.stub().returns([])
    });
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        charmsGetById={charmsGetById}
        deploy={deploy}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub().returns(true)}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="mymodel"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance._setCloud({name: 'azure'});
    instance._setCredential('creds');
    instance._setRegion('skaro');
    instance._setSSHKey('my SSH key');
    var output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
      .props.action();
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'mymodel');
    assert.deepEqual(deploy.args[0][3], {
      credential: 'creds',
      cloud: 'azure',
      region: 'skaro',
      config: {'authorized-keys': 'my SSH key'}
    });
    assert.equal(changeState.callCount, 1);
  });


  it('can deploy with Juju 1', function() {
    var deploy = sinon.stub().callsArg(0);
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={changeState}
        charmsGetById={charmsGetById}
        deploy={deploy}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        isLegacyJuju={true}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelCommitted={true}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {};
    var output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
      .props.action();
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'Pavlova');
    assert.deepEqual(deploy.args[0][3], {
      credential: undefined,
      cloud: undefined,
      region: undefined
    });
    assert.equal(changeState.callCount, 1);
  });

  it('focuses on the model name field when loaded', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={[]}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={sinon.stub()}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {modelName: {focus: sinon.stub()}};
    instance.componentDidMount();
    assert.equal(instance.refs.modelName.focus.callCount, 1);
  });

  it('aborts the requests when unmounting', function() {
    const abort = sinon.stub();
    const getAgreementsByTerms = sinon.stub().returns({abort: abort});
    let renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentFlow
        acl={acl}
        addAgreement={sinon.stub()}
        addNotification={sinon.stub()}
        applications={applications}
        changes={{}}
        changesFilterByParent={sinon.stub()}
        changeState={sinon.stub()}
        charmsGetById={charmsGetById}
        deploy={sinon.stub()}
        environment={{}}
        generateAllChangeDescriptions={sinon.stub()}
        generateCloudCredentialName={sinon.stub()}
        getAgreementsByTerms={getAgreementsByTerms}
        getAuth={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        getUserName={sinon.stub()}
        groupedChanges={groupedChanges}
        listBudgets={sinon.stub()}
        listClouds={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        loginToController={sinon.stub()}
        modelName="Pavlova"
        servicesGetById={sinon.stub()}
        showTerms={sinon.stub()}
        updateCloudCredential={sinon.stub()}>
        <span>content</span>
      </juju.components.DeploymentFlow>, true);
    renderer.unmount();
    assert.deepEqual(abort.callCount, 1);
  });

  describe('_parseTermId', function() {
    let parseTermId;

    beforeAll(function() {
      parseTermId = juju.components.DeploymentFlow.prototype._parseTermId;
    });

    it('can get the name', function() {
      assert.deepEqual(parseTermId('general'), {
        name: 'general',
        owner: null,
        revision: null
      });
    });

    it('can get the name and owner', function() {
      assert.deepEqual(parseTermId('spinach/general'), {
        name: 'general',
        owner: 'spinach',
        revision: null
      });
    });

    it('can get the name and revision', function() {
      assert.deepEqual(parseTermId('general/22'), {
        name: 'general',
        owner: null,
        revision: 22
      });
    });

    it('can get the name, owner and revision', function() {
      assert.deepEqual(parseTermId('spinach/general/22'), {
        name: 'general',
        owner: 'spinach',
        revision: 22
      });
    });
  });
});
