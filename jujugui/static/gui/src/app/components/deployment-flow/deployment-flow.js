/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const AccordionSection = require('../accordion-section/accordion-section');
const cookieUtil = require('../../init/cookie-util');
const DeploymentBudget = require('./budget/budget');
const DeploymentCloud = require('./cloud/cloud');
const DeploymentCredential = require('./credential/credential');
const DeploymentDirectDeploy = require('./direct-deploy/direct-deploy');
const DeploymentLogin = require('./login/login');
const DeploymentMachines = require('./machines/machines');
const DeploymentModelName = require('./model-name/model-name');
const DeploymentPanel = require('./panel/panel');
const DeploymentPayment = require('./payment/payment');
const DeploymentSection = require('./section/section');
const DeploymentServices = require('./services/services');
const DeploymentSSHKey = require('./sshkey/sshkey');
const DeploymentVPC = require('./vpc/vpc');
const Spinner = require('../spinner/spinner');
const GenericButton = require('../generic-button/generic-button');

// Define the VPC ID zero value.
const INITIAL_VPC_ID = null;

class DeploymentFlow extends React.Component {
  constructor(props) {
    super(props);
    this.xhrs = [];
    // Set up the cloud, credential and region from props, as if they exist at
    // mount they can't be changed.
    const modelCommitted = this.props.modelCommitted;
    this.state = {
      cloud: modelCommitted ? this.props.cloud : null,
      credential: this.props.credential,
      deploying: false,
      ddEntity: null,
      loadingEntity: false,
      loadingTerms: false,
      isDirectDeploy: !!(this.props.ddData && this.props.ddData.id),
      newTerms: [],
      paymentUser: null,
      region: this.props.region,
      sshKeys: [],
      lpUsernames: [],
      // The list of term ids for the uncommitted applications.
      terms: this._getTerms() || [],
      // Whether the user has ticked the checked to agree to terms.
      termsAgreed: false,
      vpcId: INITIAL_VPC_ID,
      vpcIdForce: false
    };
  }

  componentWillMount() {
    if (this.props.isLoggedIn()) {
      this._getAgreements();
    }
    this.sendAnalytics('Component mounted');
    if (this.state.isDirectDeploy) {
      this._getDirectDeployEntity(this.props.ddData.id);
    }
  }

  componentWillReceiveProps(nextProps) {
    const newApps = nextProps.applications;
    const currentApps = this.props.applications;
    // Filter the list of new apps to find that don't exist in the current
    // list of apps.
    const appDiff = newApps.filter(a => currentApps.indexOf(a) === -1);
    if (newApps.length !== currentApps.length || appDiff.length > 0) {
      this._getAgreements();
    }
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Fetches the supplied entity in a directDeploy deployment flow.
    @param {String} entityId The entity id to fetch.
  */
  _getDirectDeployEntity(entityId) {
    const props = this.props;
    this.setState({loadingEntity: true});
    props.getEntity(entityId, (error, data) => {
      this.setState({loadingEntity: false});
      if (error) {
        console.error('unable to fetch entity: ' + error);
        props.addNotification({
          title: 'Unable to fetch entity',
          message: `Unable to fetch entity: ${error}`,
          level: 'error'
        });
        return;
      }
      this.setState({ddEntity: this.props.makeEntityModel(data[0])});
    });
  }

  /**
    Use the props and state to figure out if a section should be visible,
    disabled or completed.

    @method _getSectionStatus
    @param {String} section The name of the section you want data for.
    @returns {Object} The object with completed, disabled and visible params.
  */
  _getSectionStatus(section) {
    let completed;
    let disabled;
    let visible;
    const hasCloud = !!this.state.cloud;
    const hasSSHkey = !!this.state.sshKeys.length;
    const hasCredential = !!this.state.credential;
    const willCreateModel = !this.props.modelCommitted;
    const groupedChanges = this.props.groupedChanges;
    const loggedIn = this.props.isLoggedIn();
    switch (section) {
      case 'model-name':
        completed = !!this.props.modelName;
        disabled = false;
        visible = loggedIn && willCreateModel;
        break;
      case 'cloud':
        completed = hasCloud && hasCredential;
        disabled = !loggedIn;
        visible = loggedIn && (willCreateModel || !completed);
        break;
      case 'credential':
        completed = false;
        disabled = !hasCloud;
        visible = loggedIn && willCreateModel && hasCloud;
        break;
      case 'ssh-key':
        completed = hasSSHkey;
        disabled = !hasCloud;
        visible = loggedIn && willCreateModel;
        break;
      case 'vpc':
        completed = false;
        disabled = !hasCloud;
        visible = (
          loggedIn &&
          willCreateModel &&
          hasCloud &&
          hasCredential &&
          this.state.cloud.name === 'aws');
        break;
      case 'machines':
        const addMachines = groupedChanges._addMachines;
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = loggedIn && addMachines &&
          Object.keys(addMachines).length > 0;
        break;
      case 'services':
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = loggedIn;
        break;
      case 'budget':
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = loggedIn && this.props.withPlans;
        break;
      case 'payment':
        completed = !!this.state.paymentUser;
        disabled = false;
        visible = loggedIn && this.props.showPay;
        break;
      case 'agreements':
        const newTerms = this.state.newTerms;
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = loggedIn && newTerms && newTerms.length > 0;
        break;
      case 'deploy':
        completed = false;
        disabled = false;
        visible = loggedIn;
        break;
    }
    return {
      completed: completed,
      disabled: disabled,
      visible: visible
    };
  }

  /**
    Store the selected cloud in state.

    @method _setCloud
    @param {String} cloud The selected cloud.
  */
  _setCloud(cloud) {
    this.setState({cloud: cloud, vpcId: INITIAL_VPC_ID});
  }

  /**
    Store the selected credential in state.

    @method _setCredential
    @param {String} credential The selected credential.
  */
  _setCredential(credential) {
    this.setState({credential: credential});
  }

  /**
    Store the selected region in state.

    @method _setRegion
    @param {String} region The selected region.
  */
  _setRegion(region) {
    this.setState({region: region});
  }

  /**
    Store the provided SSH key in state.

    @method _setSSHKeys
    @param {Array} keys The list of SSH keys.
  */
  _setSSHKeys(keys) {
    this.setState({sshKeys: keys});
  }

  /**
    Store the provided Launchpad usernames in state.

    @method _setLaunchpadUsernames
    @param {Array} usernames The list of Launchpad usernames
  */
  _setLaunchpadUsernames(usernames) {
    this.setState({lpUsernames: usernames});
  }

  /**
    Store the provided AWS virtual private cloud value in state.
    In the case the value is set, also set whether to force Juju to use the
    given value, even when it fails the minimum validation criteria.

    @method _setVPCId
    @param {String} value The VPC identifier.
    @param {Boolean} force Whether to force the value. Ignored if !value.
  */
  _setVPCId(value, force) {
    if (!value) {
      value = INITIAL_VPC_ID;
      force = false;
    }
    this.setState({vpcId: value, vpcIdForce: !!force});
  }

  /**
    Store the selected budget in state.

    @method _setBudget
    @param {String} budget The selected budget.
  */
  _setBudget(budget) {
    this.setState({budget: budget});
  }

  /**
    Store the payment user in state.

    @method _setPaymentUser
    @param {String} user The user deetails.
  */
  _setPaymentUser(user) {
    this.setState({paymentUser: user});
  }

  /**
    The function to be called after deploy.
    @param {String} err An error if deployment failed, null otherwise.
  */
  _deployCallback(err) {
    if (err) {
      this.setState({deploying: false});
      return;
    }
    this.props.changeState({
      gui: {
        deploy: null
      }
    });
  }

  /**
    Handle clearing the chosen cloud.

    @method _clearCloud
  */
  _clearCloud() {
    this._setCloud(null);
    // Also reset the chose credential.
    this._setCredential(null);
  }

  /**
    Handle deploying the model.

    @method _handleDeploy
  */
  _handleDeploy() {
    if (!this._deploymentAllowed()) {
      // This should never happen, as in these cases the deployment button is
      // disabled.
      console.error('deploy button clicked but it should have been disabled');
      return;
    }
    this.setState({deploying: true});
    this.sendAnalytics(
      'Button click',
      'Deploy model'
    );
    if (this.props.stats) {
      this.props.stats.increase('deploy');
    }

    const args = {
      config: {},
      cloud: this.state.cloud && this.state.cloud.name || undefined,
      credential: this.state.credential,
      region: this.state.region
    };
    if (this.state.sshKeys.length) {
      const sshKeys = this.state.sshKeys.slice();
      // Attempt to provide at least one key in case the addSSHKeys call fails.
      args.config['authorized-keys'] = sshKeys.shift().text;
      // Then add the remaining ones to the change set.
      const ecsOptions = {};
      this.props.addSSHKeys(
        this.props.getUserName(),
        sshKeys.map(key => key.text),
        (error, data) => {
          if (!error) {
            return;
          }
          this.props.addNotification({
            title: 'Cannot add SSH keys',
            message: `Cannot add SSH keys: ${error}`,
            level: 'error'
          });
        },
        ecsOptions);
    }
    if (this.state.lpUsernames.length) {
      this.props.importSSHKeys(
        this.props.getUserName(),
        this.state.lpUsernames.map(key => `lp:${key}`),
        (error, data) => {
          if (!error) {
            return;
          }
          this.props.addNotification({
            title: 'Cannot import SSH keys',
            message: `Cannot import SSH keys: ${error}`,
            level: 'error'
          });
        }
      );
    }
    if (this.state.vpcId) {
      args.config['vpc-id'] = this.state.vpcId;
      args.config['vpc-id-force'] = this.state.vpcIdForce;
    }
    const deploy = this.props.deploy.bind(
      this, this._deployCallback.bind(this), true, this.props.modelName, args);
    if (this.state.newTerms.length > 0) {
      const terms = this.state.newTerms.map(term => {
        const args = {
          name: term.name,
          revision: term.revision
        };
        if (term.owner) {
          args.owner = term.owner;
        }
        return args;
      });
      this.props.addAgreement(terms, (error, response) => {
        if (error) {
          this.props.addNotification({
            title: 'Could not agree to terms',
            message: `Could not agree to terms: ${error}`,
            level: 'error'
          });
          return;
        }
        deploy();
      });
    } else {
      deploy();
    }
  }

  /**
    Get the list of terms for the uncommitted apps.

    @method _getTerms
    @returns {Array} The list of terms.
  */
  _getTerms() {
    const appIds = [];
    // Get the list of undeployed apps. _deploy is the key for added apps.
    const deployCommands = this.props.groupedChanges['_deploy'];
    if (!deployCommands) {
      return;
    }
    // Find the undeployed app IDs.
    Object.keys(deployCommands).forEach(key => {
      appIds.push(deployCommands[key].command.args[0].charmURL);
    }) || [];
    // Get the terms for each undeployed app.
    const termIds = [];
    appIds.forEach(appId => {
      // Get the terms from the app's charm.
      const terms = this.props.charmsGetById(appId).get('terms');
      if (terms && terms.length > 0) {
        // If there are terms then add them if they haven't already been
        // recorded.
        terms.forEach(id => {
          if (termIds.indexOf(id) === -1) {
            termIds.push(id);
          }
        });
      }
    });
    return termIds;
  }

  /**
    Get the list of terms that the user has already agreed to.

    @method _getAgreements
  */
  _getAgreements() {
    // Get the list of terms for the uncommitted apps.
    const terms = this.state.terms;
    // If there are no charms with terms then we don't need to display
    // anything.
    if (terms.length === 0) {
      this.setState({newTerms: [], loadingTerms: false});
      return;
    }
    this.setState({loadingTerms: true}, () => {
      // Get the terms the user has not yet agreed to.
      const xhr = this.props.getAgreementsByTerms(
        terms, (error, agreements) => {
          if (error) {
            this.props.addNotification({
              title: 'Problem loading terms',
              message: `Problem loading terms: ${error}`,
              level: 'error'
            });
            console.error('Problem loading terms:', error);
            return;
          }
          this.setState({newTerms: agreements || [], loadingTerms: false});
        });
      this.xhrs.push(xhr);
    });
  }

  /**
    Split the term id into the attributes.

    @method _parseTermId
    @returns {Object} The term attributes.
  */
  _parseTermId(terms) {
    const parts = terms.split('/');
    let owner = null;
    let name = null;
    let revision = null;
    if (parts.length === 3) {
      // The string must be in the format `owner/name/id`;
      owner = parts[0];
      name = parts[1];
      revision = parseInt(parts[2]);
    } else if (parts.length === 1) {
      // The string must be in the format `name`;
      name = parts[0];
    } else if (!isNaN(parts[1])) {
      // The string must be in the format `name/id`;
      name = parts[0];
      revision = parseInt(parts[1]);
    } else {
      // The string must be in the format `owner/name`;
      owner = parts[0];
      name = parts[1];
    }
    return {
      owner: owner,
      name: name,
      revision: revision
    };
  }

  /**
    Generate a change cloud action if a cloud has been selected.

    @method _generateCloudAction
    @returns {Array} The list of actions.
  */
  _generateCloudAction() {
    if (!this.state.cloud || this.props.modelCommitted) {
      return;
    }
    return [{
      action: this._clearCloud.bind(this),
      disabled: this.props.acl.isReadOnly(),
      title: 'Change cloud',
      type: 'neutral'
    }];
  }

  /**
    Generate the SSH key management section.

    @method _generateSSHKeySection
    @returns {Object} The markup.
  */
  _generateSSHKeySection() {
    const status = this._getSectionStatus('ssh-key');
    if (!status.visible) {
      return;
    }
    const cloud = this.state.cloud;
    const isAzure = cloud && cloud.cloudType === 'azure';
    let title = <span>Add public SSH keys <em>(optional)</em></span>;
    if (isAzure) {
      title = <span>Add public SSH keys</span>;
    }
    return (
      <DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-ssh-key"
        showCheck={true}
        title={title}>
        <DeploymentSSHKey
          addNotification={this.props.addNotification}
          cloud={cloud}
          getGithubSSHKeys={this.props.getGithubSSHKeys}
          setLaunchpadUsernames={this._setLaunchpadUsernames.bind(this)}
          setSSHKeys={this._setSSHKeys.bind(this)}
          username={this.props.username}
          WebHandler={this.props.WebHandler} />
      </DeploymentSection>);
  }

  /**
    Generate the AWS VPC management section.

    @method _generateVPCSection
    @returns {Object} The react component.
  */
  _generateVPCSection() {
    const status = this._getSectionStatus('vpc');
    if (!status.visible) {
      return;
    }
    return (
      <div className="deployment-vpc">
        <AccordionSection
          title={<span>Add AWS VPC ID <em>(optional)</em></span>}>
          <DeploymentVPC setVPCId={this._setVPCId.bind(this)} />
        </AccordionSection>
      </div>);

  }

  /**
    Generate the cloud section.

    @method _generateModelNameSection
    @returns {Object} The markup.
  */
  _generateModelNameSection() {
    const status = this._getSectionStatus('model-name');
    if (!status.visible) {
      return;
    }
    return (
      <DeploymentSection
        completed={status.completed}
        instance="deployment-model-name"
        showCheck={true}
        title="Set your model name">
        <DeploymentModelName
          acl={this.props.acl}
          ddEntity={this.state.ddEntity}
          modelName={this.props.modelName}
          setModelName={this.props.setModelName} />
      </DeploymentSection>);
  }

  /**
    Wrapper that generates a string based on various state to send to GA.

    @method sendAnalytics
    @param {string} action The action being performed.
    @param {arguments} args All arguments passed will be used.
  */
  sendAnalytics(action, ...args) {
    if (this.props.ddData) {
      args.push('is DD');
    } else {
      args.push('is from canvas');
    }
    if (!this.props.modelCommitted) {
      args.push('is new model');
    } else {
      args.push('is model update');
    }
    if (this.props.gisf) {
      args.push('has USSO');
    } else {
      args.push('doesn\'t have USSO');
    }

    this.props.sendAnalytics(
      'Deployment Flow',
      action,
      args.join(' - ')
    );
  }

  /**
    Determines if we should show the login links in the Deployment Login component.
    @return {Boolean} Whether or not it should render based on the component state.
  */
  _shouldShowLoginLinks() {
    const state = this.state;
    const isDirectDeploy = state.isDirectDeploy;
    if (!isDirectDeploy) {
      // We always want to show the login links if it's not Direct Deploy.
      return true;
    }
    // If it is Direct Deploy and we cannot load the entity then we
    // don't want to give the user the option to log in and continue deploying.
    return state.isDirectDeploy && !state.loadingEntity && !!state.ddEntity;
  }

  /**
    Generate the login link

    @method _generateLogin
    @returns {Object} The markup.
  */
  _generateLogin() {
    const state = this.state;
    if (this.props.isLoggedIn()) {
      return null;
    }
    const callback = err => {
      if (!err) {
        this._getAgreements();
      }
    };
    return (
      <DeploymentLogin
        addNotification={this.props.addNotification}
        callback={callback}
        gisf={this.props.gisf}
        isDirectDeploy={state.isDirectDeploy}
        loginToController={this.props.loginToController}
        showLoginLinks={this._shouldShowLoginLinks()} />);
  }

  /**
    Generate the cloud section.

    @method _generateCloudSection
    @returns {Object} The markup.
  */
  _generateCloudSection() {
    var status = this._getSectionStatus('cloud');
    if (!status.visible) {
      return;
    }
    var cloud = this.state.cloud;
    return (
      <DeploymentSection
        buttons={this._generateCloudAction()}
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-cloud"
        showCheck={true}
        title="Choose cloud to deploy to">
        <DeploymentCloud
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          cloud={cloud}
          controllerIsReady={this.props.controllerIsReady}
          getCloudProviderDetails={this.props.getCloudProviderDetails}
          listClouds={this.props.listClouds}
          setCloud={this._setCloud.bind(this)} />
      </DeploymentSection>);
  }

  /**
    Generate the credentials section.

    @method _generateCredentialSection
    @returns {Object} The markup.
  */
  _generateCredentialSection() {
    var status = this._getSectionStatus('credential');
    if (!status.visible) {
      return;
    }
    var cloud = this.state.cloud;
    return (
      <DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-credential"
        showCheck={false}>
        <DeploymentCredential
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          cloud={cloud}
          controllerIsReady={this.props.controllerIsReady}
          credential={this.state.credential}
          editable={!this.props.modelCommitted}
          generateCloudCredentialName={this.props.generateCloudCredentialName}
          getCloudCredentialNames={this.props.getCloudCredentialNames}
          getCloudCredentials={this.props.getCloudCredentials}
          getCloudProviderDetails={this.props.getCloudProviderDetails}
          region={this.state.region}
          sendAnalytics={this.sendAnalytics.bind(this)}
          setCredential={this._setCredential.bind(this)}
          setRegion={this._setRegion.bind(this)}
          updateCloudCredential={this.props.updateCloudCredential}
          user={this.props.getUserName()}
          validateForm={this.props.validateForm} />
        {this._generateVPCSection()}
      </DeploymentSection>);
  }

  /**
    Generate the machines section.

    @method _generateMachinesSection
    @returns {Object} The markup.
  */
  _generateMachinesSection() {
    var status = this._getSectionStatus('machines');
    if (!status.visible) {
      return;
    }
    var cloud = this.state.cloud;
    return (
      <DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-machines"
        showCheck={false}
        title="Machines to be provisioned">
        <DeploymentMachines
          acl={this.props.acl}
          cloud={cloud}
          formatConstraints={this.props.formatConstraints}
          generateMachineDetails={this.props.generateMachineDetails}
          machines={this.props.groupedChanges._addMachines} />
      </DeploymentSection>);
  }

  /**
    Generate the services section.

    @method _generateServicesSection
    @returns {Object} The markup.
  */
  _generateServicesSection() {
    var status = this._getSectionStatus('services');
    if (!status.visible) {
      return;
    }
    return (
      <div className="deployment-services">
        <AccordionSection
          startOpen={this.props.modelCommitted}
          title="Model changes">
          <DeploymentServices
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            changesFilterByParent={this.props.changesFilterByParent}
            charmsGetById={this.props.charmsGetById}
            generateAllChangeDescriptions={
              this.props.generateAllChangeDescriptions}
            generateChangeDescription={
              this.props.generateChangeDescription}
            getCurrentChangeSet={this.props.getCurrentChangeSet}
            getServiceByName={this.props.getServiceByName}
            listPlansForCharm={this.props.listPlansForCharm}
            parseTermId={this._parseTermId.bind(this)}
            showTerms={this.props.showTerms}
            sortDescriptionsByApplication={
              this.props.sortDescriptionsByApplication}
            withPlans={this.props.withPlans} />
        </AccordionSection>
      </div>);
  }

  /**
    Generate the budget section.

    @method _generateBudgetSection
    @returns {Object} The markup.
  */
  _generateBudgetSection() {
    var status = this._getSectionStatus('budget');
    if (!status.visible) {
      return;
    }
    return (
      <DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-budget"
        showCheck={true}
        title="Confirm budget">
        <DeploymentBudget
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          listBudgets={this.props.listBudgets}
          setBudget={this._setBudget.bind(this)}
          user={this.props.getUserName()} />
      </DeploymentSection>);
  }

  /**
    Generate the payment details section.

    @method _generatePaymentSection
    @returns {Object} The markup.
  */
  _generatePaymentSection() {
    const status = this._getSectionStatus('payment');
    if (!this.props.showPay || !status.visible) {
      return null;
    }
    return (
      <DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-payment"
        showCheck={true}
        title="Payment details">
        <DeploymentPayment
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          createCardElement={this.props.createCardElement}
          createToken={this.props.createToken}
          createUser={this.props.createUser}
          getCountries={this.props.getCountries}
          getUser={this.props.getUser}
          paymentUser={this.state.paymentUser}
          setPaymentUser={this._setPaymentUser.bind(this)}
          username={this.props.profileUsername}
          validateForm={this.props.validateForm} />
      </DeploymentSection>);
  }

  /**
    Handles checking on the "I agree to the terms" checkbox.

    @method _handleTermAgreement
    @param {Object} evt The change event.
  */
  _handleTermsAgreement(evt) {
    this.setState({termsAgreed: evt.target.checked});
  }

  /**
    Generate the agreements section.

    @method _generateAgreementsSection
    @returns {Object} The markup.
  */
  _generateAgreementsSection() {
    const status = this._getSectionStatus('agreements');
    if (!status.visible) {
      return;
    }
    const disabled = this.props.acl.isReadOnly() || status.disabled;
    const classes = classNames(
      'deployment-flow__deploy-option',
      {
        'deployment-flow__deploy-option--disabled': status.disabled
      });
    return (
      <div className={classes}>
        <input className="deployment-flow__deploy-checkbox"
          disabled={disabled}
          id="terms"
          onChange={this._handleTermsAgreement.bind(this)}
          type="checkbox" />
        <label className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
        </label>
      </div>);
  }

  /**
    Generate the deploy section.

    @returns {Object} The markup.
  */
  _generateDeploySection() {
    const status = this._getSectionStatus('deploy');
    if (!status.visible) {
      return;
    }
    const deploying = this.state.deploying;
    let deployTitle;
    if (this.props.modelCommitted) {
      deployTitle = deploying ? 'Committing...' : 'Commit';
    } else {
      deployTitle = deploying ? 'Deploying...' : 'Deploy';
    }
    const classes = classNames(
      'inner-wrapper',
      'deployment-flow__deploy',
      {'deployment-flow__deploy--cookie-visible': this.props.gtmEnabled &&
        cookieUtil.shouldShowNotification(document)}
    );
    return (
      <div className="twelve-col">
        <div className={classes}>
          {this._generateAgreementsSection()}
          <div className="deployment-flow__deploy-action">
            <GenericButton
              action={this._handleDeploy.bind(this)}
              disabled={!this._deploymentAllowed()}
              type="positive">
              {deployTitle}
            </GenericButton>
          </div>
        </div>
      </div>);
  }

  /**
    Generates the Direct Deploy component if necessary.
    @returns {Object} The React elements.
  */
  _generateDirectDeploy() {
    const props = this.props;
    const state = this.state;
    if (!this.state.isDirectDeploy) {
      return;
    }
    if (state.loadingEntity) {
      return (<Spinner />);
    }
    if (!state.loadingEntity) {
      // As long as we're not loading the entity then pass what data we do have
      // through to the DirectDeploy component and have it determine what to
      // render.
      return (
        <DeploymentDirectDeploy
          addNotification={props.addNotification}
          changeState={props.changeState}
          ddData={props.ddData}
          entityModel={state.ddEntity}
          generatePath={props.generatePath}
          getDiagramURL={props.getDiagramURL}
          renderMarkdown={props.renderMarkdown} />);
    }
    return null;
  }

  /**
    Report whether going forward with the deployment is currently allowed.

    @method _deploymentAllowed
    @returns {Bool} Whether deployment is allowed.
  */
  _deploymentAllowed() {
    // No deployments are possible without a model name.
    if (!this.props.modelName) {
      return false;
    }
    // Check that we have a cloud where to deploy to.
    if (!this.state.cloud) {
      return false;
    }
    // Check that we have credentials selected.
    if (!this.state.credential) {
      return false;
    }
    // Check that the user can deploy and they are not already deploying.
    if (this.props.acl.isReadOnly() || this.state.deploying) {
      return false;
    }
    // Check that any terms have been agreed to.
    const newTerms = this.state.newTerms;
    if (newTerms && newTerms.length > 0 && !this.state.termsAgreed) {
      return false;
    }
    // Check that the terms are not still loading.
    if (this.state.loadingTerms) {
      return false;
    }
    // Can't deploy if there is no user.
    if (this.props.showPay && !this.state.paymentUser) {
      return false;
    }
    // That's all we need if the model already exists.
    if (this.props.modelCommitted) {
      return true;
    }
    // When a new model will be created, check that the SSH key, if required,
    // has been provided.
    // TODO frankban: avoid duplicating the logic already implemented in the
    // DeploymentSSHKey component.
    if (this.state.cloud.cloudType === 'azure' && !this.state.sshKeys) {
      return false;
    }
    // A new model is ready to be created.
    return true;
  }

  render() {
    return (
      <div className="deployment-flow">
        <DeploymentPanel
          changeState={this.props.changeState}
          isDirectDeploy={this.state.isDirectDeploy}
          loggedIn={this.props.isLoggedIn()}
          sendAnalytics={this.sendAnalytics.bind(this)}
          title={this.props.modelName}>
          {this._generateDirectDeploy()}
          {this._generateModelNameSection()}
          {this._generateCloudSection()}
          {this._generateCredentialSection()}
          {this._generateSSHKeySection()}
          {this._generateMachinesSection()}
          {this._generateServicesSection()}
          {this._generateBudgetSection()}
          {this._generatePaymentSection()}
          {this._generateDeploySection()}
          {this._generateLogin()}
        </DeploymentPanel>
      </div>
    );
  }
};

DeploymentFlow.propTypes = {
  WebHandler: PropTypes.func.isRequired,
  acl: PropTypes.object.isRequired,
  addAgreement: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  addSSHKeys: PropTypes.func.isRequired,
  applications: PropTypes.array.isRequired,
  changeState: PropTypes.func.isRequired,
  changes: PropTypes.object.isRequired,
  changesFilterByParent: PropTypes.func.isRequired,
  charmsGetById: PropTypes.func.isRequired,
  charmstore: PropTypes.object.isRequired,
  cloud: PropTypes.object,
  controllerIsReady: PropTypes.func.isRequired,
  createCardElement: PropTypes.func,
  createToken: PropTypes.func,
  createUser: PropTypes.func,
  credential: PropTypes.string,
  ddData: PropTypes.object,
  deploy: PropTypes.func.isRequired,
  formatConstraints: PropTypes.func.isRequired,
  generateAllChangeDescriptions: PropTypes.func.isRequired,
  generateChangeDescription: PropTypes.func.isRequired,
  generateCloudCredentialName: PropTypes.func.isRequired,
  generateMachineDetails: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  getAgreementsByTerms: PropTypes.func.isRequired,
  getCloudCredentialNames: PropTypes.func,
  getCloudCredentials: PropTypes.func,
  getCloudProviderDetails: PropTypes.func.isRequired,
  getCountries: PropTypes.func,
  getCurrentChangeSet: PropTypes.func.isRequired,
  getDiagramURL: PropTypes.func,
  getEntity: PropTypes.func,
  getGithubSSHKeys: PropTypes.func.isRequired,
  getServiceByName: PropTypes.func.isRequired,
  getUser: PropTypes.func,
  getUserName: PropTypes.func.isRequired,
  gisf: PropTypes.bool,
  groupedChanges: PropTypes.object.isRequired,
  gtmEnabled: PropTypes.bool,
  importSSHKeys: PropTypes.func.isRequired,
  isLoggedIn: PropTypes.func.isRequired,
  listBudgets: PropTypes.func.isRequired,
  listClouds: PropTypes.func,
  listPlansForCharm: PropTypes.func.isRequired,
  loginToController: PropTypes.func.isRequired,
  makeEntityModel: PropTypes.func.isRequired,
  modelCommitted: PropTypes.bool,
  modelName: PropTypes.string.isRequired,
  profileUsername: PropTypes.string.isRequired,
  region: PropTypes.string,
  renderMarkdown: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  setModelName: PropTypes.func.isRequired,
  showPay: PropTypes.bool,
  showTerms: PropTypes.func.isRequired,
  sortDescriptionsByApplication: PropTypes.func.isRequired,
  stats: PropTypes.object,
  updateCloudCredential: PropTypes.func,
  updateModelName: PropTypes.func,
  username: PropTypes.string,
  validateForm: PropTypes.func.isRequired,
  withPlans: PropTypes.bool
};

module.exports = DeploymentFlow;
