/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('deployment-choose-cloud', function() {

  juju.components.DeploymentChooseCloud = React.createClass({

    // XXX huwshimi 22 March 2016: this should be replaced with a passed in prop
    // once the data is available.
    CREDENTIALS: [{
      id: 'my-cloud-credentials',
      cloud: 'aws',
      title: 'My cloud credentials',
      owner: 'Me!',
      uses: 3
    }],

    propTypes: {
      changeState: React.PropTypes.func.isRequired
    },

    /**
      Generate the list of credentials.

      @method _generateCredentials
    */
    _generateCredentials: function() {
      var credentials = this.CREDENTIALS;
      if (credentials.length === 0) {
        return;
      }
      var components = [];
      credentials.forEach((credential, i) => {
        var plural = credential.uses === 1 ? '' : 's';
        var lastCol = i % 2 === 1 ? 'last-col' : '';
        var className = 'deployment-choose-cloud__cloud-option ' +
          'deployment-choose-cloud__cloud-option--credential six-col ' +
          lastCol;
        var src = `juju-ui/assets/images/non-sprites/${credential.cloud}.png`;
        components.push(
          <li className={className}
            key={credential.id}
            onClick={this._handleCredentialClick.bind(this, credential.id)}>
            <img alt={credential.cloud}
              className="deployment-choose-cloud__cloud-option-logo"
              src={src} />
            <span className="deployment-choose-cloud__cloud-option-title">
              {credential.title}
            </span>
            <div>
              Owner: {credential.owner}
              &nbsp;&bull;&nbsp;
              Used for {credential.uses} model{plural}
            </div>
          </li>);
      });
      return (
        <div>
          <h3 className="deployment-choose-cloud__title twelve-col">
            Public clouds
          </h3>
          <ul className="deployment-choose-cloud__list twelve-col">
            {components}
          </ul>
        </div>);
    },

    /**
      Generate a list of cloud options.

      @method _generateChangeItems
      @returns {Array} The collection of changes.
    */
    _generateOptions: function() {
      var options = [{
        id: 'aws',
        image: 'aws.png'
      }];
      var components = [];
      options.forEach(function(option, i) {
        var lastCol = i % 2 === 1 ? 'last-col' : '';
        var className = 'deployment-choose-cloud__cloud-option six-col ' +
          lastCol;
        var src = `juju-ui/assets/images/non-sprites/${option.image}`;
        components.push(
          <li className={className}
            key={option.id}
            onClick={this._handleCloudClick.bind(this, option.id)}>
            <img alt={option.id}
              src={src} />
          </li>);
      }, this);
      return components;
    },

    /**
      Handling clicking on a cloud option.

      @method _handleCloudClick
    */
    _handleCloudClick: function(id) {
      this.props.changeState({
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'add-credentials'
          }
        }
      });
    },

    /**
      Handling clicking on an existing credential option.

      @method _handleCredentialClick
    */
    _handleCredentialClick: function(id) {
      this.props.changeState({
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'summary'
          }
        }
      });
    },

    /**
      Generate the onboarding if there are no credentials.

      @method _generateOnboarding
    */
    _generateOnboarding: function() {
      if (this.CREDENTIALS.length > 0) {
        return;
      }
      return (
        <div className="deployment-choose-cloud__notice twelve-col">
          <juju.components.SvgIcon
            name="general-action-blue"
            size="16" />
          Add a public cloud credential, and we can save it as an option
          for later use
        </div>);
    },

    render: function() {
      return (
        <div className="deployment-panel__child">
          <juju.components.DeploymentPanelContent
            title="Choose your cloud">
            {this._generateCredentials()}
            {this._generateOnboarding()}
            <h3 className="deployment-choose-cloud__title twelve-col">
              Public clouds
            </h3>
            <ul className="deployment-choose-cloud__list twelve-col">
              {this._generateOptions()}
            </ul>
            <h3 className="deployment-choose-cloud__title twelve-col">
              Get credentials by signing up with your favoured public cloud
            </h3>
            <ul className="deployment-choose-cloud__list">
              <li>
                <a className="deployment-choose-cloud__link"
                  href="https://cloud.google.com/compute/"
                  target="_blank">
                  Google Compute Engine&nbsp;&rsaquo;
                </a>
              </li>
              <li>
                <a className="deployment-choose-cloud__link"
                  href="https://azure.microsoft.com/"
                  target="_blank">
                  Windows Azure&nbsp;&rsaquo;
                </a>
              </li>
              <li>
                <a className="deployment-choose-cloud__link"
                  href="https://aws.amazon.com/"
                  target="_blank">
                  Amazon Web Services&nbsp;&rsaquo;
                </a>
              </li>
            </ul>
          </juju.components.DeploymentPanelContent>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-panel-content',
  'svg-icon'
]});
