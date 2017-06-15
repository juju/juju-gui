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

YUI.add('deployment-direct-deploy', function() {

  juju.components.DeploymentDirectDeploy = React.createClass({
    displayName: 'DeploymentDirectDeploy',

    propTypes: {
      ddData: React.PropTypes.object.isRequired,
      generatePath: React.PropTypes.func.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      getEntity: React.PropTypes.func.isRequired,
      makeEntityModel: React.PropTypes.func.isRequired,
      renderMarkdown: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        entityModel: false,
        isBundle: this.props.ddData.id.indexOf('bundle') !== -1
      };
    },

    componentDidMount: function() {
      this.props.getEntity(this.props.ddData.id, (error, data) => {
        if (error) {
          console.error('cannot fetch the entity:' + error);
          return;
        }
        if (data.length > 0) {
          data = data[0];
          this.setState({
            entityModel: this.props.makeEntityModel(data)
          });
        }
      });
    },

    render: function() {
      let diagram = null;
      let titleAndDescription = null;
      const ddEntityId = this.props.ddData.id;
      if (this.state.isBundle) {
        diagram = (<div className="six-col deployment-direct-deploy__image">
          <juju.components.EntityContentDiagram
            getDiagramURL={this.props.getDiagramURL}
            id={ddEntityId} />
        </div>);
      }

      if (this.state.entityModel) {
        const entity = this.state.entityModel.toEntity();
        const description = <juju.components.EntityContentDescription
          entityModel={this.state.entityModel}
          renderMarkdown={this.props.renderMarkdown} />;
        const title = (<h3
          className="deployment-direct-deploy__title">
          {entity.displayName}
        </h3>);

        let url;
        let link;
        try {
          url = window.jujulib.URL.fromLegacyString(ddEntityId);
        } catch(_) {
          url = window.jujulib.URL.fromString(ddEntityId);
        }
        url = this.props.generatePath({
          store: url.path()
        });
        
        if (url) {
          link = (<a href={`${url}`}
            className="link" target="_blank">
              Learn more about this {this.state.isBundle ? 'bundle' : 'charm'}.
          </a>);
        }

        const wrapperClasses = classNames(
          'deployment-direct-deploy__description',
          {
            'six-col last-col': this.state.isBundle,
            'twelve-col': !this.state.isBundle
          }
        );

        titleAndDescription = (<div
          className={wrapperClasses}>
          {title}
          {description}
          {link}
        </div>);
      }

      return (
        <juju.components.DeploymentSection
          completed={true}
          instance="deployment-direct-deploy"
          showCheck={true}
          title="You are deploying:">
          {diagram}
          {titleAndDescription}
        </juju.components.DeploymentSection>);
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-section'
  ]
});
