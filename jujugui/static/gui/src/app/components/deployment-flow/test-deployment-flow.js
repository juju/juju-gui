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

/**
  Convenience function for quickly and easily creating a DeploymentFlow
  component. It accept a props param, which can be used to change defaults (on
  required props) or provide values (on optional props).
 */
const createDeploymentFlow = (props = {}) => {
  // Setup all the default props.
  const appId = 'service1';
  const charmsGetById = sinon.stub();
  charmsGetById.withArgs('service1').returns({
    get: sinon.stub().withArgs('terms').returns(['service1-terms'])
  });
  charmsGetById.withArgs('mysql').returns({
    get: sinon.stub().withArgs('terms').returns(['my-terms', 'general-terms'])
  });
  const getAgreementsByTerms = sinon.stub().callsArgWith(1, null, [{
    name: 'service1-terms',
    content: 'service1 terms.',
    owner: 'spinach',
    revision: 5
  }, {
    name: 'my-terms',
    content: 'Mysql terms.',
    revision: 9
  }]);
  const groupedChanges = {
    _deploy: {
      appId: {
        command: {
          args: [{charmURL: appId}]
        }
      }
    },
    _addMachines: {machine: 'machine1'}
  };
  // Note that the defaults are *only* set for required DeploymentFlow props.
  const defaults = {
    acl: {isReadOnly: sinon.stub().returns(false)},
    addAgreement: sinon.stub(),
    addNotification: sinon.stub(),
    applications: [],
    changeState: sinon.stub(),
    changes: {},
    changesFilterByParent: sinon.stub(),
    charmsGetById: charmsGetById,
    charmstore: {},
    deploy: sinon.stub().callsArg(0),
    generateAllChangeDescriptions: sinon.stub(),
    generateCloudCredentialName: sinon.stub(),
    getAgreementsByTerms: getAgreementsByTerms,
    getAuth: sinon.stub().returns({}),
    getCloudProviderDetails: sinon.stub(),
    getUserName: sinon.stub().returns('dalek'),
    groupedChanges: groupedChanges,
    listBudgets: sinon.stub(),
    listPlansForCharm: sinon.stub(),
    loginToController: sinon.stub(),
    modelName: 'Pavlova',
    servicesGetById: sinon.stub(),
    setModelName: sinon.stub(),
    showTerms: sinon.stub(),
    storeUser: sinon.stub(),
    withPlans: true
  };
  // Merge the user-specified props with the default props.
  const userKeys = Object.keys(props);
  Object.keys(defaults).forEach(defaultKey => {
    // If a certain prop isn't specified by the user, assign it to the
    // default value.
    if (userKeys.indexOf(defaultKey) < 0) {
      props[defaultKey] = defaults[defaultKey];
    }
  });
  return jsTestUtils.shallowRender(
    <juju.components.DeploymentFlow {...props}>
      <span>content</span>
    </juju.components.DeploymentFlow>, true);
};

describe('DeploymentFlow', function() {
  let applications;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-flow', function() { done(); });
  });

  beforeEach(() => {
    applications = [
      {get: sinon.stub().returns('service1')},
      {get: sinon.stub().returns('mysql')},
      {get: sinon.stub().returns('service1')}
    ];
  });

  it('can render', function() {
    const renderer = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub().callsArgWith(1, null, []),
      modelCommitted: false,
      withPlans: true
    });
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const props = instance.props;
    const expected = (
      <juju.components.DeploymentPanel
        changeState={props.changeState}
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
          buttons={undefined}
          completed={false}
          disabled={false}
          instance="deployment-cloud"
          showCheck={true}
          title="Choose cloud to deploy to">
          <juju.components.DeploymentCloud
            acl={props.acl}
            cloud={null}
            listClouds={props.listClouds}
            getCloudProviderDetails={props.getCloudProviderDetails}
            setCloud={instance._setCloud} />
        </juju.components.DeploymentSection>
        <juju.components.DeploymentSection
          completed={false}
          disabled={true}
          instance="deployment-credential"
          showCheck={false}>
          <juju.components.DeploymentCredential
            acl={props.acl}
            addNotification={props.addNotification}
            credential={undefined}
            cloud={null}
            getCloudProviderDetails={props.getCloudProviderDetails}
            editable={true}
            generateCloudCredentialName={props.generateCloudCredentialName}
            getCloudCredentials={props.getCloudCredentials}
            getCloudCredentialNames={props.getCloudCredentialNames}
            region={undefined}
            setCredential={instance._setCredential}
            setRegion={instance._setRegion}
            updateCloudCredential={props.updateCloudCredential}
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
            acl={props.acl}
            cloud={null}
            machines={props.groupedChanges._addMachines} />
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
            acl={props.acl}
            changesFilterByParent={props.changesFilterByParent}
            charmsGetById={props.charmsGetById}
            generateAllChangeDescriptions={props.generateAllChangeDescriptions}
            groupedChanges={props.groupedChanges}
            listPlansForCharm={props.listPlansForCharm}
            parseTermId={instance._parseTermId}
            servicesGetById={props.servicesGetById}
            showChangelogs={false}
            showTerms={props.showTerms}
            withPlans={true} />
        </juju.components.DeploymentSection>
        <juju.components.DeploymentSection
          completed={false}
          disabled={true}
          instance="deployment-budget"
          showCheck={true}
          title="Confirm budget">
          <juju.components.DeploymentBudget
            acl={props.acl}
            listBudgets={props.listBudgets}
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
            changes={props.changes}
            generateAllChangeDescriptions={
              props.generateAllChangeDescriptions}/>
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
    const renderer = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub(),
      getUserName: sinon.stub(),
      isLegacyJuju: true,
      withPlans: true
    });
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const props = instance.props;
    const expected = (
      <juju.components.DeploymentPanel
        changeState={props.changeState}
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
            acl={props.acl}
            cloud={null}
            machines={props.groupedChanges._addMachines} />
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
            acl={props.acl}
            changesFilterByParent={props.changesFilterByParent}
            charmsGetById={props.charmsGetById}
            generateAllChangeDescriptions={
              props.generateAllChangeDescriptions}
            groupedChanges={props.groupedChanges}
            listPlansForCharm={props.listPlansForCharm}
            parseTermId={instance._parseTermId}
            servicesGetById={props.servicesGetById}
            showChangelogs={false}
            showTerms={props.showTerms}
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
          changes={props.changes}
          generateAllChangeDescriptions={
            props.generateAllChangeDescriptions} />
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
    const renderer = createDeploymentFlow({
      credential: 'cred',
      modelCommitted: false
    });
    const instance = renderer.getMountedInstance();
    instance.setState({cloud: {name: 'cloud'}});
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[1].props.completed, true);
  });

  it('does not display the cloud section if complete + committed', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[1], undefined);
  });

  it('does not show the model name when comitting', function() {
    const renderer = createDeploymentFlow({
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    assert.isUndefined(output.props.children[0]);
  });

  it('correctly sets the cloud title if no cloud is chosen', function() {
    const renderer = createDeploymentFlow();
    const output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[1].props.title, 'Choose cloud to deploy to');
  });

  it('can clear the cloud and credential when changing clouds', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud-1'},
      credential: 'cloud-1-cred'
    });
    const instance = renderer.getMountedInstance();
    instance._setCloud({name: 'cloud-2'});
    instance._setCredential('cloud-2-cred');
    const output = renderer.getRenderOutput();
    assert.isNotNull(instance.state.cloud);
    assert.isNotNull(instance.state.credential);
    output.props.children[1].props.buttons[0].action();
    assert.isNull(instance.state.cloud);
    assert.isNull(instance.state.credential);
  });

  it('can enable the credential section', function() {
    const renderer = createDeploymentFlow({
      isLegacyJuju: false,
      modelCommitted: false
    });
    const instance = renderer.getMountedInstance();
    instance.setState({cloud: {name: 'cloud'}});
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[2].props.disabled, false);
  });

  it('can hide the credential section', function() {
    const renderer = createDeploymentFlow({
      isLegacyJuju: false,
      modelCommitted: true
    });
    const instance = renderer.getMountedInstance();
    instance.setState({cloud: {name: 'cloud'}});
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[2], undefined);
  });

  it('can enable the machines section', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      isLegacyJuju: false,
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    assert.isFalse(output.props.children[4].props.disabled);
  });

  it('can enable the services section', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      isLegacyJuju: false,
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    assert.isFalse(output.props.children[5].props.disabled);
  });

  it('can enable the budget section', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      isLegacyJuju: false,
      modelCommitted: true,
      withPlans: true
    });
    const output = renderer.getRenderOutput();
    assert.isFalse(output.props.children[6].props.disabled);
  });

  it('can hide the agreements section', function() {
    const renderer = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub().callsArgWith(1, null, [])
    });
    const output = renderer.getRenderOutput();
    assert.isUndefined(
      output.props.children[8].props.children.props.children[0]);
  });

  it('can handle the agreements when there are no added apps', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      groupedChanges: {_addMachines: {machine: 'machine1'}},
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    assert.isUndefined(
      output.props.children[8].props.children.props.children[0]);
  });

  it('can display the agreements section', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().withArgs('terms').returns(['django-terms'])
    });
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      charmsGetById: charmsGetById,
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const agreements = output.props.children[8].props.children
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

  it('can disable the agreements section', function() {
    const renderer = createDeploymentFlow({
      modelCommitted: false
    });
    const output = renderer.getRenderOutput();
    const agreements = output.props.children[8].props.children
      .props.children[0];
    const className = agreements.props.className;
    const expectedClass = 'deployment-flow__deploy-option--disabled';
    assert.isTrue(className.indexOf(expectedClass) > 0);
    assert.isTrue(agreements.props.children[0].props.disabled);
  });

  it('renders the login when necessary', function() {
    const renderer = createDeploymentFlow({
      getAuth: sinon.stub().returns(null),
      getDischargeToken: sinon.stub(),
      loginToController: sinon.stub(),
      modelCommitted: true,
      sendPost: sinon.stub()
    });
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const loginLink = output.props.children.props.children.props.children[2]
      .props.children;
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-model-login"
        showCheck={true}
        title="You're almost ready to deploy!">
        <div className="twelve-col">
          <p className="deployment-login__intro">
            You will need to sign in with an Ubuntu One account to deploy your
            model with Juju-as-a-Service.
          </p>
          <div className="deployment-login__features">
            <div className="six-col">
              <div className="deployment-login__feature">
                <juju.components.SvgIcon name="task-done_16" size="16" />
                Deploy to all major clouds directly from your browser.
              </div>
              <div className="deployment-login__feature">
                <juju.components.SvgIcon name="task-done_16" size="16" />
                Identity management across all models.
              </div>
            </div>
            <div className="six-col last-col">
              <div className="deployment-login__feature">
                <juju.components.SvgIcon name="task-done_16" size="16" />
                Hosted and managed juju controllers.
              </div>
              <div className="deployment-login__feature">
                <juju.components.SvgIcon name="task-done_16" size="16" />
                Reusable shareable models with unlimited users.
              </div>
            </div>
          </div>
          <div className="deployment-login__login">
            <juju.components.USSOLoginLink
              gisf={instance.props.gisf}
              charmstore={instance.props.charmstore}
              callback={loginLink.props.callback}
              displayType={'button'}
              sendPost={instance.props.sendPost}
              storeUser={instance.props.storeUser}
              getDischargeToken={instance.props.getDischargeToken}
              loginToController={instance.props.loginToController}>
              Login
            </juju.components.USSOLoginLink>
          </div>
          <div className="deployment-login__signup">
            Don't have an account?
            <juju.components.USSOLoginLink
              gisf={instance.props.gisf}
              charmstore={instance.props.charmstore}
              callback={loginLink.props.callback}
              displayType={'text'}
              sendPost={instance.props.sendPost}
              storeUser={instance.props.storeUser}
              getDischargeToken={instance.props.getDischargeToken}
              loginToController={instance.props.loginToController}>
              Sign up
            </juju.components.USSOLoginLink>
          </div>
        </div>
      </juju.components.DeploymentSection>
    );
    assert.deepEqual(output.props.children, expected);
  });

  // Click log in and pass the given error string to the login callback used by
  // the component. Return the component instance.
  const login = function(err) {
    const renderer = createDeploymentFlow({
      getAuth: sinon.stub().returns(null),
      getDischargeToken: sinon.stub(),
      loginToController: sinon.stub(),
      modelCommitted: true,
      sendPost: sinon.stub()
    });
    const instance = renderer.getMountedInstance();
    assert.strictEqual(instance.state.loggedIn, false);
    instance.refs = {
      modelName: {
        getValue: sinon.stub().returns('Lamington')
      }
    };
    const output = renderer.getRenderOutput();
    const loginSection = output.props.children.props.children;
    const loginButton = loginSection.props.children[2].props.children;
    const loginToController = instance.props.loginToController;
    // Call the supplied callback function which is called after the user
    // logs in.
    loginButton.props.loginToController(loginButton.props.callback);
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
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      region: 'north'
    });
    const instance = renderer.getMountedInstance();
    instance.refs = {
      modelName: {
        getValue: sinon.stub().returns('Lamington')
      }
    };
    instance._updateModelName();
    const props = instance.props;
    const output = renderer.getRenderOutput();
    output.props.children[8].props.children.props.children[1].props.children
      .props.action();
    assert.equal(props.deploy.callCount, 1);
    assert.strictEqual(props.deploy.args[0].length, 4);
    assert.equal(props.deploy.args[0][2], 'Lamington');
    assert.deepEqual(props.deploy.args[0][3], {
      credential: 'cred',
      cloud: 'cloud',
      region: 'north'
    });
    assert.equal(props.changeState.callCount, 1);
    assert.equal(props.setModelName.callCount, 1);
    assert.equal(props.setModelName.args[0][0], 'Lamington');
  });

  it('can agree to terms during deploy', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      region: 'north'
    });
    const instance = renderer.getMountedInstance();
    instance.refs = {
      modelName: {
        getValue: sinon.stub().returns('Lamington')
      }
    };
    instance._updateModelName();
    instance._handleTermsAgreement({target: {checked: true}});
    const props = instance.props;
    const output = renderer.getRenderOutput();
    output.props.children[8].props.children.props.children[1].props.children
      .props.action();
    assert.equal(props.deploy.callCount, 0,
      'The deploy function should not be called');
    assert.equal(props.addAgreement.callCount, 1,
      'The addAgreement function was not called');
    assert.deepEqual(props.addAgreement.args[0][0], [{
      name: 'service1-terms',
      owner: 'spinach',
      revision: 5
    }, {
      name: 'my-terms',
      revision: 9
    }], 'The agreement passed in was not as expected.');
    assert.equal(props.setModelName.callCount, 1,
      'The setModelName function was not called.');
    assert.equal(props.setModelName.args[0][0], 'Lamington',
      'The setModelName function was not called with the right model name');
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
      const charmsGetById = sinon.stub();
      if (test.noTerms) {
        charmsGetById.withArgs('service1').returns({
          get: sinon.stub().returns([])
        });
      } else {
        charmsGetById.withArgs('service1').returns({
          get: sinon.stub().returns(['service1-terms'])
        });
      }
      const props = {
        acl: {isReadOnly: () => !!test.isReadOnly},
        applications: applications,
        charmsGetById: charmsGetById,
        modelCommitted: !!test.modelCommitted,
        isLegacyJuju: !!test.isLegacyJuju
      };
      if (!test.includeAgreements) {
        props.getAgreementsByTerms = sinon.stub();
      }
      const renderer = createDeploymentFlow(props);
      const instance = renderer.getMountedInstance();
      instance.setState(test.state);
      const allowed = instance._deploymentAllowed();
      assert.strictEqual(allowed, test.allowed, test.about);
    });
  });

  it('can disable the deploy button on deploy', function () {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      deploy: sinon.stub(),  // Don't trigger a re-render by calling callback.
      modelCommitted: true,
      region: 'north'
    });
    const instance = renderer.getMountedInstance();
    instance.refs = {
      modelName: {
        getValue: sinon.stub().returns('Lamington')
      }
    };
    let output = renderer.getRenderOutput();
    let deployButton = output.props.children[8].props.children.props
      .children[1].props.children;
    deployButton.props.action();

    // .action() rerenders the component so we need to get it again
    output = renderer.getRenderOutput();
    deployButton = output.props.children[8].props.children.props
      .children[1].props.children;

    assert.equal(deployButton.props.disabled, true);
    assert.equal(deployButton.props.title, 'Deploying...');
  });

  it('can deploy without updating the model name', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      region: 'north'
    });
    const instance = renderer.getMountedInstance();
    instance.refs = {};
    const output = renderer.getRenderOutput();
    output.props.children[8].props.children.props.children[1].props.children
      .props.action();
    const deploy = instance.props.deploy;
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'Pavlova');
    assert.deepEqual(deploy.args[0][3], {
      credential: 'cred',
      cloud: 'cloud',
      region: 'north'
    });
    assert.equal(instance.props.changeState.callCount, 1);
  });

  it('can deploy with SSH keys', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'azure'},
      credential: 'creds',
      modelCommitted: true,
      modelName: 'mymodel',
      region: 'skaro'
    });
    const instance = renderer.getMountedInstance();
    instance._setSSHKey('my SSH key');
    const output = renderer.getRenderOutput();
    output.props.children[8].props.children.props.children[1].props.children
      .props.action();
    const deploy = instance.props.deploy;
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'mymodel');
    assert.deepEqual(deploy.args[0][3], {
      credential: 'creds',
      cloud: 'azure',
      region: 'skaro',
      config: {'authorized-keys': 'my SSH key'}
    });
    assert.equal(instance.props.changeState.callCount, 1);
  });

  it('can deploy with Juju 1', function() {
    const renderer = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub(),
      isLegacyJuju: true,
      modelCommitted: true
    });
    const instance = renderer.getMountedInstance();
    instance.refs = {};
    const output = renderer.getRenderOutput();
    output.props.children[8].props.children.props.children[1].props.children
      .props.action();
    const deploy = instance.props.deploy;
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'Pavlova');
    assert.deepEqual(deploy.args[0][3], {
      credential: undefined,
      cloud: undefined,
      region: undefined
    });
    assert.equal(instance.props.changeState.callCount, 1);
  });

  it('focuses on the model name field when loaded', function() {
    const renderer = createDeploymentFlow();
    const instance = renderer.getMountedInstance();
    instance.refs = {modelName: {focus: sinon.stub()}};
    instance.componentDidMount();
    assert.equal(instance.refs.modelName.focus.callCount, 1);
  });

  it('aborts the requests when unmounting', function() {
    const abort = sinon.stub();
    const renderer = createDeploymentFlow({
      applications: applications,
      getAgreementsByTerms: sinon.stub().returns({abort: abort})
    });
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
