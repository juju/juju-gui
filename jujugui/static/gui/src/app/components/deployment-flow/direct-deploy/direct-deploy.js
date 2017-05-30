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
      if (this.state.isBundle) {
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
      }
    },

    render: function() {
      let diagram = null;
      let description = null;
      let title = null;
      const ddEntityId = this.props.ddData.id;
      if (this.state.isBundle) {
        diagram = <juju.components.EntityContentDiagram
          getDiagramURL={this.props.getDiagramURL}
          id={ddEntityId} />;

        if (this.state.entityModel) {
          description = <juju.components.EntityContentDescription
            entityModel={this.state.entityModel}
            renderMarkdown={this.props.renderMarkdown}
            />;
          title = (<h3>{this.state.entityModel.toEntity().displayName}</h3>);
        }
      }
      return (
        <juju.components.DeploymentSection
          instance="deployment-one-click"
          showCheck={false}
          title="You are deploying:">
          {diagram}
          {title}
          {description}
        </juju.components.DeploymentSection>);
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-section'
  ]
});
