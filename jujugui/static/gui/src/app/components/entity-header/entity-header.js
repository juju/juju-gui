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
      Show the search results for a tag when clicked.

      @method _handleTagClick
      @param {Object} e The click event
    */
    _handleTagClick: function(e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            tags: e.target.getAttribute('data-id')
          }
        }
      });
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
        this.props.getBundleYAML(id, this._getBundleYAMLSuccess,
            this._getBundleYAMLFailure);
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
      Callback for successfully getting the bundle YAML.

      @method _closeEntityDetails
      @param {String} yaml The yaml for the bundle
    */
    _getBundleYAMLSuccess: function(yaml) {
      this.props.importBundleYAML(yaml);
      this._closeEntityDetails();
    },

    /**
      Callback for failing to get the bundle YAML.

      @method _closeEntityDetails
      @param {String} yaml The yaml for the bundle
    */
    _getBundleYAMLFailure: function() {
      //XXX: Need to figure out what to do if there's a failure.
    },

    render: function() {
      var entity = this.props.entityModel.toEntity(),
          tags = entity.tags || [],
          revisions = entity.revisions || [];
      tags = tags.map(function(tag) {
        return (
          <li key={tag} className="tag-list__item">
            <a
              data-id={tag}
              onClick={this._handleTagClick}
              ref="tagListItem">
              {tag}
            </a>
          </li>
        );
      }, this);
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
                <div className="entity-header__details">
                  <h1
                    className="entity-header__title"
                    itemProp="name"
                    ref="entityHeaderTitle">
                    {entity.displayName}
                  </h1>
                  <p className="entity-header__by">
                    By <a
                          href={ownerUrl}
                          target="_blank"
                          ref="entityHeaderBy">{entity.owner}</a>
                  </p>
                  <ul className="bullets inline">
                    <li className="revisions-item">
                      <a href="#revisions" className="revisions-link">
                        {revisions.length}
                        {' '}
                        {this.props.pluralize('revision', revisions.length)}
                      </a>
                    </li>
                    {series}
                  </ul>
                </div>
                <ul className="tag-list">{tags}</ul>
              </div>
              <div className="four-col last-col no-margin-bottom">
                <ul className="no-bullets bundle-stats">
                  <li className="bundle-stats__deploys">
                    <span
                      className="bundle-stats__deploys-count"
                      ref="bundleDeploysCount">
                      {entity.downloads}
                    </span>
                    {' '}
                    {this.props.pluralize('deploy', entity.downloads)}
                  </li>
                </ul>
                <juju.components.GenericButton
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
  requires: []
});
