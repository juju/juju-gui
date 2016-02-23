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
      entity: React.PropTypes.object.isRequired,
      getDiagramURL: React.PropTypes.func,
      switchEnv: React.PropTypes.func,
      type: React.PropTypes.string.isRequired
    },

    /**
      Generate the initial state for the component.

      @method getInitialState
    */
    getInitialState: function() {
      return {
        expanded: false
      };
    },

    /**
      Generate the base class names for the component.

      @method _generateClasses
      @returns {Object} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'user-profile__entity',
        'user-profile__list-row',
        'twelve-col',
        {
          'user-profile__entity--expanded': this.state.expanded
        });
    },

    /**
      Calls to switch the env to the one the user clicked on.

      @method _switchEnv
      @param {String} uuid The model uuid.
      @param {String} name The model name.
      @param {Object} e The click event.
    */
    _switchEnv: function(uuid, name, e) {
      this.props.switchEnv(uuid, name);
    },

    /**
      Navigate to the entity details.

      @method _viewEntity
      @param {Object} e The click event.
      @param {String} id The entity id.
    */
    _viewEntity: function(id, e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: id
          }
        }
      });
    },

    /**
      Toggle between the summary and details.

      @method _toggle
    */
    _toggle: function() {
      this.setState({expanded: !this.state.expanded});
    },

    /**
      Handle clicks on tags.

      @method _handleTagClick
      @param {Object} e The event.
      @param {String} tag The tag to view.
    */
    _handleTagClick: function(tag, e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            tags: tag
          }
        }
      });
    },

    /**
      Generate a list of tags.

      @method _generateTags
      @returns {Object} A list of tag components.
    */
    _generateTags: function() {
      var tags = [];
      var entity = this.props.entity;
      var tagList = entity.tags;
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
      var commits = [];
      var entity = this.props.entity;
      var commitList = entity.commits;
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
      var url = this.props.getDiagramURL(this.props.entity.id);
      return (
        <div className="user-profile__entity-diagram twelve-col">
          <object type="image/svg+xml" data={url}
            className="entity-content__diagram-image" />
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
      Generate the charms for a bundle.

      @method _generateCharms
      @return {Object} The charms component.
    */
    _generateCharms: function() {
      if (this.props.type !== 'bundle') {
        return;
      }
      var entity = this.props.entity;
      var charms = [];
      entity.charms.forEach((charm) => {
        var name = charm.name;
        charms.push(
          <li className="user-profile__comma-item"
            key={entity.id + '-charm-' + name}>
            {name}
          </li>);
      });
      return (
        <div className="nine-col">
          Composed of:
          <ul className="user-profile__entity-charm-list">
            {charms}
          </ul>
        </div>);
    },

    render: function() {
      var props = this.props;
      var entity = props.entity;
      var type = props.type;
      var isModel = type === 'model';
      var isCharm = type === 'charm';
      var id = isModel ? entity.uuid : entity.id;
      var buttonAction = isModel ? this._switchEnv.bind(
        this, id, entity.name) : this._viewEntity.bind(this, id);
      var icon = isCharm ? (
        <img className="user-profile__entity-icon"
          src={entity.icon}
          title={entity.name} />) : undefined;
      return (
        <li className={this._generateClasses()}
          onClick={this._toggle}>
          <div className={
            'user-profile__entity-summary twelve-col no-margin-bottom'}>
            {this.props.children}
          </div>
          <div className="user-profile__entity-details twelve-col">
            <div className="user-profile__entity-details-header twelve-col">
              <div className="ten-col no-margin-bottom">
                {icon}{entity.name}
              </div>
              <div className={'user-profile__entity-details-header-action ' +
                'two-col last-col no-margin-bottom'}>
                <juju.components.GenericButton
                  action={buttonAction}
                  title={isModel ? 'Manage' : 'View'} />
              </div>
            </div>
            <div className={'user-profile__entity-details-content twelve-col ' +
              'no-margin-bottom'}>
              {this._generateSeries()}
              {this._generateCharms()}
              <div className="three-col last-col">
                Owner: {entity.owner}
              </div>
              {this._generateDiagram()}
              <div className="two-col">
                Description
              </div>
              <div className="ten-col last-col">
                {entity.description}
              </div>
              {this._generateTags()}
              {this._generateCommits()}
            </div>
          </div>
        </li>);
    }
  });

}, '', {
  requires: [
    'generic-button'
  ]
});
