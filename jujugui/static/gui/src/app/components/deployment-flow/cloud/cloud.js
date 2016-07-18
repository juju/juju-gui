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

YUI.add('deployment-cloud', function() {

  juju.components.DeploymentCloud = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      cloud: React.PropTypes.string,
      clouds: React.PropTypes.object.isRequired,
      setCloud: React.PropTypes.func.isRequired
    },

    /**
      Generate the list of clouds.

      @method _generateClouds
      @returns {Object} The cloud list.
    */
    _generateClouds: function() {
      if (this.props.cloud) {
        return;
      }
      var clouds = [];
      Object.keys(this.props.clouds).forEach((key, i) => {
        var cloud = this.props.clouds[key];
        var classes = classNames(
          'deployment-cloud__cloud',
          'four-col',
          {'last-col': i % 3 === 2});
        clouds.push(
          <li className={classes}
            key={cloud.id}
            onClick={this.props.setCloud.bind(null, cloud.id)}
            role="button"
            tabIndex="0">
            <span className="deployment-cloud__cloud-logo">
              {this._generateLogo(key)}
            </span>
          </li>);
      });
      return (
        <ul className="deployment-cloud__list">
          {clouds}
        </ul>);
    },

    /**
      Generate the logo for the selected cloud.

      @method _generateCloud
      @returns {Object} The cloud.
    */
    _generateCloud: function() {
      var cloud = this.props.cloud;
      if (!cloud) {
        return;
      }
      return (
        <div className="deployment-cloud__chosen">
          {this._generateLogo(cloud)}
        </div>);
    },

    /**
      Generate the logo for a cloud;

      @method _generateLogo
      @param {String} id A cloud id.
      @returns {Array} The logo.
    */
    _generateLogo: function(id) {
      if (!id) {
        return;
      }
      var cloud = this.props.clouds[id];
      return cloud.showLogo ? (
        <juju.components.SvgIcon
        height={cloud.svgHeight}
        name={cloud.id}
        width={cloud.svgWidth} />) : cloud.title;
    },

    /**
      Generate a change cloud action if a cloud has been selected.

      @method _generateAction
      @returns {Array} The list of actions.
    */
    _generateAction: function() {
      if (!this.props.cloud) {
        return;
      }
      return [{
        action: this.props.setCloud.bind(null, null),
        disabled: this.props.acl.isReadOnly(),
        title: 'Change cloud',
        type: 'neutral'
      }];
    },

    render: function() {
      var cloud = this.props.cloud;
      return (
        <juju.components.DeploymentSection
          buttons={this._generateAction()}
          completed={!!cloud}
          disabled={false}
          instance="deployment-cloud"
          showCheck={true}
          title={cloud ? 'Chosen cloud' : 'Choose cloud to deploy to'}>
          {this._generateClouds()}
          {this._generateCloud()}
        </juju.components.DeploymentSection>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-section',
    'svg-icon'
  ]
});
