/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

class DeploymentDirectDeploy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entityModel: false,
      isBundle: this.props.ddData.id.indexOf('bundle') !== -1,
      loading: false
    };
  }

  componentWillMount() {
    this.setState({loading: true}, () => {
      this.props.getEntity(this.props.ddData.id, (error, data) => {
        this.setState({loading: false}, () => {
          if (error) {
            console.error('cannot fetch the entity:' + error);
            return;
          }
          if (data && data.length > 0) {
            data = data[0];
            this.setState({
              entityModel: this.props.makeEntityModel(data)
            });
          }
        });
      });
    });
  }

  /**
    Change the state to close the deployment flow.
  */
  _handleClose() {
    this.props.changeState({
      gui: {deploy: null},
      profile: null,
      special: {dd: null}
    });
  }

  /**
    Generate the entity link.

    @returns {Object} The link markup or null.
  */
  _generateLink() {
    const ddEntityId = this.props.ddData.id;
    let url;
    try {
      url = window.jujulib.URL.fromLegacyString(ddEntityId);
    } catch(_) {
      url = window.jujulib.URL.fromString(ddEntityId);
    }
    url = this.props.generatePath({
      store: url.path()
    });
    if (!url) {
      return null;
    }
    return (
      <a className="link"
        href={`${url}`}
        target="_blank">
        Learn more about this {this.state.isBundle ? 'bundle' : 'charm'}.
      </a>);
  }

  /**
    Generate the entity diagram or icon.

    @returns {Object} The markup.
  */
  _generateImage() {
    if (this.state.isBundle) {
      return (
        <juju.components.EntityContentDiagram
          getDiagramURL={this.props.getDiagramURL}
          id={this.props.ddData.id} />);
    } else {
      const entity = this.state.entityModel.toEntity();
      return (
        <div className="deployment-direct-deploy__image-block">
          <img alt={entity.displayName}
            className="deployment-direct-deploy__image-block-icon"
            src={entity.iconPath}
            width="96" />
        </div>);
    }
  }

  render() {
    let content = null;
    if (this.state.loading) {
      content = (<juju.components.Spinner />);
    } else if (!this.state.entityModel) {
      content = (
        <div>
          This {this.state.isBundle ? 'bundle' : 'charm'} could not be found.
        </div>);
    } else {
      const entity = this.state.entityModel.toEntity();
      const machineNumber = this.state.isBundle ? entity.machineCount : 1;
      content = (
        <div>
          <div className="deployment-direct-deploy__description six-col">
            <h4>You are about to deploy:</h4>
            <h2 className="deployment-direct-deploy__title">
              {entity.displayName}
            </h2>
            <juju.components.EntityContentDescription
              entityModel={this.state.entityModel}
              renderMarkdown={this.props.renderMarkdown} />
            <ul>
              <li>
                It will run on {machineNumber}&nbsp;
                machine{machineNumber === 1 ? '' : 's'} in your cloud.
              </li>
            </ul>
            {this._generateLink()}
          </div>
          <div className="six-col last-col no-margin-bottom">
            <div className="deployment-direct-deploy__image">
              {this._generateImage()}
            </div>
            <div className="deployment-direct-deploy__edit-model">
              <juju.components.GenericButton
                action={this._handleClose.bind(this)}
                type="inline-neutral">
                Edit model
              </juju.components.GenericButton>
            </div>
          </div>
        </div>);
    }
    return (
      <juju.components.DeploymentSection
        instance="deployment-direct-deploy">
        {content}
      </juju.components.DeploymentSection>);
  }
};

DeploymentDirectDeploy.propTypes = {
  changeState: React.PropTypes.func.isRequired,
  ddData: React.PropTypes.object.isRequired,
  generatePath: React.PropTypes.func.isRequired,
  getDiagramURL: React.PropTypes.func.isRequired,
  getEntity: React.PropTypes.func.isRequired,
  makeEntityModel: React.PropTypes.func.isRequired,
  renderMarkdown: React.PropTypes.func.isRequired
};

YUI.add('deployment-direct-deploy', function() {
  juju.components.DeploymentDirectDeploy = DeploymentDirectDeploy;
}, '0.1.0', {
  requires: [
    'deployment-section',
    'entity-content-diagram',
    'entity-content-description',
    'generic-button',
    'loading-spinner'
  ]
});
