/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentFlow = require('./deployment-flow');
const AccordionSection = require('../accordion-section/accordion-section');
const DeploymentBudget = require('./budget/budget');
const DeploymentCloud = require('./cloud/cloud');
const DeploymentDirectDeploy = require('./direct-deploy/direct-deploy');
const DeploymentLogin = require('./login/login');
const DeploymentMachines = require('./machines/machines');
const DeploymentModelName = require('./model-name/model-name');
const DeploymentPanel = require('./panel/panel');
const DeploymentPayment = require('./payment/payment');
const DeploymentSection = require('./section/section');
const DeploymentServices = require('./services/services');
const DeploymentSSHKey = require('./sshkey/sshkey');
const Spinner = require('../spinner/spinner');
const GenericButton = require('../generic-button/generic-button');

const jsTestUtils = require('../../utils/component-test-utils');

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
    WebHandler: sinon.stub(),
    acl: {isReadOnly: sinon.stub().returns(false)},
    addAgreement: sinon.stub(),
    addNotification: sinon.stub(),
    addSSHKeys: sinon.stub(),
    importSSHKeys: sinon.stub(),
    applications: [],
    changeState: sinon.stub(),
    changes: {},
    changesFilterByParent: sinon.stub(),
    charmsGetById: charmsGetById,
    charmstore: {},
    controllerIsReady: sinon.stub(),
    createToken: sinon.stub(),
    createUser: sinon.stub(),
    ddData: {},
    deploy: sinon.stub().callsArg(0),
    formatConstraints: sinon.stub(),
    generateAllChangeDescriptions: sinon.stub(),
    generateChangeDescription: sinon.stub(),
    generateCloudCredentialName: sinon.stub(),
    generateMachineDetails: sinon.stub(),
    generatePath: sinon.stub(),
    getAgreementsByTerms: getAgreementsByTerms,
    getCloudCredentialNames: sinon.stub(),
    getCloudCredentials: sinon.stub(),
    getCloudProviderDetails: sinon.stub(),
    getCountries: sinon.stub(),
    getCurrentChangeSet: sinon.stub(),
    getDiagramURL: sinon.stub(),
    getServiceByName: sinon.stub(),
    getUser: sinon.stub(),
    getUserName: sinon.stub().returns('dalek'),
    getGithubSSHKeys: sinon.stub(),
    groupedChanges: groupedChanges,
    isLoggedIn: sinon.stub().returns(true),
    listBudgets: sinon.stub(),
    listClouds: sinon.stub(),
    listPlansForCharm: sinon.stub(),
    loginToController: sinon.stub(),
    makeEntityModel: sinon.stub(),
    modelName: 'Pavlova',
    profileUsername: 'Spinach',
    renderMarkdown: sinon.stub(),
    sendAnalytics: sinon.stub(),
    setModelName: sinon.stub(),
    showPay: false,
    showTerms: sinon.stub(),
    sortDescriptionsByApplication: sinon.stub(),
    stats: null,
    updateCloudCredential: sinon.stub(),
    validateForm: sinon.stub(),
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
    <DeploymentFlow {...props}>
      <span>content</span>
    </DeploymentFlow>, true);
};

describe('DeploymentFlow', function() {
  let applications;

  beforeEach(() => {
    window.juju_config = {flags: {}};
    applications = [
      {get: sinon.stub().returns('service1')},
      {get: sinon.stub().returns('mysql')},
      {get: sinon.stub().returns('service1')}
    ];
  });

  it('can render', function() {
    const addNotification = sinon.stub();
    const formatConstraints = sinon.stub();
    const generateMachineDetails = sinon.stub();
    const validateForm = sinon.stub();
    const renderer = createDeploymentFlow({
      addNotification: addNotification,
      formatConstraints: formatConstraints,
      generateMachineDetails: generateMachineDetails,
      getAgreementsByTerms: sinon.stub().callsArgWith(1, null, []),
      isLoggedIn: sinon.stub().returns(true),
      modelCommitted: false,
      validateForm: validateForm,
      withPlans: true
    });
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const props = instance.props;
    const expected = (
      <DeploymentPanel
        changeState={props.changeState}
        isDirectDeploy={false}
        loggedIn={true}
        sendAnalytics={sinon.stub()}
        title="Pavlova">
        <DeploymentSection
          completed={true}
          instance="deployment-model-name"
          showCheck={true}
          title="Set your model name">
          <DeploymentModelName
            acl={props.acl}
            ddEntity={null}
            modelName="Pavlova"
            setModelName={props.setModelName} />
        </DeploymentSection>
        <DeploymentSection
          buttons={undefined}
          completed={false}
          disabled={false}
          instance="deployment-cloud"
          showCheck={true}
          title="Choose cloud to deploy to">
          <DeploymentCloud
            acl={props.acl}
            addNotification={props.addNotification}
            cloud={null}
            controllerIsReady={props.controllerIsReady}
            getCloudProviderDetails={props.getCloudProviderDetails}
            listClouds={props.listClouds}
            setCloud={instance._setCloud} />
        </DeploymentSection>
        <DeploymentSection
          completed={false}
          disabled={true}
          instance="deployment-ssh-key"
          showCheck={true}
          title={<span>Add public SSH keys <em>(optional)</em></span>}>
          <DeploymentSSHKey
            addNotification={props.addNotification}
            cloud={null}
            getGithubSSHKeys={props.getGithubSSHKeys}
            setLaunchpadUsernames={instance._setLaunchpadUsernames}
            setSSHKeys={instance._setSSHKeys}
            username={undefined}
            WebHandler={props.WebHandler} />
        </DeploymentSection>
        {undefined}
        <DeploymentSection
          completed={false}
          disabled={true}
          instance="deployment-machines"
          showCheck={false}
          title="Machines to be provisioned">
          <DeploymentMachines
            acl={props.acl}
            cloud={null}
            formatConstraints={formatConstraints}
            generateMachineDetails={generateMachineDetails}
            machines={props.groupedChanges._addMachines} />
        </DeploymentSection>
        <div className="deployment-services">
          <AccordionSection title="Model changes">
            <DeploymentServices
              acl={props.acl}
              addNotification={props.addNotification}
              changesFilterByParent={props.changesFilterByParent}
              charmsGetById={props.charmsGetById}
              generateAllChangeDescriptions={props.generateAllChangeDescriptions}
              generateChangeDescription={props.generateChangeDescription}
              getCurrentChangeSet={props.getCurrentChangeSet}
              getServiceByName={props.getServiceByName}
              listPlansForCharm={props.listPlansForCharm}
              parseTermId={instance._parseTermId}
              showTerms={props.showTerms}
              sortDescriptionsByApplication={props.sortDescriptionsByApplication}
              withPlans={true} />
          </AccordionSection>
        </div>
        <DeploymentSection
          completed={false}
          disabled={true}
          instance="deployment-budget"
          showCheck={true}
          title="Confirm budget">
          <DeploymentBudget
            acl={props.acl}
            addNotification={props.addNotification}
            listBudgets={props.listBudgets}
            setBudget={instance._setBudget}
            user="dalek" />
        </DeploymentSection>
        {null}
        <div className="twelve-col">
          <div className="inner-wrapper deployment-flow__deploy">
            {undefined}
            <div className="deployment-flow__deploy-action">
              <GenericButton
                action={instance._handleDeploy}
                disabled={true}
                type="positive">
                Deploy
              </GenericButton>
            </div>
          </div>
        </div>
        {null}
      </DeploymentPanel>);
    expect(output).toEqualJSX(expected);
  });

  it('renders direct deploy when ddData is set', () => {
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const entityId = 'cs:bundle/kubernetes-core-8';
    const entityModel = {
      id: entityId,
      get: sinon.stub().returns([]),
      toEntity: sinon.stub().returns({
        displayName: 'Kubernetes Core'
      })
    };
    const entityData = [entityModel];
    const getEntity = sinon.stub();
    const makeEntityModel = sinon.stub().returns(entityModel);
    const renderMarkdown = sinon.stub();
    const renderer = createDeploymentFlow({
      addNotification: addNotification,
      changeState: changeState,
      ddData: {id: entityId},
      getEntity: getEntity,
      makeEntityModel: makeEntityModel,
      modelCommitted: false,
      renderMarkdown: renderMarkdown
    });
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    expect(output.props.children[0]).toEqualJSX(<Spinner />);
    assert.equal(getEntity.args[0][0], entityId);
    // Call the getEntity callback and then re-render.
    getEntity.args[0][1](null, entityData);
    instance.render();
    const output2 = renderer.getRenderOutput();
    expect(output2.props.children[0]).toEqualJSX(
      <DeploymentDirectDeploy
        addNotification={addNotification}
        changeState={changeState}
        ddData={{id: 'cs:bundle/kubernetes-core-8'}}
        entityModel={entityModel}
        generatePath={sinon.stub()}
        getDiagramURL={instance.props.getDiagramURL}
        renderMarkdown={renderMarkdown} />
    );
  });

  it('can display the cloud section as complete', function() {
    const renderer = createDeploymentFlow({
      credential: 'cred',
      modelCommitted: false
    });
    const instance = renderer.getMountedInstance();
    instance.setState({cloud: {name: 'cloud'}});
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[2].props.completed, true);
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
    assert.isUndefined(output.props.children[1]);
  });

  it('correctly sets the cloud title if no cloud is chosen', function() {
    const renderer = createDeploymentFlow();
    const output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[2].props.title, 'Choose cloud to deploy to');
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
    output.props.children[2].props.buttons[0].action();
    assert.isNull(instance.state.cloud);
    assert.isNull(instance.state.credential);
    assert.equal(instance.props.sendAnalytics.callCount, 1);
    assert.deepEqual(instance.props.sendAnalytics.args[0], [
      'Deployment Flow', 'Component mounted',
      'is DD - is new model - doesn\'t have USSO']);
  });

  it('can enable the credential section', function() {
    const renderer = createDeploymentFlow({
      modelCommitted: false
    });
    const instance = renderer.getMountedInstance();
    instance.setState({cloud: {name: 'cloud'}});
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[3].props.disabled, false);
  });

  it('can hide the credential section', function() {
    const renderer = createDeploymentFlow({
      modelCommitted: true
    });
    const instance = renderer.getMountedInstance();
    instance.setState({cloud: {name: 'cloud'}});
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[3], undefined);
  });

  it('can enable the machines section', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[5].props.disabled, false);
  });

  it('can enable the services section', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    assert.notStrictEqual(output.props.children[6], undefined);
  });

  it('can enable the budget section', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      withPlans: true
    });
    const output = renderer.getRenderOutput();
    assert.isFalse(output.props.children[7].props.disabled);
  });

  it('can show the payments section', function() {
    const acl = {isReadOnly: sinon.stub()};
    const addNotification = sinon.stub();
    const createToken = sinon.stub();
    const createUser = sinon.stub();
    const getCountries = sinon.stub();
    const getUser = sinon.stub();
    const validateForm = sinon.stub();
    const createCardElement = sinon.stub();
    const renderer = createDeploymentFlow({
      acl: acl,
      addNotification: addNotification,
      cloud: {name: 'cloud'},
      createCardElement: createCardElement,
      createToken: createToken,
      createUser: createUser,
      credential: 'cred',
      getCountries: getCountries,
      getUser: getUser,
      isLegacyJuju: false,
      profileUsername: 'spinach',
      showPay: true,
      validateForm: validateForm
    });
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <DeploymentSection
        completed={false}
        disabled={false}
        instance="deployment-payment"
        showCheck={true}
        title="Payment details">
        <DeploymentPayment
          acl={acl}
          addNotification={addNotification}
          createCardElement={createCardElement}
          createToken={createToken}
          createUser={createUser}
          getCountries={getCountries}
          getUser={getUser}
          paymentUser={null}
          setPaymentUser={instance._setPaymentUser}
          username="spinach"
          validateForm={validateForm} />
      </DeploymentSection>);
    expect(output.props.children[8]).toEqualJSX(expected);
  });

  it('can hide the agreements section', function() {
    const renderer = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub().callsArgWith(1, null, [])
    });
    const output = renderer.getRenderOutput();
    assert.isUndefined(
      output.props.children[9].props.children.props.children[0]);
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
      output.props.children[9].props.children.props.children[0]);
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
    const agreements = output.props.children[9].props.children
      .props.children[0];
    const expected = (
      <div className="deployment-flow__deploy-option">
        <input className="deployment-flow__deploy-checkbox"
          disabled={false}
          id="terms"
          onChange={instance._handleTermsAgreement}
          type="checkbox" />
        <label className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
        </label>
      </div>);
    expect(agreements).toEqualJSX(expected);
  });

  it('can disable the agreements section', function() {
    const renderer = createDeploymentFlow({
      modelCommitted: false
    });
    const output = renderer.getRenderOutput();
    const agreements = output.props.children[9].props.children
      .props.children[0];
    const className = agreements.props.className;
    const expectedClass = 'deployment-flow__deploy-option--disabled';
    assert.isTrue(className.indexOf(expectedClass) > 0);
    assert.isTrue(agreements.props.children[0].props.disabled);
  });

  it('renders the login when necessary', function() {
    const addNotification = sinon.stub();
    const loginToController = sinon.stub();
    const renderer = createDeploymentFlow({
      addNotification: addNotification,
      gisf: true,
      isLoggedIn: sinon.stub().returns(false),
      loginToController: loginToController,
      modelCommitted: true
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <DeploymentLogin
        addNotification={addNotification}
        callback={output.props.children[10].props.callback}
        gisf={true}
        isDirectDeploy={false}
        loginToController={loginToController}
        showLoginLinks={true} />);
    expect(output.props.children[10]).toEqualJSX(expected);
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
    const props = instance.props;
    const output = renderer.getRenderOutput();
    // Click to deploy.
    const deploy = output.props.children[9].props.children.props.children[1];
    deploy.props.children.props.action();
    assert.equal(props.deploy.callCount, 1);
    assert.strictEqual(props.deploy.args[0].length, 4);
    assert.equal(props.deploy.args[0][2], 'Pavlova');
    assert.deepEqual(props.deploy.args[0][3], {
      config: {},
      cloud: 'cloud',
      credential: 'cred',
      region: 'north'
    });
    assert.equal(props.changeState.callCount, 1);
    assert.equal(props.sendAnalytics.callCount, 2);
    assert.deepEqual(props.sendAnalytics.args[0], [
      'Deployment Flow', 'Component mounted',
      'is DD - is model update - doesn\'t have USSO']);
    assert.deepEqual(props.sendAnalytics.args[1], [
      'Deployment Flow', 'Button click',
      'Deploy model - is DD - is model update - doesn\'t have USSO']);
  });

  it('Enables the deploy button if deploying fails', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const deploy = sinon.stub().callsArgWith(0, 'Uh oh!');
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      deploy,
      modelCommitted: true,
      region: 'north'
    });
    const instance = renderer.getMountedInstance();
    const props = instance.props;
    let output = renderer.getRenderOutput();
    // Click to deploy.
    let deployButton = output.props.children[9].props.children.props.children[1]
      .props.children;
    deployButton.props.action();
    assert.equal(deploy.callCount, 1);
    assert.equal(props.changeState.callCount, 0);
    output = renderer.getRenderOutput();
    deployButton = output.props.children[9].props.children.props.children[1]
      .props.children;
    assert.equal(deployButton.props.disabled, false);
  });

  it('increases stats when deploying', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const statsIncrease = sinon.stub();
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      region: 'north',
      stats: {increase: statsIncrease}
    });
    const output = renderer.getRenderOutput();
    // Click to deploy.
    const deploy = output.props.children[9].props.children.props.children[1];
    deploy.props.children.props.action();
    assert.equal(statsIncrease.callCount, 1, 'statsIncrease callCount');
    const args = statsIncrease.args[0];
    assert.equal(args.length, 1, 'statsIncrease args length');
    assert.strictEqual(args[0], 'deploy');
  });

  it('can agree to terms during deploy', function() {
    const renderer = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      region: 'north'
    });
    const instance = renderer.getMountedInstance();
    instance._handleTermsAgreement({target: {checked: true}});
    const props = instance.props;
    const output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
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
  });

  it('allows or disallows deployments', function() {
    const tests = [{
      about: 'no model name',
      state: {modelName: ''},
      allowed: false
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
        sshKeys: ['mykey']
      },
      noTerms: true,
      allowed: true
    }, {
      about: 'ssh provided on aws',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: 'cred',
        sshKeys: ['mykey']
      },
      noTerms: true,
      allowed: true
    }, {
      about: 'no payment user',
      state: {
        modelName: 'mymodel',
        cloud: {cloudType: 'aws'},
        credential: 'cred',
        paymentUser: null,
        sshKeys: ['mykey']
      },
      noTerms: true,
      showPay: true,
      allowed: false
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
        showPay: test.showPay || false
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

  it('can disable the deploy button on deploy', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      deploy: sinon.stub(), // Don't trigger a re-render by calling callback.
      modelCommitted: true,
      region: 'north'
    });
    let output = renderer.getRenderOutput();
    let deployButton = output.props.children[9].props.children.props
      .children[1].props.children;
    deployButton.props.action();

    // .action() rerenders the component so we need to get it again
    output = renderer.getRenderOutput();
    deployButton = output.props.children[9].props.children.props
      .children[1].props.children;

    assert.equal(deployButton.props.disabled, true);
    assert.equal(deployButton.props.children, 'Committing...');
  });

  it('shows a commit button if the model is committed', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      deploy: sinon.stub(), // Don't trigger a re-render by calling callback.
      modelCommitted: true,
      region: 'north'
    });
    let output = renderer.getRenderOutput();
    const deployButton = output.props.children[9].props.children.props
      .children[1].props.children;
    const expected = (
      <GenericButton
        action={sinon.stub()}
        disabled={false}
        type="positive">
        Commit
      </GenericButton>);
    expect(deployButton).toEqualJSX(expected);
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
    instance._setSSHKeys([{text: 'my SSH key'}]);
    const output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
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

  it('can deploy with a Launchpad username', () => {
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
    instance._setLaunchpadUsernames(['rose']);
    const output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
      .props.action();
    const importKeys = instance.props.importSSHKeys;
    assert.equal(importKeys.callCount, 1);
    assert.deepEqual(importKeys.args[0][1], ['lp:rose']);
  });

  it('can deploy with a VPC id', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'aws'},
      credential: 'creds',
      modelCommitted: true,
      modelName: 'mymodel',
      region: 'skaro'
    });
    const instance = renderer.getMountedInstance();
    instance._setVPCId('my VPC id');
    const output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
      .props.action();
    const deploy = instance.props.deploy;
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'mymodel');
    assert.deepEqual(deploy.args[0][3], {
      credential: 'creds',
      cloud: 'aws',
      region: 'skaro',
      config: {'vpc-id': 'my VPC id', 'vpc-id-force': false}
    });
    assert.equal(instance.props.changeState.callCount, 1);
  });

  it('can deploy with a forced VPC id', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const renderer = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'aws'},
      credential: 'creds',
      modelCommitted: true,
      modelName: 'mymodel',
      region: 'skaro'
    });
    const instance = renderer.getMountedInstance();
    instance._setVPCId('my VPC id', true);
    const output = renderer.getRenderOutput();
    output.props.children[9].props.children.props.children[1].props.children
      .props.action();
    const deploy = instance.props.deploy;
    assert.equal(deploy.callCount, 1);
    assert.strictEqual(deploy.args[0].length, 4);
    assert.equal(deploy.args[0][2], 'mymodel');
    assert.deepEqual(deploy.args[0][3], {
      credential: 'creds',
      cloud: 'aws',
      region: 'skaro',
      config: {'vpc-id': 'my VPC id', 'vpc-id-force': true}
    });
    assert.equal(instance.props.changeState.callCount, 1);
  });

  it('aborts the requests when unmounting', function() {
    const abort = sinon.stub();
    const renderer = createDeploymentFlow({
      applications: applications,
      getAgreementsByTerms: sinon.stub().returns({abort: abort})
    });
    renderer.unmount();
    assert.equal(abort.callCount, 1);
  });

  describe('_parseTermId', function() {
    let parseTermId;

    beforeAll(function() {
      parseTermId = DeploymentFlow.prototype._parseTermId;
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

  it('can add a class when the cookie notice is visible', () => {
    const renderer = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub().callsArgWith(1, null, []),
      gtmEnabled: true
    });
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="twelve-col">
        <div className={'inner-wrapper deployment-flow__deploy ' +
          'deployment-flow__deploy--cookie-visible'}>
          {undefined}
          <div className="deployment-flow__deploy-action">
            <GenericButton
              action={instance._handleDeploy}
              disabled={true}
              type="positive">
              Deploy
            </GenericButton>
          </div>
        </div>
      </div>);
    expect(output.props.children[9]).toEqualJSX(expected);
  });
});
