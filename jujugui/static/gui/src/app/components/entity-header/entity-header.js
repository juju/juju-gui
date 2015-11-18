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

YUI.add('entity-header', function() {

  juju.components.EntityHeader = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      deployService: React.PropTypes.func.isRequired,
      entityModel: React.PropTypes.object.isRequired,
      pluralize: React.PropTypes.func.isRequired
    },

    /**
      Add a service for this charm to the canvas.

      @method _handleDeployClick
      @param {Object} e The click event
    */
    _handleDeployClick: function(e) {
      var entityModel = this.props.entityModel;
      var entity = entityModel.toEntity();
      if (entity.type === 'charm') {
        this.props.deployService(entityModel);
        this._closeEntityDetails();
      } else {
        var id = entity.id.replace('cs:', '');
        this.props.getBundleYAML(id, this._getBundleYAMLCallback);
      }
    },

    /**
      Close the entity details

      @method _closeEntityDetails
    */
    _closeEntityDetails: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: null
        }
      });
    },

    /**
      Callback for getting the bundle YAML.

      @method _closeEntityDetails
      @param {String} error The error, if any. Null if no error.
      @param {String} yaml The yaml for the bundle
    */
    _getBundleYAMLCallback: function(error, yaml) {
      if (error) {
        console.error(error); 
      }
      this.props.importBundleYAML(yaml);
      this._closeEntityDetails();
    },

    render: function() {
      var entity = this.props.entityModel.toEntity();
      var ownerUrl = 'https://launchpad.net/~' + entity.owner;
      var series = entity.series ?
        <li className="entity-header__series">{entity.series}</li> :
        '';
      return (
        <div className="row-hero">
          <header className="twelve-col entity-header">
            <div className="inner-wrapper">
              <div className="eight-col no-margin-bottom">
                <img src={entity.iconPath} alt={entity.displayName}
                     width="96" className="entity-header__icon"/>
                <h1
                  className="entity-header__title"
                  itemProp="name"
                  ref="entityHeaderTitle">
                  {entity.displayName}
                </h1>
                <ul className="bullets inline">
                  <li className="entity-header__by">
                    By <a href={ownerUrl} target="_blank"
                          ref="entityHeaderBy">{entity.owner}</a>
                  </li>
                  <li className="entity-header__deploys">
                    <span
                      className="entity-header__deploys-count"
                      ref="bundleDeploysCount">
                      {entity.downloads}
                    </span>
                    {' '}
                    {this.props.pluralize('deploy', entity.downloads)}
                  </li>
                  {series}
                </ul>
              </div>
              <div className="four-col last-col no-margin-bottom">
                <juju.components.CopyToClipboard
                  value={'juju deploy ' + entity.id} />
                <juju.components.GenericButton
                  ref="deployButton"
                  action={this._handleDeployClick}
                  type="confirm"
                  title="Add to canvas" />
              </div>
            </div>
          </header>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'copy-to-clipboard',
    'generic-button'
  ]
});
