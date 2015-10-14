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

YUI.add('entity-details', function() {

  juju.components.EntityDetails = React.createClass({
    /**
      Callback for when an entity has been successfully fetched. Though the
      data passed in is an Array of models, only the first model is used.

      @method fetchSuccess
      @param {Array} models A list of the entity models found.
    */
    fetchSuccess: function(models) {
      this.setState({waitingForFetch: false});
      if (models.length > 0) {
        this.setState({entityModel: models[0]});
      }
    },

    /**
      Callback for when an error occurs while fetching an entity.

      @method fetchFailure
      @param {Object} response The failure response.
    */
    fetchFailure: function(response) {
      // XXX Implement error handling.
      console.error('Fetching the entity failed.');
    },

    /**
      Retrieve, or fetch, an entity based on ID.

      @method fetchFailure
      @param {String} id the entity ID to locate
    */
    fetchEntity: function(id) {
      this.setState({waitingForFetch: true});
      this.props.getEntity(
        id,
        this.fetchSuccess,
        this.fetchFailure
      );
    },

    /**
      Determine whether an entity needs to be fetched; we only need to query
      when we either don't have an entity, or the entity's ID has changed.

      @method shouldRefetch
      @param {Object} nextProps the next set of properties
    */
    shouldRefetch: function(nextProps) {
      var entityModel = this.state.entityModel;
      return !entityModel || nextProps.id !== entityModel.get('id');
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
      this.props.deployService(this.state.entityModel);
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: null
        }
      });
    },

    getInitialState: function() {
      return {
        entityModel: null,
        waitingForFetch: false
      };
    },

    componentDidMount: function() {
      this.fetchEntity(this.props.id);
    },

    componentWillReceiveProps: function(nextProps) {
      if (this.shouldRefetch(nextProps)) {
        this.fetchEntity(nextProps.id);
      }
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      return this.shouldRefetch(nextProps) && !this.state.waitingForFetch;
    },

    render: function() {
      var entityModel = this.state.entityModel;
      if (!entityModel) {
        return (
          <div className="spinner-loader">Loading...</div>
        );
      }
      var entity = entityModel.toEntity(),
          tags = entity.tags || [],
          revisions = entity.revisions || [];
      tags = tags.map(function(tag) {
        return(
          <li key={tag} className="tag-list__item">
            <a data-id={tag} onClick={this._handleTagClick}>
              {tag}
            </a>
          </li>
        );
      }, this);
      var ownerUrl = 'https://launchpad.net/~' + entity.owner;
      return (
        <div className={'entity-details ' + entity.type}>
          <div className="row-hero">
            <header className="twelve-col header">
              <div className="inner-wrapper">
                <div className="eight-col no-margin-bottom">
                  <img src={entity.iconPath} alt="{entity.displayName}"
                       width="96" className="header__icon"/>
                  <div className="header__details">
                    <h1 className="header__title" itemProp="name">
                      {entity.displayName}
                    </h1>
                    <p className="header__by">
                      By <a href={ownerUrl} target="_blank">{entity.owner}</a>
                    </p>
                    <ul className="bullets inline">
                      <li className="revisions-item">
                        <a href="#revisions" className="revisions-link">
                          {revisions.length}
                          {this.props.pluralize('revision', revisions.length)}
                        </a>
                      </li>
                      <li className="header__series">{entity.series}</li>
                    </ul>
                  </div>
                  <ul className="tag-list">{tags}</ul>
                </div>
                <div className="four-col last-col no-margin-bottom">
                  <ul className="no-bullets bundle-stats">
                    <li className="bundle-stats__deploys">
                      <span className="bundle-stats__deploys-count">
                        {entity.downloads}
                      </span>
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
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});
