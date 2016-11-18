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
      cloud: React.PropTypes.object,
      controller: React.PropTypes.object.isRequired,
      credential: React.PropTypes.string,
      deploy: React.PropTypes.func.isRequired,
      generateAllChangeDescriptions: React.PropTypes.func.isRequired,
      generateCloudCredentialName: React.PropTypes.func.isRequired,
      getAuth: React.PropTypes.func.isRequired,
      getCloudCredentialNames: React.PropTypes.func,
      getCloudCredentials: React.PropTypes.func,
      getCloudProviderDetails: React.PropTypes.func.isRequired,
      groupedChanges: React.PropTypes.object.isRequired,
      isLegacyJuju: React.PropTypes.bool,
      listBudgets: React.PropTypes.func.isRequired,
      listClouds: React.PropTypes.func,
      listPlansForCharm: React.PropTypes.func.isRequired,
      modelCommitted: React.PropTypes.bool,
      modelName: React.PropTypes.string.isRequired,
      region: React.PropTypes.string,
      servicesGetById: React.PropTypes.func.isRequired,
      updateCloudCredential: React.PropTypes.func,
      user: React.PropTypes.string,
      withPlans: React.PropTypes.bool
    },

    getInitialState: function() {
      // Set up the cloud, credential and region from props, as if they exist at
      // mount they can't be changed.
      const modelCommitted = this.props.modelCommitted;
      return {
        cloud: modelCommitted ? this.props.cloud : null,
        credential: this.props.credential,
        region: this.props.region,
        showChangelogs: false,
        loggedIn: !!this.props.getAuth(),
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
      var completed;
      var disabled;
      var visible;
      var hasCloud = !!this.state.cloud;
      var hasCredential = !!this.state.credential;
      const isLegacyJuju = this.props.isLegacyJuju;
      var mode = this.props.modelCommitted ? 'commit' : 'deploy';
      var includesPlans = this.props.withPlans;
      const groupedChanges = this.props.groupedChanges;
      switch (section) {
        case 'model-name':
          completed = false;
          disabled = false;
          visible = !isLegacyJuju && mode === 'deploy';
          break;
        case 'login':
          completed = this.state.loggedIn;
          disabled = false
          visible = !isLegacyJuju && !this.state.loggedIn;
          break;
        case 'cloud':
          completed = hasCloud && hasCredential;
          disabled = this.state.loggedIn;
          visible = !isLegacyJuju;
          break;
        case 'credential':
          completed = false;
          disabled = !hasCloud;
          visible = !isLegacyJuju;
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
          visible = !isLegacyJuju && includesPlans;
          break;
        case 'changes':
          completed = false;
          disabled = !isLegacyJuju && (!hasCloud || !hasCredential);
          visible = true;
          break;
        case 'agreements':
          completed = false;
          disabled = false;
          visible = false;
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
    */
    _handleClose: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: {}
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
      const credential = this.state.credential;
      const cloud = this.state.cloud && this.state.cloud.name || null;
      const region = this.state.region;
      let modelName = '';
      if (this.refs.modelName) {
        modelName = this.refs.modelName.getValue();
      }
      this.props.deploy(
        this._handleClose, true, modelName, credential, cloud, region);
    },

    /**
      Handle logging in within the deployment flow.

     @method _handleLogin
    */
    _handleLogin: function() {
      this.props.controller.connect();
      //TODO XXX about queueing here
      const handler = this.props.controller.after('facadesChange', e => {
      if (e.newVal && this.props.controller.get('facades')) {
          this.setState({loggedIn: true});
          handler.detach();
        }
      });
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
          Services to be deployed
          <juju.components.GenericButton
            action={this._toggleChangelogs}
            type="base"
            title={this.state.showChangelogs ?
              'Hide changelog' : 'Show changelog'} />
        </span>);
    },

    /**
      Generate the cloud section.

      @method _generateModelNameSection
      @returns {Object} The markup.
    */
    _generateModelNameSection: function() {
      var status = this._getSectionStatus('model-name');
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
              ref="modelName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/,
                error: 'This field must only contain lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]}
              value="" />
          </div>
        </juju.components.DeploymentSection>);
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
      return (
        <juju.components.DeploymentSection
          instance="deployment-model-login"
          showCheck={false}>
          <div className="six-col">
          <juju.components.GenericButton
            action={this._handleLogin}
            type="positive"
            title="Sign up or Login" />
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
            user={this.props.user}
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
            generateAllChangeDescriptions={
              this.props.generateAllChangeDescriptions}
            groupedChanges={this.props.groupedChanges}
            listPlansForCharm={this.props.listPlansForCharm}
            servicesGetById={this.props.servicesGetById}
            showChangelogs={this.state.showChangelogs}
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
            user={this.props.user} />
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
      Generate the agreements section.

      @method _generateAgreementsSection
      @returns {Object} The markup.
    */
    _generateAgreementsSection: function() {
      var status = this._getSectionStatus('agreements');
      if (!status.visible) {
        return;
      }
      var disabled = this.props.acl.isReadOnly();
      return (
        <div>
          <div className="deployment-flow__deploy-option">
            <input className="deployment-flow__deploy-checkbox"
              disabled={disabled}
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
              disabled={disabled}
              id="terms"
              type="checkbox" />
            <label className="deployment-flow__deploy-label"
              htmlFor="terms">
              I agree that my use of any services and related APIs
              is subject to my compliance with the applicable&nbsp;
              <a href="" target="_blank">Terms of service</a>.
            </label>
          </div>
        </div>);
    },

    render: function() {
      var disabled = this.props.acl.isReadOnly();
      return (
        <juju.components.DeploymentPanel
          changeState={this.props.changeState}
          title={this.props.modelName}>
          {this._generateModelNameSection()}
          {this._generateLogin()}
          {this._generateCloudSection()}
          {this._generateCredentialSection()}
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
                  disabled={
                    !this.props.isLegacyJuju && (disabled || !this.state.cloud)}
                  type="positive"
                  title="Deploy" />
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
    'generic-button',
    'generic-input'
  ]
});
