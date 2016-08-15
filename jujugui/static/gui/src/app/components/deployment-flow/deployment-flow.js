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
      addTemplate: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      changesFilterByParent: React.PropTypes.func.isRequired,
      generateAllChangeDescriptions: React.PropTypes.func.isRequired,
      groupedChanges: React.PropTypes.object.isRequired,
      listBudgets: React.PropTypes.func.isRequired,
      listClouds: React.PropTypes.func.isRequired,
      listPlansForCharm: React.PropTypes.func.isRequired,
      listRegions: React.PropTypes.func.isRequired,
      listTemplates: React.PropTypes.func.isRequired,
      modelCommitted: React.PropTypes.bool,
      modelName: React.PropTypes.string.isRequired,
      servicesGetById: React.PropTypes.func.isRequired,
      user: React.PropTypes.object,
      users: React.PropTypes.object.isRequired
    },

    CLOUDS: {
      google: {
        id: 'google',
        showLogo: true,
        signupUrl: 'https://console.cloud.google.com/billing/freetrial',
        svgHeight: 33,
        svgWidth: 256,
        title: 'Google Compute Engine'
      },
      azure: {
        id: 'azure',
        showLogo: true,
        signupUrl: 'https://azure.microsoft.com/en-us/free/',
        svgHeight: 24,
        svgWidth: 204,
        title: 'Microsoft Azure'
      },
      aws: {
        id: 'aws',
        showLogo: true,
        signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
        svgHeight: 48,
        svgWidth: 120,
        title: 'Amazon Web Services'
      },
      local: {
        id: 'local',
        showLogo: false,
        title: 'Local'
      }
    },

    getInitialState: function() {
      return {
        cloud: null,
        credential: null,
        template: null,
        region: null,
        showChangelogs: false
      };
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
      var mode = this.props.modelCommitted ? 'commit' : 'deploy';
      // XXX: Need to find a way to check if any newly added applications have
      // plans.
      var includesPlans = true;
      switch (section) {
        case 'cloud':
          completed = hasCloud && hasCredential;
          disabled = false;
          visible = true;
          break;
        case 'credential':
          completed = false;
          disabled = !hasCloud;
          visible = true;
          break;
        case 'machines':
          completed = false;
          disabled = !hasCloud || !hasCredential;
          visible = true;
          break;
        case 'services':
          completed = false;
          disabled = !hasCloud || !hasCredential;
          visible = true;
          break;
        case 'budget':
          completed = false;
          disabled = !hasCloud || !hasCredential;
          visible = includesPlans;
          break;
        case 'agreements':
          completed = false;
          disabled = false;
          visible = mode === 'deploy';
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
    */
    _setCloud: function(cloud) {
      this.setState({cloud: cloud});
    },

    /**
      Store the selected credential in state.

      @method _setCredential
    */
    _setCredential: function(credential) {
      this.setState({credential: credential});
    },

    /**
      Store the selected template in state.

      @method _setTemplate
    */
    _setTemplate: function(template) {
      this.setState({template: template});
    },

    /**
      Store the selected region in state.

      @method _setRegion
    */
    _setRegion: function(region) {
      this.setState({region: region});
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
        var valid = refs[field].validate();
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
      Generate a change cloud action if a cloud has been selected.

      @method _generateCloudAction
      @returns {Array} The list of actions.
    */
    _generateCloudAction: function() {
      if (!this.state.cloud) {
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
      Generate the appropriate cloud title based on the state.

      @method _generateCloudTitle
      @returns {String} The cloud title.
    */
    _generateCloudTitle: function() {
      var cloud = this.state.cloud;
      if (!cloud) {
        return 'Choose cloud to deploy to';
      } else if (cloud === 'local') {
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
            clouds={this.CLOUDS}
            listClouds={this.props.listClouds}
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
      var credential = this.state.credential;
      return (
        <juju.components.DeploymentSection
          completed={status.completed}
          disabled={status.disabled}
          instance="deployment-credential"
          showCheck={false}>
          <juju.components.DeploymentCredential
            acl={this.props.acl}
            addTemplate={this.props.addTemplate}
            credential={credential}
            cloud={cloud}
            clouds={this.CLOUDS}
            listRegions={this.props.listRegions}
            listTemplates={this.props.listTemplates}
            region={this.state.region}
            setCredential={this._setCredential}
            setRegion={this._setRegion}
            setTemplate={this._setTemplate}
            template={this.state.template}
            users={this.props.users}
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
            cloud={cloud && this.CLOUDS[cloud]} />
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
      var cloud = this.state.cloud;
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
            cloud={cloud}
            generateAllChangeDescriptions={
              this.props.generateAllChangeDescriptions}
            groupedChanges={this.props.groupedChanges}
            listPlansForCharm={this.props.listPlansForCharm}
            servicesGetById={this.props.servicesGetById}
            showChangelogs={this.state.showChangelogs} />
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
            user={this.props.user} />
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
        <juju.components.Panel
          instanceName="deployment-flow-panel"
          visible={true}>
          <div className="deployment-flow">
            <div className="deployment-flow__header">
              <div className="deployment-flow__close">
                <juju.components.GenericButton
                  action={this._handleClose}
                  type="neutral"
                  title="Back to canvas" />
              </div>
              <div className="deployment-flow__header-name">
                {this.props.modelName}
              </div>
            </div>
            <div className="deployment-flow__content">
              <div className="twelve-col">
                <div className="inner-wrapper">
                  {this._generateCloudSection()}
                  {this._generateCredentialSection()}
                  {this._generateMachinesSection()}
                  {this._generateServicesSection()}
                  {this._generateBudgetSection()}
                  <div className="twelve-col">
                    <div className="deployment-flow__deploy">
                      {this._generateAgreementsSection()}
                      <div className="deployment-flow__deploy-action">
                        <juju.components.GenericButton
                          action={undefined}
                          disabled={disabled || !this.state.cloud}
                          type="positive"
                          title="Deploy" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-budget',
    'deployment-cloud',
    'deployment-credential',
    'deployment-machines',
    'deployment-section',
    'deployment-services',
    'generic-button',
    'panel-component'
  ]
});
