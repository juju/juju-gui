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
      deploying: false,
      credential: this.props.credential,
      loadingTerms: false,
      loggedIn: this.props.isLoggedIn(),
      modelName: this.props.modelName,
      newTerms: [],
      paymentUser: null,
      region: this.props.region,
      showChangelogs: false,
      sshKey: null,
      // The list of term ids for the uncommitted applications.
      terms: this._getTerms() || [],
      // Whether the user has ticked the checked to agree to terms.
      termsAgreed: false,
      vpcId: INITIAL_VPC_ID,
      vpcIdForce: false
    };
  }

  componentWillMount() {
    if (this.state.loggedIn) {
      this._getAgreements();
    }
    this.sendAnalytics('Deployment started');
  }

  componentDidMount() {
    const modelName = this.refs.modelName;
    if (modelName) {
      modelName.focus();
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
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
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
    const hasCredential = !!this.state.credential;
    const willCreateModel = !this.props.modelCommitted;
    const groupedChanges = this.props.groupedChanges;
    switch (section) {
      case 'model-name':
        completed = this.props.acl.isReadOnly() ||
          (
            (this.state.modelName !== 'mymodel' || hasCloud)
            && this.state.modelName !== ''
          );
        disabled = false;
        visible = willCreateModel;
        break;
      case 'cloud':
        completed = hasCloud && hasCredential;
        disabled = !this.state.loggedIn;
        visible = this.state.loggedIn && (willCreateModel || !completed);
        break;
      case 'credential':
        completed = false;
        disabled = !hasCloud;
        visible = willCreateModel && hasCloud;
        break;
      case 'ssh-key':
        completed = false;
        disabled = !hasCloud;
        visible = willCreateModel;
        break;
      case 'vpc':
        completed = false;
        disabled = !hasCloud;
        visible = (
          willCreateModel && hasCloud && this.state.cloud.name === 'aws');
        break;
      case 'machines':
        const addMachines = groupedChanges._addMachines;
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = addMachines && Object.keys(addMachines).length > 0;
        break;
      case 'services':
        const deploys = groupedChanges._deploy;
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = deploys && Object.keys(deploys).length > 0;
        break;
      case 'budget':
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = this.props.withPlans;
        break;
      case 'payment':
        completed = !!this.state.paymentUser;
        disabled = false;
        visible = this.props.showPay;
        break;
      case 'changes':
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = true;
        break;
      case 'agreements':
        const newTerms = this.state.newTerms;
        completed = false;
        disabled = !hasCloud || !hasCredential;
        visible = newTerms && newTerms.length > 0;
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

    @method _setSSHKey
    @param {String} key The SSH key.
  */
  _setSSHKey(key) {
    this.setState({sshKey: key});
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
    Toggle the visibility of the changelogs.

    @method _toggleChangelogs
  */
  _toggleChangelogs() {
    this.setState({showChangelogs: !this.state.showChangelogs});
  }

  /**
    Handle closing the panel when the close button is clicked.

    @method _handleClose
    @param {String} err An error if deployment failed, null otherwise.
  */
  _handleClose(err) {
    this.setState({deploying: false});
    if (err) {
      // Error handling is already done by the original deploy callback.
      // Here we need to just prevent the deployment flow to close.
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
      console.log('deploy button clicked but it should have been disabled');
      return;
    }
    this.setState({deploying: true});
    this.sendAnalytics(
      'Button click',
      'Deploy model'
    );
    if (this.props.stats) {
      const flags = window.juju_config.flags;
      const statName = 'deploy' + (flags.ddeploy ? '.direct' : '.target');
      this.props.stats.increase(statName);
    }

    const args = {
      config: {},
      cloud: this.state.cloud && this.state.cloud.name || undefined,
      credential: this.state.credential,
      region: this.state.region
    };
    if (this.state.sshKey) {
      args.config['authorized-keys'] = this.state.sshKey;
    }
    if (this.state.vpcId) {
      args.config['vpc-id'] = this.state.vpcId;
      args.config['vpc-id-force'] = this.state.vpcIdForce;
    }
    const deploy = this.props.deploy.bind(
      this, this._handleClose.bind(this), true, this.state.modelName, args);
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
    Generate a button to toggle the visibility of the changelogs.

    @method _generateChangelogTitle
    @returns {Array} The action.
  */
  _generateChangelogTitle() {
    return (
      <span className="deployment-flow__service-title">
        Applications to be deployed
        <juju.components.GenericButton
          action={this._toggleChangelogs.bind(this)}
          type="inline-neutral"
          extraClasses="right"
          title={this.state.showChangelogs ?
            'Hide changelog' : 'Show changelog'} />
      </span>);
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
    return (
      <juju.components.DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-ssh-key"
        showCheck={false}>
        <juju.components.DeploymentSSHKey
          cloud={cloud}
          setSSHKey={this._setSSHKey.bind(this)}
        />
      </juju.components.DeploymentSection>);
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
      <juju.components.DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-vpc"
        showCheck={false}>
        <juju.components.DeploymentVPC setVPCId={this._setVPCId.bind(this)} />
      </juju.components.DeploymentSection>);
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
      <juju.components.DeploymentSection
        completed={status.completed}
        instance="deployment-model-name"
        showCheck={true}
        title="Set your model name">
        <div className="six-col">
          <juju.components.GenericInput
            disabled={this.props.acl.isReadOnly()}
            key="modelName"
            label="Model name"
            required={true}
            onBlur={this._updateModelName.bind(this)}
            ref="modelName"
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }, {
              regex: /^([a-z0-9]([a-z0-9-]*[a-z0-9])?)?$/,
              error: 'This field must only contain lowercase ' +
                'letters, numbers, and hyphens. It must not start or ' +
                'end with a hyphen.'
            }]}
            value={this.props.modelName} />
        </div>
      </juju.components.DeploymentSection>);
  }

  /**
    Updates the db's environment name when the model name is changed
    in the deployment panel.

    @method _updateModelName
  */
  _updateModelName(evt) {
    const modelName = this.refs.modelName.getValue();
    this.setState({modelName: modelName});
    if (modelName !== '') {
      this.props.setModelName(modelName);
    }
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
    Generate the login link

    @method _generateLogin
    @returns {Object} The markup.
  */
  _generateLogin() {
    const callback = err => {
      if (!err) {
        this.setState({loggedIn: true});
        this._getAgreements();
      }
    };
    return (
      <juju.components.DeploymentSection
        instance="deployment-model-login"
        showCheck={true}
        title="You're almost ready to deploy!">
        <div className="twelve-col">
          <p className="deployment-login__intro">
            You will need to sign in with an Ubuntu One account to deploy
            your model with Juju-as-a-Service.
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
              gisf={this.props.gisf}
              callback={callback}
              displayType={'button'}
              loginToController={this.props.loginToController}>
              Login
            </juju.components.USSOLoginLink>
          </div>
          <div className="deployment-login__signup">
            Do not have an account?
            <juju.components.USSOLoginLink
              gisf={this.props.gisf}
              callback={callback}
              displayType="text"
              loginToController={this.props.loginToController}>
              Sign up
            </juju.components.USSOLoginLink>
          </div>
        </div>
      </juju.components.DeploymentSection>);
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
      <juju.components.DeploymentSection
        buttons={this._generateCloudAction()}
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-cloud"
        showCheck={true}
        title="Choose cloud to deploy to">
        <juju.components.DeploymentCloud
          acl={this.props.acl}
          cloud={cloud}
          controllerIsReady={this.props.controllerIsReady}
          listClouds={this.props.listClouds}
          getCloudProviderDetails={this.props.getCloudProviderDetails}
          setCloud={this._setCloud} />
      </juju.components.DeploymentSection>);
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
      <juju.components.DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-credential"
        showCheck={false}>
        <juju.components.DeploymentCredential
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          credential={this.state.credential}
          cloud={cloud}
          controllerIsReady={this.props.controllerIsReady}
          getCloudProviderDetails={this.props.getCloudProviderDetails}
          editable={!this.props.modelCommitted}
          generateCloudCredentialName={this.props.generateCloudCredentialName}
          getCloudCredentials={this.props.getCloudCredentials}
          getCloudCredentialNames={this.props.getCloudCredentialNames}
          region={this.state.region}
          sendAnalytics={this.sendAnalytics}
          setCredential={this._setCredential}
          setRegion={this._setRegion}
          updateCloudCredential={this.props.updateCloudCredential}
          user={this.props.getUserName()}
          validateForm={this.props.validateForm} />
      </juju.components.DeploymentSection>);
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
      <juju.components.DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-machines"
        showCheck={false}
        title="Machines to be deployed">
        <juju.components.DeploymentMachines
          acl={this.props.acl}
          cloud={cloud}
          formatConstraints={this.props.formatConstraints}
          generateMachineDetails={this.props.generateMachineDetails}
          machines={this.props.groupedChanges._addMachines} />
      </juju.components.DeploymentSection>);
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
      <juju.components.DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-services"
        showCheck={true}
        title={this._generateChangelogTitle()}>
        <juju.components.DeploymentServices
          acl={this.props.acl}
          changesFilterByParent={this.props.changesFilterByParent}
          charmsGetById={this.props.charmsGetById}
          generateAllChangeDescriptions={
            this.props.generateAllChangeDescriptions}
          groupedChanges={this.props.groupedChanges}
          listPlansForCharm={this.props.listPlansForCharm}
          parseTermId={this._parseTermId}
          servicesGetById={this.props.servicesGetById}
          showChangelogs={this.state.showChangelogs}
          showTerms={this.props.showTerms}
          withPlans={this.props.withPlans} />
      </juju.components.DeploymentSection>);
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
      <juju.components.DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-budget"
        showCheck={true}
        title="Confirm budget">
        <juju.components.DeploymentBudget
          acl={this.props.acl}
          listBudgets={this.props.listBudgets}
          setBudget={this._setBudget}
          user={this.props.getUserName()} />
      </juju.components.DeploymentSection>);
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
      <juju.components.DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-payment"
        showCheck={true}
        title="Payment details">
        <juju.components.DeploymentPayment
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          createCardElement={this.props.createCardElement}
          createToken={this.props.createToken}
          createUser={this.props.createUser}
          getCountries={this.props.getCountries}
          getUser={this.props.getUser}
          paymentUser={this.state.paymentUser}
          setPaymentUser={this._setPaymentUser}
          username={this.props.profileUsername}
          validateForm={this.props.validateForm} />
      </juju.components.DeploymentSection>);
  }

  /**
    Generate the changes section.

    @method _generateChangeSection
    @returns {Object} The markup.
  */
  _generateChangeSection() {
    var status = this._getSectionStatus('changes');
    // Do not show the changes if we're performing a Direct Deploy.
    const ddData = this.props.ddData;
    const inDD = !!(ddData && Object.keys(ddData).length);
    if (!status.visible || inDD) {
      return;
    }
    return (
      <juju.components.DeploymentSection
        completed={status.completed}
        disabled={status.disabled}
        instance="deployment-changes"
        showCheck={false}
        title="Model changes">
        <juju.components.DeploymentChanges
          getCurrentChangeSet={this.props.getCurrentChangeSet}
          generateAllChangeDescriptions={
            this.props.generateAllChangeDescriptions} />
      </juju.components.DeploymentSection>);
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
        'deployment-flow__deploy-option--disabled' : status.disabled
      });
    return (
      <div className={classes}>
        <input className="deployment-flow__deploy-checkbox"
          onChange={this._handleTermsAgreement}
          disabled={disabled}
          id="terms"
          type="checkbox" />
        <label className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
        </label>
      </div>);
  }

  /**
    Generates the Direct Deploy component if necessary.
    @returns {Object} The React elements.
  */
  _generateDirectDeploy() {
    const props = this.props;
    if (props.ddData && props.ddData.id) {
      return (
        <juju.components.DeploymentDirectDeploy
          ddData={props.ddData}
          generatePath={props.generatePath}
          getDiagramURL={props.getDiagramURL}
          getEntity={props.getEntity}
          makeEntityModel={props.makeEntityModel}
          renderMarkdown={props.renderMarkdown} />
      );
    }
    return false;
  }

  /**
    Report whether going forward with the deployment is currently allowed.

    @method _deploymentAllowed
    @returns {Bool} Whether deployment is allowed.
  */
  _deploymentAllowed() {
    // No deployments are possible without a model name.
    if (!this.state.modelName) {
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
    if (this.state.cloud.cloudType === 'azure' && !this.state.sshKey) {
      return false;
    }
    // A new model is ready to be created.
    return true;
  }

  render() {
    const deployTitle = this.state.deploying ? 'Deploying...' : 'Deploy';
    if (this.state.loggedIn) {
      return (
        <juju.components.DeploymentPanel
          changeState={this.props.changeState}
          sendAnalytics={this.sendAnalytics}
          title={this.props.modelName}>
          {this._generateDirectDeploy()}
          {this._generateModelNameSection()}
          {this._generateCloudSection()}
          {this._generateCredentialSection()}
          {this._generateSSHKeySection()}
          {this._generateVPCSection()}
          {this._generateMachinesSection()}
          {this._generateServicesSection()}
          {this._generateBudgetSection()}
          {this._generateChangeSection()}
          {this._generatePaymentSection()}
          <div className="twelve-col">
            <div className="deployment-flow__deploy">
              {this._generateAgreementsSection()}
              <div className="deployment-flow__deploy-action">
                <juju.components.GenericButton
                  action={this._handleDeploy.bind(this)}
                  disabled={!this._deploymentAllowed()}
                  type="positive"
                  title={deployTitle} />
              </div>
            </div>
          </div>
        </juju.components.DeploymentPanel>
      );
    } else {
      return (
        <juju.components.DeploymentPanel
          changeState={this.props.changeState}
          sendAnalytics={this.sendAnalytics}
          title={this.props.modelName}>
          {this._generateDirectDeploy()}
          {this._generateLogin()}
        </juju.components.DeploymentPanel>
      );
    }
  }
};

DeploymentFlow.propTypes = {
  acl: React.PropTypes.object.isRequired,
  addAgreement: React.PropTypes.func.isRequired,
  addNotification: React.PropTypes.func.isRequired,
  applications: React.PropTypes.array.isRequired,
  changeState: React.PropTypes.func.isRequired,
  changes: React.PropTypes.object.isRequired,
  changesFilterByParent: React.PropTypes.func.isRequired,
  charmsGetById: React.PropTypes.func.isRequired,
  charmstore: React.PropTypes.object.isRequired,
  cloud: React.PropTypes.object,
  controllerIsReady: React.PropTypes.func.isRequired,
  createCardElement: React.PropTypes.func,
  createToken: React.PropTypes.func,
  createUser: React.PropTypes.func,
  credential: React.PropTypes.string,
  ddData: React.PropTypes.object,
  deploy: React.PropTypes.func.isRequired,
  formatConstraints: React.PropTypes.func.isRequired,
  generateAllChangeDescriptions: React.PropTypes.func.isRequired,
  generateCloudCredentialName: React.PropTypes.func.isRequired,
  generateMachineDetails: React.PropTypes.func.isRequired,
  generatePath: React.PropTypes.func.isRequired,
  getAgreementsByTerms: React.PropTypes.func.isRequired,
  getCloudCredentialNames: React.PropTypes.func,
  getCloudCredentials: React.PropTypes.func,
  getCloudProviderDetails: React.PropTypes.func.isRequired,
  getCountries: React.PropTypes.func,
  getCurrentChangeSet: React.PropTypes.func.isRequired,
  getDiagramURL: React.PropTypes.func,
  getEntity: React.PropTypes.func,
  getUser: React.PropTypes.func,
  getUserName: React.PropTypes.func.isRequired,
  gisf: React.PropTypes.bool,
  groupedChanges: React.PropTypes.object.isRequired,
  isLoggedIn: React.PropTypes.func.isRequired,
  listBudgets: React.PropTypes.func.isRequired,
  listClouds: React.PropTypes.func,
  listPlansForCharm: React.PropTypes.func.isRequired,
  loginToController: React.PropTypes.func.isRequired,
  makeEntityModel: React.PropTypes.func.isRequired,
  modelCommitted: React.PropTypes.bool,
  modelName: React.PropTypes.string.isRequired,
  profileUsername: React.PropTypes.string.isRequired,
  region: React.PropTypes.string,
  renderMarkdown: React.PropTypes.func.isRequired,
  sendAnalytics: React.PropTypes.func.isRequired,
  servicesGetById: React.PropTypes.func.isRequired,
  setModelName: React.PropTypes.func.isRequired,
  showPay: React.PropTypes.bool,
  showTerms: React.PropTypes.func.isRequired,
  stats: React.PropTypes.object,
  updateCloudCredential: React.PropTypes.func,
  updateModelName: React.PropTypes.func,
  validateForm: React.PropTypes.func.isRequired,
  withPlans: React.PropTypes.bool
};

YUI.add('deployment-flow', function() {
  juju.components.DeploymentFlow = DeploymentFlow;
}, '0.1.0', {
  requires: [
    'deployment-budget',
    'deployment-changes',
    'deployment-cloud',
    'deployment-credential',
    'deployment-direct-deploy',
    'deployment-machines',
    'deployment-panel',
    'deployment-payment',
    'deployment-section',
    'deployment-services',
    'deployment-ssh-key',
    'deployment-vpc',
    'entity-content-diagram',
    'generic-button',
    'generic-input',
    'usso-login-link'
  ]
});
