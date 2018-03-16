/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentFlow = require('./deployment-flow');
const AccordionSection = require('../accordion-section/accordion-section');
const DeploymentBudget = require('./budget/budget');
const DeploymentCloud = require('./cloud/cloud');
const DeploymentMachines = require('./machines/machines');
const DeploymentModelName = require('./model-name/model-name');
const DeploymentPanel = require('./panel/panel');
const DeploymentSection = require('./section/section');
const DeploymentServices = require('./services/services');
const DeploymentSSHKey = require('./sshkey/sshkey');
const GenericButton = require('../generic-button/generic-button');

describe('DeploymentFlow', function() {
  let applications;
  let acl;


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
      acl: acl,
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
    return enzyme.shallow(
      <DeploymentFlow {...props}>
        <span>content</span>
      </DeploymentFlow>);
  };

  beforeEach(() => {
    window.juju_config = {flags: {}};
    applications = [
      {get: sinon.stub().returns('service1')},
      {get: sinon.stub().returns('mysql')},
      {get: sinon.stub().returns('service1')}
    ];
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    const wrapper = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub().callsArgWith(1, null, []),
      isLoggedIn: sinon.stub().returns(true),
      modelCommitted: false,
      withPlans: true
    });
    const expected = (
      <div className="deployment-flow">
        <DeploymentPanel
          changeState={sinon.stub()}
          isDirectDeploy={false}
          loggedIn={true}
          sendAnalytics={wrapper.find('DeploymentPanel').prop('sendAnalytics')}
          title="Pavlova">
          <DeploymentSection
            completed={true}
            instance="deployment-model-name"
            showCheck={true}
            title="Set your model name">
            <DeploymentModelName
              acl={acl}
              ddEntity={null}
              modelName="Pavlova"
              setModelName={sinon.stub()} />
          </DeploymentSection>
          <DeploymentSection
            buttons={undefined}
            completed={false}
            disabled={false}
            instance="deployment-cloud"
            showCheck={true}
            title="Choose cloud to deploy to">
            <DeploymentCloud
              acl={acl}
              addNotification={sinon.stub()}
              cloud={null}
              controllerIsReady={sinon.stub()}
              getCloudProviderDetails={sinon.stub()}
              listClouds={sinon.stub()}
              setCloud={wrapper.find('DeploymentCloud').prop('setCloud')} />
          </DeploymentSection>
          <DeploymentSection
            completed={false}
            disabled={true}
            instance="deployment-ssh-key"
            showCheck={true}
            title={<span>Add public SSH keys <em>(optional)</em></span>}>
            <DeploymentSSHKey
              addNotification={sinon.stub()}
              cloud={null}
              getGithubSSHKeys={sinon.stub()}
              setLaunchpadUsernames={
                wrapper.find('DeploymentSSHKey').prop('setLaunchpadUsernames')}
              setSSHKeys={wrapper.find('DeploymentSSHKey').prop('setSSHKeys')}
              username={undefined}
              WebHandler={sinon.stub()} />
          </DeploymentSection>
          {undefined}
          <DeploymentSection
            completed={false}
            disabled={true}
            instance="deployment-machines"
            showCheck={false}
            title="Machines to be provisioned">
            <DeploymentMachines
              acl={acl}
              cloud={null}
              formatConstraints={sinon.stub()}
              generateMachineDetails={sinon.stub()}
              machines={{machine: 'machine1'}} />
          </DeploymentSection>
          <div className="deployment-services">
            <AccordionSection
              startOpen={false}
              title="Model changes">
              <DeploymentServices
                acl={acl}
                addNotification={sinon.stub()}
                changesFilterByParent={sinon.stub()}
                charmsGetById={sinon.stub()}
                generateAllChangeDescriptions={sinon.stub()}
                generateChangeDescription={sinon.stub()}
                getCurrentChangeSet={sinon.stub()}
                getServiceByName={sinon.stub()}
                listPlansForCharm={sinon.stub()}
                parseTermId={wrapper.find('DeploymentServices').prop('parseTermId')}
                showTerms={sinon.stub()}
                sortDescriptionsByApplication={sinon.stub()}
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
              acl={acl}
              addNotification={sinon.stub()}
              listBudgets={sinon.stub()}
              setBudget={wrapper.find('DeploymentBudget').prop('setBudget')}
              user="dalek" />
          </DeploymentSection>
          {null}
          <div className="twelve-col">
            <div className="inner-wrapper deployment-flow__deploy">
              {undefined}
              <div className="deployment-flow__deploy-action">
                <GenericButton
                  action={wrapper.find('GenericButton').prop('action')}
                  disabled={true}
                  type="positive">
                  Deploy
                </GenericButton>
              </div>
            </div>
          </div>
          {null}
        </DeploymentPanel>
      </div>);
    assert.compareJSX(wrapper, expected);
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
    const wrapper = createDeploymentFlow({
      addNotification: addNotification,
      changeState: changeState,
      ddData: {id: entityId},
      getEntity: getEntity,
      makeEntityModel: makeEntityModel,
      modelCommitted: false,
      renderMarkdown: renderMarkdown
    });
    assert.equal(wrapper.find('Spinner').length, 1);
    assert.equal(getEntity.args[0][0], entityId);
    // Call the getEntity callback and then re-render.
    getEntity.args[0][1](null, entityData);
    wrapper.update();
    const directDeploy = wrapper.find('DeploymentDirectDeploy');
    assert.equal(directDeploy.length, 1);
    assert.deepEqual(directDeploy.prop('ddData'), {id: 'cs:bundle/kubernetes-core-8'});
  });

  it('can display the cloud section as complete', function() {
    const wrapper = createDeploymentFlow({
      credential: 'cred',
      modelCommitted: false
    });
    const instance = wrapper.instance();
    instance.setState({cloud: {name: 'cloud'}});
    wrapper.update();
    const section = wrapper.find('DeploymentSection').at(1);
    assert.equal(section.prop('instance'), 'deployment-cloud');
    assert.equal(section.prop('completed'), true);
  });

  it('does not display the cloud section if complete + committed', function() {
    const wrapper = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true
    });
    assert.equal(wrapper.find('DeploymentCloud').length, 0);
  });

  it('does not show the model name when comitting', function() {
    const wrapper = createDeploymentFlow({
      modelCommitted: true
    });
    assert.equal(wrapper.find('DeploymentModelName').length, 0);
  });

  it('correctly sets the cloud title if no cloud is chosen', function() {
    const wrapper = createDeploymentFlow();
    const section = wrapper.find('DeploymentSection').at(1);
    assert.equal(section.prop('instance'), 'deployment-cloud');
    assert.equal(section.prop('title'), 'Choose cloud to deploy to');
  });

  it('can clear the cloud and credential when changing clouds', function() {
    const wrapper = createDeploymentFlow({
      cloud: {name: 'cloud-1'},
      credential: 'cloud-1-cred'
    });
    const instance = wrapper.instance();
    instance._setCloud({name: 'cloud-2'});
    instance._setCredential('cloud-2-cred');
    wrapper.update();
    assert.isNotNull(instance.state.cloud);
    assert.isNotNull(instance.state.credential);
    const section = wrapper.find('DeploymentSection').at(1);
    assert.equal(section.prop('instance'), 'deployment-cloud');
    section.prop('buttons')[0].action();
    assert.isNull(instance.state.cloud);
    assert.isNull(instance.state.credential);
    assert.equal(instance.props.sendAnalytics.callCount, 1);
    assert.deepEqual(instance.props.sendAnalytics.args[0], [
      'Deployment Flow', 'Component mounted',
      'is DD - is new model - doesn\'t have USSO']);
  });

  it('can enable the credential section', function() {
    const wrapper = createDeploymentFlow({
      modelCommitted: false
    });
    const instance = wrapper.instance();
    instance.setState({cloud: {name: 'cloud'}});
    wrapper.update();
    const section = wrapper.find('DeploymentSection').at(2);
    assert.equal(section.prop('instance'), 'deployment-credential');
    assert.equal(section.prop('disabled'), false);
    assert.equal(wrapper.find('DeploymentCredential').length, 1);
  });

  it('can hide the credential section', function() {
    const wrapper = createDeploymentFlow({
      modelCommitted: true
    });
    const instance = wrapper.instance();
    instance.setState({cloud: {name: 'cloud'}});
    wrapper.update();
    assert.equal(wrapper.find('DeploymentCredential').length, 0);
  });

  it('can enable the machines section', function() {
    const wrapper = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true
    });
    assert.equal(wrapper.find('DeploymentMachines').length, 1);
  });

  it('can enable the services section', function() {
    const wrapper = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true
    });
    assert.equal(wrapper.find('.deployment-services').length, 1);
  });

  it('can enable the budget section', function() {
    const wrapper = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      withPlans: true
    });
    const section = wrapper.find('DeploymentSection').at(1);
    assert.equal(section.prop('instance'), 'deployment-budget');
    assert.equal(section.prop('disabled'), false);
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
    const wrapper = createDeploymentFlow({
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
    assert.equal(wrapper.find('DeploymentPayment').length, 1);
  });

  it('can hide the agreements section', function() {
    const wrapper = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub().callsArgWith(1, null, [])
    });
    assert.equal(wrapper.find('.deployment-flow__deploy-option').length, 0);
  });

  it('can handle the agreements when there are no added apps', function() {
    const wrapper = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      groupedChanges: {_addMachines: {machine: 'machine1'}},
      modelCommitted: true
    });
    assert.equal(wrapper.find('.deployment-flow__deploy-option').length, 0);
  });

  it('can display the agreements section', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().withArgs('terms').returns(['django-terms'])
    });
    const wrapper = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      charmsGetById: charmsGetById,
      modelCommitted: true
    });
    const expected = (
      <div className="deployment-flow__deploy-option">
        <input className="deployment-flow__deploy-checkbox"
          disabled={false}
          id="terms"
          onChange={wrapper.find('.deployment-flow__deploy-checkbox').prop('onChange')}
          type="checkbox" />
        <label className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
        </label>
      </div>);
    assert.compareJSX(wrapper.find('.deployment-flow__deploy-option'), expected);
  });

  it('can disable the agreements section', function() {
    const wrapper = createDeploymentFlow({
      modelCommitted: false
    });
    const expectedClass = 'deployment-flow__deploy-option--disabled';
    assert.isTrue(
      wrapper.find('.deployment-flow__deploy-option').prop('className').includes(
        expectedClass));
    assert.isTrue(wrapper.find('.deployment-flow__deploy-checkbox').prop('disabled'));
  });

  it('renders the login when necessary', function() {
    const addNotification = sinon.stub();
    const loginToController = sinon.stub();
    const wrapper = createDeploymentFlow({
      addNotification: addNotification,
      gisf: true,
      isLoggedIn: sinon.stub().returns(false),
      loginToController: loginToController,
      modelCommitted: true
    });
    assert.equal(wrapper.find('DeploymentLogin').length, 1);
  });

  it('can deploy', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      region: 'north'
    });
    const instance = wrapper.instance();
    const props = instance.props;
    // Click to deploy.
    wrapper.find('GenericButton').props().action();
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
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      deploy,
      modelCommitted: true,
      region: 'north'
    });
    const instance = wrapper.instance();
    const props = instance.props;
    // Click to deploy.
    wrapper.find('GenericButton').props().action();
    assert.equal(deploy.callCount, 1);
    assert.equal(props.changeState.callCount, 0);
    wrapper.update();
    assert.equal(wrapper.find('GenericButton').prop('disabled'), false);
  });

  it('increases stats when deploying', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const statsIncrease = sinon.stub();
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      region: 'north',
      stats: {increase: statsIncrease}
    });
    // Click to deploy.
    wrapper.find('GenericButton').props().action();
    assert.equal(statsIncrease.callCount, 1, 'statsIncrease callCount');
    const args = statsIncrease.args[0];
    assert.equal(args.length, 1, 'statsIncrease args length');
    assert.strictEqual(args[0], 'deploy');
  });

  it('can agree to terms during deploy', function() {
    const wrapper = createDeploymentFlow({
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true,
      region: 'north'
    });
    const instance = wrapper.instance();
    instance._handleTermsAgreement({target: {checked: true}});
    const props = instance.props;
    wrapper.update();
    wrapper.find('GenericButton').props().action();
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
      const wrapper = createDeploymentFlow(props);
      const instance = wrapper.instance();
      instance.setState(test.state);
      const allowed = instance._deploymentAllowed();
      assert.strictEqual(allowed, test.allowed, test.about);
    });
  });

  it('can disable the deploy button on deploy', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      deploy: sinon.stub(), // Don't trigger a re-render by calling callback.
      modelCommitted: true,
      region: 'north'
    });
    wrapper.find('GenericButton').props().action();

    // .action() rerenders the component so we need to get it again
    wrapper.update();
    const deployButton = wrapper.find('GenericButton');

    assert.equal(deployButton.prop('disabled'), true);
    assert.equal(deployButton.children().text(), 'Committing...');
  });

  it('shows a commit button if the model is committed', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'cloud'},
      credential: 'cred',
      deploy: sinon.stub(), // Don't trigger a re-render by calling callback.
      modelCommitted: true,
      region: 'north'
    });
    assert.equal(wrapper.find('GenericButton').children().text(), 'Commit');
  });

  it('can deploy with SSH keys', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'azure'},
      credential: 'creds',
      modelCommitted: true,
      modelName: 'mymodel',
      region: 'skaro'
    });
    const instance = wrapper.instance();
    instance._setSSHKeys([{text: 'my SSH key'}]);
    wrapper.update();
    wrapper.find('GenericButton').props().action();
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
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'azure'},
      credential: 'creds',
      modelCommitted: true,
      modelName: 'mymodel',
      region: 'skaro'
    });
    const instance = wrapper.instance();
    instance._setLaunchpadUsernames(['rose']);
    wrapper.update();
    wrapper.find('GenericButton').props().action();
    const importKeys = instance.props.importSSHKeys;
    assert.equal(importKeys.callCount, 1);
    assert.deepEqual(importKeys.args[0][1], ['lp:rose']);
  });

  it('can deploy with a VPC id', function() {
    const charmsGetById = sinon.stub().withArgs('service1').returns({
      get: sinon.stub().withArgs('terms').returns([])
    });
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'aws'},
      credential: 'creds',
      modelCommitted: true,
      modelName: 'mymodel',
      region: 'skaro'
    });
    const instance = wrapper.instance();
    instance._setVPCId('my VPC id');
    wrapper.update();
    wrapper.find('GenericButton').props().action();
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
    const wrapper = createDeploymentFlow({
      charmsGetById: charmsGetById,
      cloud: {name: 'aws'},
      credential: 'creds',
      modelCommitted: true,
      modelName: 'mymodel',
      region: 'skaro'
    });
    const instance = wrapper.instance();
    instance._setVPCId('my VPC id', true);
    wrapper.update();
    wrapper.find('GenericButton').props().action();
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
    const wrapper = createDeploymentFlow({
      applications: applications,
      getAgreementsByTerms: sinon.stub().returns({abort: abort})
    });
    wrapper.unmount();
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
    const wrapper = createDeploymentFlow({
      getAgreementsByTerms: sinon.stub().callsArgWith(1, null, []),
      gtmEnabled: true
    });
    assert.equal(
      wrapper.find('.deployment-flow__deploy').prop('className').includes(
        'deployment-flow__deploy--cookie-visible'),
      true);
  });
});
