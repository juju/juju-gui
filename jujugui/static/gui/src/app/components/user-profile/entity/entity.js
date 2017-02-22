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

YUI.add('user-profile-entity', function() {

  juju.components.UserProfileEntity = React.createClass({

    propTypes: {
      changeState: React.PropTypes.func,
      children: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.array
      ]),
      displayConfirmation: React.PropTypes.func,
      entity: React.PropTypes.object.isRequired,
      expanded: React.PropTypes.bool,
      getDiagramURL: React.PropTypes.func,
      switchModel: React.PropTypes.func,
      type: React.PropTypes.string.isRequired
    },

    /**
      Calls to switch the env to the one the user clicked on.

      @method _switchModel
      @param {Object} model The model to switch to, with these attributes:
        - name: the model name;
        - id: the model unique identifier;
        - owner: the user owning the model, like "admin" or "who@external".
      @param {Object} evt The click event.
    */
    _switchModel: function(model, evt) {
      this.props.switchModel(model);
    },

    /**
      Navigate to the entity details.

      @method _viewEntity
      @param {String} id The entity id.
      @param {Object} evt The click event.
    */
    _viewEntity: function(id, evt) {
      const url = window.jujulib.URL.fromLegacyString(id);
      this.props.changeState({profile: null, store: url.path()});
    },

    /**
      Handle clicks on tags.

      @method _handleTagClick
      @param {Object} e The event.
      @param {String} tag The tag to view.
    */
    _handleTagClick: function(tag, e) {
      this.props.changeState({
        profile: null,
        search: {
          tags: tag
        }
      });
    },

    /**
      Generate a list of tags.

      @method _generateTags
      @returns {Object} A list of tag components.
    */
    _generateTags: function() {
      const tags = [];
      const entity = this.props.entity;
      const tagList = entity.tags;
      if (!tagList) {
        return;
      }
      tagList.forEach((tag) => {
        tags.push(
          <li className="user-profile__comma-item link"
            key={entity.id + '-' + tag}
            onClick={this._handleTagClick.bind(this, tag)}
            role="button"
            tabIndex="0">
            {tag}
          </li>);
      });
      return (
        <div className="twelve-col no-margin-bottom">
          <div className="two-col">
            Tags
          </div>
          <ul className="ten-col last-col">
            {tags}
          </ul>
        </div>);
    },

    /**
      Generate a list of commits.

      @method _generateTags
      @returns {Object} A list of commits.
    */
    _generateCommits: function() {
      const commits = [];
      const entity = this.props.entity;
      const commitList = entity.commits;
      if (!commitList) {
        return;
      }
      commitList.forEach((commit) => {
        commits.push(
          <li key={entity.id + '-' + commit.id}>
            <div className="seven-col">
              {commit.description}
            </div>
            <div className="three-col">
              {commit.time}
            </div>
            <div className="two-col last-col">
              {commit.author}
            </div>
          </li>);
      });
      return (
        <div className={
          'user-profile__entity-commits twelve-col no-margin-bottom'}>
          <div className="twelve-col">
            Latest commits
            <span className="user-profile__size">
              ({commitList.length} commits)
            </span>
          </div>
          <ul className={
            'user-profile__entity-commit-list twelve-col no-margin-bottom'}>
            {commits}
          </ul>
        </div>);
    },

    /**
      Generate the diagram for a bundle.

      @method _generateDiagram
      @return {Object} The diagram.
    */
    _generateDiagram: function() {
      if (this.props.type !== 'bundle') {
        return;
      }
      const url = this.props.getDiagramURL(this.props.entity.id);
      return (
        <div className="user-profile__entity-diagram twelve-col">
          <object type="image/svg+xml" data={url}
            className="entity-content__diagram-image" />
        </div>);
    },

    /**
      Generate the description.

      @method _generateDescription
      @return {Object} The description.
    */
    _generateDescription: function() {
      const description = this.props.entity.description;
      if (!description) {
        return;
      }
      return (
        <div className="twelve-col no-margin-bottom">
          <div className="two-col">
            Description
          </div>
          <div className="ten-col last-col">
            {description}
          </div>
        </div>);
    },

    /**
      Generate the series for a charm.

      @method _generateSeries
      @return {Object} The series component.
    */
    _generateSeries: function() {
      if (this.props.type !== 'charm') {
        return;
      }
      return (
        <div className="nine-col">
          Series: {this.props.entity.series}
        </div>);
    },

    /**
      Generate the services for a bundle.

      @method _generateServices
      @return {Object} The services component.
    */
    _generateServices: function() {
      if (this.props.type !== 'bundle') {
        return;
      }
      const entity = this.props.entity;
      const services = [];
      const applications = entity.applications || entity.services || {};
      Object.keys(applications).forEach((name) => {
        services.push(
          <li className="user-profile__comma-item"
            key={entity.id + '-service-' + name}>
            {name}
          </li>);
      });
      return (
        <div className="nine-col">
          Composed of:
          <ul className="user-profile__entity-service-list">
            {services}
          </ul>
        </div>);
    },

    render: function() {
      const props = this.props;
      const entity = props.entity;
      const type = props.type;
      const isModel = type === 'model';
      const isCharm = type === 'charm';
      // Model names will be in the format "username/model-name" so we have to
      // extract the part we need.
      let name = entity.name;
      let buttonAction;
      if (isModel) {
        if (entity.name.indexOf('/') !== -1) {
          name = name.split('/')[1];
        }
        buttonAction = this._switchModel.bind(this, {
          id: entity.uuid,
          name: name,
          owner: entity.owner
        });
      } else {
        buttonAction = this._viewEntity.bind(this, entity.id);
      }
      const icon = isCharm ? (
        <img className="user-profile__entity-icon"
          src={entity.icon}
          title={name} />) : undefined;
      const classes = {
        'user-profile__entity': true,
        'user-profile__list-row': true
      };
      const destroyButton = isModel && !entity.isController ? (
        <juju.components.GenericButton
          action={props.displayConfirmation}
          type="inline-base"
          title="Destroy model" />) : undefined;
      return (
        <juju.components.ExpandingRow classes={classes}
          expanded={props.expanded}>
          {props.children}
          <div>
            <div className="expanding-row__expanded-header twelve-col">
              <div className="six-col no-margin-bottom">
                {icon}{name}
              </div>
              <div className={'expanding-row__expanded-header-action ' +
                'six-col last-col no-margin-bottom'}>
                {destroyButton}
                <juju.components.GenericButton
                  action={buttonAction}
                  type="inline-neutral"
                  title={isModel ? 'Manage' : 'View'} />
              </div>
            </div>
            <div className={'expanding-row__expanded-content twelve-col ' +
              'no-margin-bottom'}>
              {this._generateSeries()}
              {this._generateServices()}
              <div className="three-col last-col">
                Owner: {entity.owner}
              </div>
              {this._generateDiagram()}
              {this._generateDescription()}
              {this._generateTags()}
              {this._generateCommits()}
            </div>
          </div>
        </juju.components.ExpandingRow>);
    }
  });

}, '', {
  requires: [
    'expanding-row',
    'generic-button'
  ]
});
