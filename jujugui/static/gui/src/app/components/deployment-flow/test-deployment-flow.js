/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');

const DeploymentFlow = require('./deployment-flow');
const AccordionSection = require('../accordion-section/accordion-section');
const DeploymentAgreements = require('./agreements/agreements');
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
  let acl, applications, controllerAPI, charmstore, modelAPI, models, payment,
      plans, stripe, terms;


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
    // Note that the defaults are *only* set for required DeploymentFlow props.
    const defaults = {
      WebHandler: sinon.stub(),
      acl: acl,
      addNotification: sinon.stub(),
      applications: [],
      changeState: sinon.stub(),
      changes: {
        one: {
          command: {
            method: '_deploy',
            args: [{charmURL: appId}]
          }
        },
        two: {
          command: {
            method: '_addMachines',
            args: [{machine: 'machine1'}]
          }
        }
      },
      charms: {},
      charmsGetById: charmsGetById,
      charmstore,
      controllerAPI,
      controllerIsReady: sinon.stub(),
      ddData: {},
      deploy: sinon.stub().callsArg(0),
      formatConstraints: sinon.stub(),
      generateAllChangeDescriptions: sinon.stub(),
      generateChangeDescription: sinon.stub(),
      generateMachineDetails: sinon.stub(),
      generatePath: sinon.stub(),
      getCurrentChangeSet: sinon.stub(),
      getSLAMachineRates: sinon.stub(),
      getServiceByName: sinon.stub(),
      getUserName: sinon.stub().returns('dalek'),
      hash: null,
      isLoggedIn: sinon.stub().returns(true),
      loginToController: sinon.stub(),
      modelAPI,
      modelName: 'Pavlova',
      payment,
      plans,
      profileUsername: 'Spinach',
      sendAnalytics: sinon.stub(),
      setModelName: sinon.stub(),
      showPay: false,
      sortDescriptionsByApplication: sinon.stub(),
      staticURL: '/static/url',
      stats: null,
      stripe,
      terms,
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
    // The makeEntityModel util uses the global models variable, so fake that here.
    models = window.models;
    window.models = {
      Bundle: sinon.stub(),
      Charm: sinon.stub()
    };
    applications = [
      {get: sinon.stub().returns('service1')},
      {get: sinon.stub().returns('mysql')},
      {get: sinon.stub().returns('service1')}
    ];
    acl = {isReadOnly: sinon.stub().returns(false)};
    charmstore = {
      getDiagramURL: sinon.stub(),
      getEntity: sinon.stub()
    };
    controllerAPI = {
      getCloudCredentialNames: sinon.stub(),
      getCloudCredentials: sinon.stub(),
      listClouds: sinon.stub(),
      updateCloudCredential: sinon.stub()
    };
    modelAPI = {
      addKeys: sinon.stub(),
      importKeys: sinon.stub()
    };
    payment = {
      createUser: sinon.stub(),
      getCountries: sinon.stub(),
      getUser: sinon.stub()
    };
    plans = {
      listBudgets: sinon.stub(),
      listPlansForCharm: sinon.stub()
    };
    stripe = {
      createCardElement: sinon.stub(),
      createToken: sinon.stub()
    };
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
    terms = {
      addAgreement: sinon.stub(),
      getAgreementsByTerms,
      showTerms: sinon.stub()
    };
  });

  afterEach(() => {
    window.models = models;
  });

  it('can render', function() {
    terms.getAgreementsByTerms.callsArgWith(1, null, []);
    const wrapper = createDeploymentFlow({
      isLoggedIn: sinon.stub().returns(true),
      modelCommitted: false,
      withPlans: true
    });
    const instance = wrapper.instance();
    instance.setState({ cloudCount: 2 });
    wrapper.update();
    const expected = (
      <div className="deployment-flow">
        <DeploymentPanel
          changeState={sinon.stub()}
          isDirectDeploy={false}
          loggedIn={true}
          sendAnalytics={wrapper.find('DeploymentPanel').prop('sendAnalytics')}
          title="Pavlova">
          <React.Fragment>
            <DeploymentSection
              completed={true}
              instance="deployment-model-name"
              showCheck={true}
              title="Set your model name">
              <DeploymentModelName
                acl={acl}
                ddEntity={null}
                focusName={true}
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
                listClouds={sinon.stub()}
                setCloud={wrapper.find('DeploymentCloud').prop('setCloud')}
                setCloudCount={wrapper.find('DeploymentCloud').prop('setCloudCount')} />
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
          </React.Fragment>
        </DeploymentPanel>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('updates terms and agreements when applications change', () => {
    const wrapper = createDeploymentFlow({
      isLoggedIn: sinon.stub().returns(true),
      modelCommitted: false
    });
    assert.equal(terms.getAgreementsByTerms.callCount, 1);
    applications.push({ get: sinon.stub().returns('service2') });
    wrapper.setProps({ applications });
    assert.equal(terms.getAgreementsByTerms.callCount, 2);
    assert.deepEqual(terms.getAgreementsByTerms.args[0][0], ['service1-terms']);
  });

  it('updates terms and agreements when deploy changes change', () => {
    const wrapper = createDeploymentFlow({
      isLoggedIn: sinon.stub().returns(true),
      modelCommitted: false
    });
    assert.equal(terms.getAgreementsByTerms.callCount, 1);
    wrapper.setProps({
      changes: {
        one: {
          command: {
            method: '_deploy',
            args: [{ charmURL: 'service1' }]
          }
        },
        two: {
          command: {
            method: '_deploy',
            args: [{ charmURL: 'mysql' }]
          }
        }
      }
    });
    assert.equal(terms.getAgreementsByTerms.callCount, 2);
    assert.deepEqual(terms.getAgreementsByTerms.args[0][0], ['service1-terms']);
  });

  it('shows a spinnner when loading the direct deploy entity', () => {
    const wrapper = createDeploymentFlow({
      ddData: { id: 'cs:bundle/kubernetes-core-8' },
      getEntity: sinon.stub()
    });
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('renders direct deploy when ddData is set', () => {
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const entityId = 'cs:bundle/kubernetes-core-8';
    const entityGet = sinon.stub();
    entityGet.withArgs('terms').returns([]);
    entityGet.withArgs('supported').returns(false);
    const entityModel = {
      id: entityId,
      get: entityGet,
      toEntity: sinon.stub().returns({
        displayName: 'Kubernetes Core'
      })
    };
    const entityData = [entityModel];
    window.models.Bundle.returns(entityModel);
    const wrapper = createDeploymentFlow({
      addNotification: addNotification,
      changeState: changeState,
      ddData: {id: entityId},
      modelCommitted: false
    });
    assert.equal(wrapper.find('Spinner').length, 1);
    assert.equal(charmstore.getEntity.args[0][0], entityId);
    // Call the getEntity callback and then re-render.
    charmstore.getEntity.args[0][1](null, entityData);
    wrapper.update();
    const directDeploy = wrapper.find('DeploymentDirectDeploy');
    assert.equal(directDeploy.length, 1);
    assert.deepEqual(directDeploy.prop('ddData'), {id: 'cs:bundle/kubernetes-core-8'});
  });

  it('can update the direct deploy state', () => {
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const entityId = 'cs:bundle/kubernetes-core-8';
    const entityId2 ='cs:new/entity';
    const entityGet = sinon.stub();
    entityGet.withArgs('terms').returns([]);
    entityGet.withArgs('supported').returns(false);
    const entityModel = {
      id: entityId,
      get: entityGet,
      toEntity: sinon.stub().returns({
        displayName: 'Kubernetes Core'
      })
    };
    const entityModel2 = {
      id: entityId2,
      get: entityGet,
      toEntity: sinon.stub().returns({
        displayName: 'New Bundle'
      })
    };
    charmstore.getEntity.withArgs(entityId).callsArgWith(1, null, [entityId]);
    charmstore.getEntity.withArgs(entityId2).callsArgWith(1, null, [entityId2]);
    window.models.Bundle.withArgs(entityId).returns(entityModel);
    window.models.Bundle.withArgs(entityId2).returns(entityModel2);
    const wrapper = createDeploymentFlow({
      addNotification: addNotification,
      changeState: changeState,
      ddData: { id: entityId },
      modelCommitted: false
    });
    const instance = wrapper.instance();
    assert.equal(instance.state.isDirectDeploy, true);
    assert.deepEqual(instance.state.ddEntity, entityModel);
    wrapper.setProps({
      ddData: {
        id: entityId2
      }
    });
    assert.equal(instance.state.isDirectDeploy, true);
    assert.deepEqual(instance.state.ddEntity, entityModel2);
  });

  it('can update the direct deploy state to not be direct deploy', () => {
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const entityId = 'cs:bundle/kubernetes-core-8';
    const entityGet = sinon.stub();
    entityGet.withArgs('terms').returns([]);
    entityGet.withArgs('supported').returns(false);
    const entityModel = {
      id: entityId,
      get: entityGet,
      toEntity: sinon.stub().returns({
        displayName: 'Kubernetes Core'
      })
    };
    charmstore.getEntity.withArgs(entityId).callsArgWith(1, null, [entityId]);
    window.models.Bundle.withArgs(entityId).returns(entityModel);
    const wrapper = createDeploymentFlow({
      addNotification: addNotification,
      changeState: changeState,
      ddData: { id: entityId },
      modelCommitted: false
    });
    const instance = wrapper.instance();
    assert.equal(instance.state.isDirectDeploy, true);
    assert.deepEqual(instance.state.ddEntity, entityModel);
    wrapper.setProps({ ddData: null });
    assert.equal(instance.state.isDirectDeploy, false);
    assert.strictEqual(instance.state.ddEntity, null);
  });

  it('can render the expert flow', () => {
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const entityId = 'cs:bundle/kubernetes-core-8';
    const entityGet = sinon.stub();
    entityGet.withArgs('terms').returns([]);
    entityGet.withArgs('supported').returns(true);
    entityGet.withArgs('price').returns(8);
    const entityModel = {
      id: entityId,
      get: entityGet,
      toEntity: sinon.stub().returns({
        displayName: 'Kubernetes Core'
      })
    };
    window.models.Bundle.returns(entityModel);
    const entityData = [entityModel];
    const wrapper = createDeploymentFlow({
      addNotification: addNotification,
      changeState: changeState,
      ddData: {id: entityId},
      modelCommitted: false,
      showPay: true
    });
    assert.equal(wrapper.find('Spinner').length, 1);
    assert.equal(charmstore.getEntity.args[0][0], entityId);
    // Call the getEntity callback and then re-render.
    charmstore.getEntity.args[0][1](null, entityData);
    wrapper.update();
    assert.equal(wrapper.find('DeploymentExpertIntro').length, 1);
    assert.equal(wrapper.find('DeploymentPricing').length, 1);
    assert.equal(wrapper.find('DeploymentExpertBudget').length, 1);
    assert.equal(wrapper.find('DeploymentPayment').length, 0);
    assert.equal(wrapper.find('DeploymentAgreements').length, 0);
    assert.equal(wrapper.find('.deployment-flow__deploy-action').length, 0);
    const instance = wrapper.instance();
    instance.setState({ budget: 125 });
    wrapper.update();
    assert.equal(wrapper.find('DeploymentPayment').length, 1);
    assert.equal(wrapper.find('DeploymentAgreements').length, 1);
    assert.equal(wrapper.find('.deployment-flow__deploy-action').length, 1);
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

  it('displays the change cloud button if there are multiple clouds', () => {
    const wrapper = createDeploymentFlow();
    const instance = wrapper.instance();
    instance.setState({
      cloud: { name: 'cloud' },
      cloudCount: 2
    });
    wrapper.update();
    const buttons = wrapper.find(
      'DeploymentSection[instance="deployment-cloud"]').prop('buttons');
    assert.deepEqual(buttons, [{
      action: buttons[0].action,
      disabled: false,
      title: 'Change cloud',
      type: 'neutral'
    }]);
  });

  it('does not display the change cloud button if there is only one cloud', () => {
    const wrapper = createDeploymentFlow();
    const instance = wrapper.instance();
    instance.setState({
      cloud: { name: 'cloud' },
      cloudCount: 1
    });
    wrapper.update();
    assert.strictEqual(
      wrapper.find('DeploymentSection[instance="deployment-cloud"]').prop('buttons'),
      undefined);
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
    instance._setCloudCount(6);
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
      showPay: true
    });
    assert.equal(wrapper.find('DeploymentPayment').length, 1);
  });

  it('can hide the agreements section', function() {
    terms.getAgreementsByTerms.callsArgWith(1, null, []);
    const wrapper = createDeploymentFlow();
    assert.equal(wrapper.find('DeploymentAgreements').length, 0);
  });

  it('can handle the agreements when there are no added apps', function() {
    const wrapper = createDeploymentFlow({
      changes: {
        two: {
          command: {
            method: '_addMachines',
            args: [{machine: 'machine1'}]
          }
        }
      },
      cloud: {name: 'cloud'},
      credential: 'cred',
      modelCommitted: true
    });
    assert.equal(wrapper.find('DeploymentAgreements').length, 0);
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
      <DeploymentAgreements
        acl={acl}
        disabled={false}
        onCheckboxChange={wrapper.find('DeploymentAgreements').prop('onCheckboxChange')}
        showTerms={false}
        terms={null} />);
    assert.compareJSX(wrapper.find('DeploymentAgreements'), expected);
  });

  it('can disable the agreements section', function() {
    const wrapper = createDeploymentFlow({
      modelCommitted: false
    });
    assert.strictEqual(wrapper.find('DeploymentAgreements').prop('disabled'), true);
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
    assert.strictEqual(props.deploy.args[0].length, 5);
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
    assert.equal(terms.addAgreement.callCount, 1,
      'The addAgreement function was not called');
    assert.deepEqual(terms.addAgreement.args[0][0], [{
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
    assert.strictEqual(deploy.args[0].length, 5);
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
    assert.equal(modelAPI.importKeys.callCount, 1);
    assert.deepEqual(modelAPI.importKeys.args[0][1], ['lp:rose']);
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
    assert.strictEqual(deploy.args[0].length, 5);
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
    assert.strictEqual(deploy.args[0].length, 5);
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
    terms.getAgreementsByTerms.returns({abort: abort});
    const wrapper = createDeploymentFlow({
      applications: applications
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
    terms.getAgreementsByTerms.callsArgWith(1, null, []);
    const wrapper = createDeploymentFlow({
      gtmEnabled: true
    });
    assert.equal(
      wrapper.find('.deployment-flow__deploy').prop('className').includes(
        'deployment-flow__deploy--cookie-visible'),
      true);
  });
});
