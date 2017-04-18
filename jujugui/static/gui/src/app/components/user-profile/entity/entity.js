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
    displayName: 'UserProfileEntity',

    propTypes: {
      acl: React.PropTypes.object,
      changeState: React.PropTypes.func,
      children: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.array
      ]),
      d3: React.PropTypes.object,
      displayConfirmation: React.PropTypes.func,
      entity: React.PropTypes.object.isRequired,
      expanded: React.PropTypes.bool,
      getDiagramURL: React.PropTypes.func,
      getKpiMetrics: React.PropTypes.func,
      permission: React.PropTypes.string,
      switchModel: React.PropTypes.func,
      type: React.PropTypes.string.isRequired
    },

    /**
      Set initial state for KPI metrics
    */
    getInitialState: function() {
      return {
        hasMetrics: false,
        kpiVisible: false,
        metrics: [],
        metricTypes: []
      };
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
        <div className="twelve-col last-col">
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
        <div className="twelve-col last-col">
          Composed of:
          <ul className="user-profile__entity-service-list">
            {services}
          </ul>
        </div>);
    },

    /**
      Generate the credentials for a model.

      @method _generateCredentials
      @return {Object} The credential markup.
    */
    _generateModelInfo: function() {
      if (this.props.type !== 'model') {
        return null;
      }
      const model = this.props.entity;
      // See the _generateRow function in model-list.js for matching logic.
      // Both sections should be kept roughly in sync.
      const region = model.region || 'no region';
      let owner = '--';
      if (model.owner) {
        owner = model.owner.split('@')[0];
      }
      // The main different between this and model-list.js is that we display
      // the credentials used here in place of the model name, as the model
      // name is displayed elsewhere in the expanded row.
      return (
        <div className="modelInfo">
          <div className="prepend-two two-col">
            {owner}
          </div>
          <div className="two-col">
            {model.numMachines}
          </div>
          <div className="two-col">
            {model.cloud + '/' + region}
          </div>
          <div className="two-col">
            {this.props.permission}
          </div>
          <div className="two-col last-col">
            <juju.components.DateDisplay
              date={model.lastConnection || '--'}
              relative={true} />
          </div>
        </div>
      );
    },

    /**
      Generate and return the destroy button if the user is allowed to destroy
      the given model.

      @param {Object} model A model object as returned by the controller
        listModelsWithInfo API call.
      @return {Object} The react button node.
    */
    _generateDestroyButton: function(model) {
      const props = this.props;
      if (model.isController) {
        // Do not allow destroying the controller model.
        return null;
      }
      if (!props.acl) {
        // This should never happen.
        console.warn('acl object not available while listing models');
        return null;
      }
      if (!props.acl.canRemoveModel(model)) {
        // The user has not enough access to destroy a model.
        return null;
      }
      return (
        <juju.components.GenericButton
          action={props.displayConfirmation}
          type="inline-base"
          title="Destroy model"
        />
      );
    },

    /**
      Retrieve metrics from the plans service.

      @method _getMetrics
      @param {Object} filters Additional filters to add to the metrics query.
    */
    _getMetrics: function(filters) {
      if (this.state.hasMetrics) {
        return;
      }
      // TODO filters such as summary-interval and start/end dates
      // can be passed in here, but will need UX first.
      // Makyo - 2017-03-10
      this.props.getKpiMetrics(
          // XXX Metrics are not fully implemented in Omnibus yet. Until they
          // are, a dummy charm is used. The correct implementation is
          // commented out below, with the dummy charm in its place.
          // To QA, uncomment the following line and comment out the line
          // after that.
          // Makyo - 2017-03-17
          //'cs:~canonical/jimm-0',
          this.props.entity.id,
          filters,
          (error, charmMetrics) => {
            if (error) {
              // TODO When there are designs for showing errors for metrics,
              // we'll be able to implement them here.
              // Makyo - 2017-04-13
              console.error(error);
              return;
            }
            this.setState({
              hasMetrics: false,
              metrics: {},
              metricTypes: []
            });
            if (charmMetrics.length > 0) {
              let metrics = [];
              let metricTypes = this.state.metricTypes;
              charmMetrics.forEach((item) => {
                // refrain from adding duplicatae types to metricTypes
                if (metricTypes.indexOf(item.Metric) === -1) {
                  metricTypes.push(item.Metric);
                }
                metrics.push(item);
              });
              this.setState({
                hasMetrics: true,
                metrics: metrics,
                metricTypes: metricTypes
              });
            }
          });
    },

    /**
      Show the metrics component, gated on state.
    */
    _showMetrics: function() {
      return (
        <juju.components.UserProfileEntityKPI
          charmId={this.props.entity.id}
          d3={this.props.d3}
          metrics={this.state.metrics}
          metricTypes={this.state.metricTypes} />);
    },

    /**
      Set state to make KPI metrics visible/not visible.
    */
    _toggleKpiVisibility: function() {
      this.setState({
        kpiVisible: !this.state.kpiVisible
      });
    },

    /**
      For charms, generate a button for showing/hiding the metrics component.
    */
    _generateMetrics: function() {
      if (this.props.type === 'charm') {
        return (
          <div>
            <juju.components.GenericButton
              title={this.state.kpiMetrics ? 
                'Hide KPI Metrics' : 'Show KPI Metrics'}
              action={this._toggleKpiVisibility} />
            {this.state.kpiVisible ? this._showMetrics() : undefined}
          </div>
        );
      }
    },

    render: function() {
      const props = this.props;
      const entity = props.entity;
      const type = props.type;
      const isModel = type === 'model';
      const isCharm = type === 'charm';
      // Model names will be in the format "username/model-name" so we have to
      // extract the part we need.
      let title = (
        <div className="entity-title">
          <span className="entity-title__name">
            {entity.name}
          </span>
        </div>
      );
      let buttonAction;
      let destroyButton = null;
      if (isModel) {
        let name = entity.name;
        if (name.indexOf('/') !== -1) {
          name = name.split('/')[1];
        }
        title = (
          <div className="entity-title">
            <span className="entity-title__name">
              {name}
            </span>
            <span className="entity-title__credential">
              {entity.credentialName}
            </span>
          </div>
        );
        buttonAction = this._switchModel.bind(this, {
          id: entity.uuid,
          name: name,
          owner: entity.owner
        });
        destroyButton = this._generateDestroyButton(entity);
      } else {
        if (isCharm) {
          this._getMetrics();
        }
        buttonAction = this._viewEntity.bind(this, entity.id);
      }
      const icon = isCharm ? (
        <img className="user-profile__entity-icon"
          src={entity.icon}
          title={entity.name} />) : undefined;
      const classes = {
        'user-profile__entity': true,
        'user-profile__list-row': true
      };
      return (
        <juju.components.ExpandingRow classes={classes}
          key={entity.id}
          expanded={props.expanded}>
          {props.children}
          <div>
            <div className="expanding-row__expanded-header twelve-col">
              <div className="six-col no-margin-bottom">
                {icon}{title}
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
              {this._generateModelInfo()}
              {this._generateDiagram()}
              {this._generateDescription()}
              {this._generateTags()}
              {this._generateCommits()}
              {this.state.hasMetrics ? this._generateMetrics() : ''}
            </div>
          </div>
        </juju.components.ExpandingRow>);
    }
  });

}, '', {
  requires: [
    'date-display',
    'expanding-row',
    'generic-button',
    'user-profile-entity-kpi'
  ]
});
