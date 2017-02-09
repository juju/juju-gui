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

YUI.add('deployment-flow', function() {

  juju.components.DeploymentFlow = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      changes: React.PropTypes.object.isRequired,
      changesFilterByParent: React.PropTypes.func.isRequired,
      charmsGetById: React.PropTypes.func.isRequired,
      cloud: React.PropTypes.object,
      credential: React.PropTypes.string,
      deploy: React.PropTypes.func.isRequired,
      environment: React.PropTypes.object.isRequired,
      generateAllChangeDescriptions: React.PropTypes.func.isRequired,
      generateCloudCredentialName: React.PropTypes.func.isRequired,
      getAgreements: React.PropTypes.func.isRequired,
      getAuth: React.PropTypes.func.isRequired,
      getCloudCredentialNames: React.PropTypes.func,
      getCloudCredentials: React.PropTypes.func,
      getCloudProviderDetails: React.PropTypes.func.isRequired,
      getDischargeToken: React.PropTypes.func,
      getUserName: React.PropTypes.func.isRequired,
      gisf: React.PropTypes.bool,
      groupedChanges: React.PropTypes.object.isRequired,
      isLegacyJuju: React.PropTypes.bool,
      listBudgets: React.PropTypes.func.isRequired,
      listClouds: React.PropTypes.func,
      listPlansForCharm: React.PropTypes.func.isRequired,
      loginToController: React.PropTypes.func.isRequired,
      modelCommitted: React.PropTypes.bool,
      modelName: React.PropTypes.string.isRequired,
      region: React.PropTypes.string,
      sendPost: React.PropTypes.func,
      servicesGetById: React.PropTypes.func.isRequired,
      showTerms: React.PropTypes.func.isRequired,
      updateCloudCredential: React.PropTypes.func,
      updateModelName: React.PropTypes.func,
      withPlans: React.PropTypes.bool
    },

    getDefaultProps: function() {
      return {applications: []};
    },

    getInitialState: function() {
      // Set up the cloud, credential and region from props, as if they exist at
      // mount they can't be changed.
      const modelCommitted = this.props.modelCommitted;
      return {
        cloud: modelCommitted ? this.props.cloud : null,
        deploying: false,
        credential: this.props.credential,
        loggedIn: !!this.props.getAuth(),
        modelName: this.props.modelName,
        region: this.props.region,
        showChangelogs: false,
        sshKey: null,
        terms: this._getTerms(),
        termsAgreed: false
      };
    },

    componentDidMount: function() {
      const modelName = this.refs.modelName;
      if (modelName) {
        modelName.focus();
      }
    },

    /**
      Use the props and state to figure out if a section should be visible,
      disabled or completed.

      @method _getSectionStatus
      @param {String} section The name of the section you want data for.
      @returns {Object} The object with completed, disabled and visible params.
    */
    _getSectionStatus: function(section) {
      let completed;
      let disabled;
      let visible;
      const hasCloud = !!this.state.cloud;
      const hasCredential = !!this.state.credential;
      const isLegacyJuju = this.props.isLegacyJuju;
      const willCreateModel = !this.props.modelCommitted;
      const groupedChanges = this.props.groupedChanges;
      switch (section) {
        case 'model-name':
          completed = false;
          disabled = false;
          visible = !isLegacyJuju && willCreateModel;
          break;
        case 'login':
          completed = this.state.loggedIn;
          disabled = false;
          visible = !isLegacyJuju && !this.state.loggedIn;
          break;
        case 'cloud':
          completed = hasCloud && hasCredential;
          disabled = !this.state.loggedIn;
          visible = this.state.loggedIn && !isLegacyJuju;
          break;
        case 'credential':
          completed = false;
          disabled = !hasCloud;
          visible = !isLegacyJuju;
          break;
        case 'ssh-key':
          completed = false;
          disabled = !hasCloud;
          visible = willCreateModel && !isLegacyJuju;
          break;
        case 'machines':
          const addMachines = groupedChanges._addMachines;
          completed = false;
          disabled = !isLegacyJuju && (!hasCloud || !hasCredential);
          visible = addMachines && Object.keys(addMachines).length > 0;
          break;
        case 'services':
          const deploys = groupedChanges._deploy;
          completed = false;
          disabled = !isLegacyJuju && (!hasCloud || !hasCredential);
          visible = deploys && Object.keys(deploys).length > 0;
          break;
        case 'budget':
          completed = false;
          disabled = !isLegacyJuju && (!hasCloud || !hasCredential);
          visible = !isLegacyJuju && this.props.withPlans;
          break;
        case 'changes':
          completed = false;
          disabled = !isLegacyJuju && (!hasCloud || !hasCredential);
          visible = true;
          break;
        case 'agreements':
          const terms = this.state.terms;
          completed = false;
          disabled = false;
          visible = terms && terms.length > 0;
          break;
      }
      return {
        completed: completed,
        disabled: disabled,
        visible: visible
      };
    },

    /**
      Store the selected cloud in state.

      @method _setCloud
      @param {String} cloud The selected cloud.
    */
    _setCloud: function(cloud) {
      this.setState({cloud: cloud});
    },

    /**
      Store the selected credential in state.

      @method _setCredential
      @param {String} credential The selected credential.
    */
    _setCredential: function(credential) {
      this.setState({credential: credential});
    },

    /**
      Store the selected region in state.

      @method _setRegion
      @param {String} region The selected region.
    */
    _setRegion: function(region) {
      this.setState({region: region});
    },

    /**
      Store the provided SSH key in state.

      @method _setSSHKey
      @param {String} key The SSH key.
    */
    _setSSHKey: function(key) {
      this.setState({sshKey: key});
    },

    /**
      Store the selected budget in state.

      @method _setBudget
      @param {String} budget The selected budget.
    */
    _setBudget: function(budget) {
      this.setState({budget: budget});
    },

    /**
      Toggle the visibility of the changelogs.

      @method _toggleChangelogs
    */
    _toggleChangelogs: function() {
      this.setState({showChangelogs: !this.state.showChangelogs});
    },

    /**
      Validate the form fields.

      @method _validateForm
      @param {Array} fields A list of field ref names.
      @param {Object} refs The refs for a component.
      @returns {Boolean} Whether the form is valid.
    */
    _validateForm: function(fields, refs) {
      var formValid = true;
      fields.forEach(field => {
        const ref = refs[field];
        if (!ref || !ref.validate) {
          return;
        }
        var valid = ref.validate();
        // If there is an error then mark that. We don't want to exit the loop
        // at this point so that each field gets validated.
        if (!valid) {
          formValid = false;
        }
      });
      return formValid;
    },

    /**
      Handle closing the panel when the close button is clicked.

      @method _handleClose
      @param {String} err An error if deployment failed, null otherwise.
    */
    _handleClose: function(err) {
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
    },

    /**
      Handle clearing the chosen cloud.

      @method _clearCloud
    */
    _clearCloud: function() {
      this._setCloud(null);
      // Also reset the chose credential.
      this._setCredential(null);
    },

    /**
      Handle deploying the model.

      @method _handleDeploy
    */
    _handleDeploy: function() {
      if (!this._deploymentAllowed()) {
        // This should never happen, as in these cases the deployment button is
        // disabled.
        console.log('deploy button clicked but it should have been disabled');
        return;
      }
      this.setState({deploying: true});
      const args = {
        credential: this.state.credential,
        cloud: this.state.cloud && this.state.cloud.name || undefined,
        region: this.state.region
      };
      if (this.state.sshKey) {
        args.config = {'authorized-keys': this.state.sshKey};
      }
      this.props.deploy(this._handleClose, true, this.state.modelName, args);
    },

    /**
      Get the list of terms for the uncommitted apps.

      @method _getTerms
      @returns {Array} The list of terms.
    */
    _getTerms: function() {
      const appIds = [];
      // Find the undeployed app IDs.
      const deployCommands = this.props.groupedChanges['_deploy'];
      if (!deployCommands) {
        return;
      }
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
    },

    /**
      Generate a change cloud action if a cloud has been selected.

      @method _generateCloudAction
      @returns {Array} The list of actions.
    */
    _generateCloudAction: function() {
      if (!this.state.cloud || this.props.modelCommitted) {
        return;
      }
      return [{
        action: this._clearCloud,
        disabled: this.props.acl.isReadOnly(),
        title: 'Change cloud',
        type: 'neutral'
      }];
    },

    /**
      Generate a button to toggle the visibility of the changelogs.

      @method _generateChangelogTitle
      @returns {Array} The action.
    */
    _generateChangelogTitle: function() {
      return (
        <span className="deployment-flow__service-title">
          Applications to be deployed
          <juju.components.GenericButton
            action={this._toggleChangelogs}
            type="inline-neutral"
            extraClasses="right"
            title={this.state.showChangelogs ?
              'Hide changelog' : 'Show changelog'} />
        </span>);
    },

    /**
      Generate the SSH key management section.

      @method _generateSSHKeySection
      @returns {Object} The markup.
    */
    _generateSSHKeySection: function() {
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
            setSSHKey={this._setSSHKey}
          />
        </juju.components.DeploymentSection>);
    },

    /**
      Generate the cloud section.

      @method _generateModelNameSection
      @returns {Object} The markup.
    */
    _generateModelNameSection: function() {
      const status = this._getSectionStatus('model-name');
      if (!status.visible) {
        return;
      }
      return (
        <juju.components.DeploymentSection
          instance="deployment-model-name"
          showCheck={false}
          title="Model name">
          <div className="six-col">
            <juju.components.GenericInput
              disabled={this.props.acl.isReadOnly()}
              key="modelName"
              label="Model name"
              required={true}
              onBlur={this._updateModelName}
              ref="modelName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^([a-z0-9]([a-z0-9.-]*[a-z0-9])?)?$/,
                error: 'This field must only contain lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]}
              value={this.props.modelName} />
          </div>
        </juju.components.DeploymentSection>);
    },

    /**
      Updates the db's environment name when the model name is changed
      in the deployment panel.

      @method _updateModelName
    */
    _updateModelName: function(evt) {
      const modelName = this.refs.modelName.getValue();
      this.setState({modelName: modelName});
      if (modelName !== '') {
        this.props.environment.set('name', modelName);
      }
    },

    /**
      Generate the login link

      @method _generateLogin
      @returns {Object} The markup.
    */
    _generateLogin: function() {
      var status = this._getSectionStatus('login');
      if (!status.visible) {
        return;
      }
      const callback = err => {
        if (!err) {
          this.setState({loggedIn: true});
        }
      };
      return (
        <juju.components.DeploymentSection
          instance="deployment-model-login"
          showCheck={false}>
          <div className="six-col">
            <juju.components.USSOLoginLink
              gisf={this.props.gisf}
              callback={callback}
              displayType={'button'}
              sendPost={this.props.sendPost}
              getDischargeToken={this.props.getDischargeToken}
              loginToController={this.props.loginToController}/>
          </div>
        </juju.components.DeploymentSection>);
    },

    /**
      Generate the appropriate cloud title based on the state.

      @method _generateCloudTitle
      @returns {String} The cloud title.
    */
    _generateCloudTitle: function() {
      var cloud = this.state.cloud;
      if (!cloud) {
        return 'Choose cloud to deploy to';
      } else if (cloud.name === 'local') {
        return 'Local cloud';
      } else {
        return 'Public cloud';
      }
    },

    /**
      Generate the cloud section.

      @method _generateCloudSection
      @returns {Object} The markup.
    */
    _generateCloudSection: function() {
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
          title={this._generateCloudTitle()}>
          <juju.components.DeploymentCloud
            acl={this.props.acl}
            cloud={cloud}
            listClouds={this.props.listClouds}
            getCloudProviderDetails={this.props.getCloudProviderDetails}
            setCloud={this._setCloud} />
        </juju.components.DeploymentSection>);
    },

    /**
      Generate the credentials section.

      @method _generateCredentialSection
      @returns {Object} The markup.
    */
    _generateCredentialSection: function() {
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
            credential={this.state.credential}
            cloud={cloud}
            getCloudProviderDetails={this.props.getCloudProviderDetails}
            editable={!this.props.modelCommitted}
            generateCloudCredentialName={this.props.generateCloudCredentialName}
            getCloudCredentials={this.props.getCloudCredentials}
            getCloudCredentialNames={this.props.getCloudCredentialNames}
            region={this.state.region}
            setCredential={this._setCredential}
            setRegion={this._setRegion}
            updateCloudCredential={this.props.updateCloudCredential}
            user={this.props.getUserName()}
            validateForm={this._validateForm} />
        </juju.components.DeploymentSection>);
    },

    /**
      Generate the machines section.

      @method _generateMachinesSection
      @returns {Object} The markup.
    */
    _generateMachinesSection: function() {
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
            machines={this.props.groupedChanges._addMachines} />
        </juju.components.DeploymentSection>);
    },

    /**
      Generate the services section.

      @method _generateServicesSection
      @returns {Object} The markup.
    */
    _generateServicesSection: function() {
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
            servicesGetById={this.props.servicesGetById}
            showChangelogs={this.state.showChangelogs}
            showTerms={this.props.showTerms}
            withPlans={this.props.withPlans} />
        </juju.components.DeploymentSection>);
    },

    /**
      Generate the budget section.

      @method _generateBudgetSection
      @returns {Object} The markup.
    */
    _generateBudgetSection: function() {
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
    },

    /**
      Generate the changes section.

      @method _generateChangeSection
      @returns {Object} The markup.
    */
    _generateChangeSection: function() {
      var status = this._getSectionStatus('changes');
      if (!status.visible) {
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
            changes={this.props.changes}
            generateAllChangeDescriptions={
              this.props.generateAllChangeDescriptions} />
        </juju.components.DeploymentSection>);
    },

    /**
      Handles checking on the "I agree to the terms" checkbox.

      @method _generateAgreementsSection
      @param {Object} evt The change event.
    */
    _handleTermsAgreement: function(evt) {
      this.setState({termsAgreed: evt.target.checked});
    },

    /**
      Generate the agreements section.

      @method _generateAgreementsSection
      @returns {Object} The markup.
    */
    _generateAgreementsSection: function() {
      const status = this._getSectionStatus('agreements');
      if (!status.visible) {
        return;
      }
      const disabled = this.props.acl.isReadOnly();
      return (
        <div className="deployment-flow__deploy-option">
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
    },

    /**
      Report whether going forward with the deployment is currently allowed.

      @method _deploymentAllowed
      @returns {Bool} Whether deployment is allowed.
    */
    _deploymentAllowed: function() {
      // No deployments are possible without a model name.
      if (!this.state.modelName) {
        return false;
      }
      if (this.props.isLegacyJuju) {
        // On legacy Juju having the model name is sufficient for proceeding.
        return true;
      }
      // Check that we have a cloud where to deploy to.
      if (!this.state.cloud) {
        return false;
      }
      // Check that the user can deploy and they are not already deploying.
      if (this.props.acl.isReadOnly() || this.state.deploying) {
        return false;
      }
      // Check that any terms have been agreed to.
      const terms = this.state.terms;
      if (terms && terms.length > 0 && !this.state.termsAgreed) {
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
    },

    render: function() {
      const deployTitle = this.state.deploying ? 'Deploying...' : 'Deploy';
      return (
        <juju.components.DeploymentPanel
          changeState={this.props.changeState}
          title={this.props.modelName}>
          {this._generateModelNameSection()}
          {this._generateLogin()}
          {this._generateCloudSection()}
          {this._generateCredentialSection()}
          {this._generateSSHKeySection()}
          {this._generateMachinesSection()}
          {this._generateServicesSection()}
          {this._generateBudgetSection()}
          {this._generateChangeSection()}
          <div className="twelve-col">
            <div className="deployment-flow__deploy">
              {this._generateAgreementsSection()}
              <div className="deployment-flow__deploy-action">
                <juju.components.GenericButton
                  action={this._handleDeploy}
                  disabled={!this._deploymentAllowed()}
                  type="positive"
                  title={deployTitle} />
              </div>
            </div>
          </div>
        </juju.components.DeploymentPanel>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-budget',
    'deployment-changes',
    'deployment-cloud',
    'deployment-credential',
    'deployment-machines',
    'deployment-panel',
    'deployment-section',
    'deployment-services',
    'deployment-ssh-key',
    'generic-button',
    'generic-input',
    'usso-login-link'
  ]
});
