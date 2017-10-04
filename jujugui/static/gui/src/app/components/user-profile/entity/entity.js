/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const DateDisplay = require('../../date-display/date-display');
const ExpandingRow = require('../../expanding-row/expanding-row');
const GenericButton = require('../../generic-button/generic-button');
const UserProfileEntityKPI = require('../kpi/kpi');

class UserProfileEntity extends React.Component {
  constructor() {
    super();
    this.state = {
      hasMetrics: false,
      kpiVisible: false,
      metrics: [],
      metricTypes: []
    };
  }

  /**
    Calls to switch the env to the one the user clicked on.

    @method _switchModel
    @param {Object} model The model to switch to, with these attributes:
      - name: the model name;
      - id: the model unique identifier;
      - owner: the user owning the model, like "admin" or "who@external".
    @param {Object} evt The click event.
  */
  _switchModel(model, evt) {
    this.props.switchModel(model);
  }

  /**
    Navigate to the entity details.

    @method _viewEntity
    @param {String} id The entity id.
    @param {Object} evt The click event.
  */
  _viewEntity(id, evt) {
    const url = window.jujulib.URL.fromLegacyString(id);
    this.props.changeState({profile: null, store: url.path()});
  }

  /**
    Handle clicks on tags.

    @method _handleTagClick
    @param {Object} e The event.
    @param {String} tag The tag to view.
  */
  _handleTagClick(tag, e) {
    this.props.changeState({
      profile: null,
      search: {
        tags: tag
      }
    });
  }

  /**
    Generate a list of tags.

    @method _generateTags
    @returns {Object} A list of tag components.
  */
  _generateTags() {
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
  }

  /**
    Generate a list of commits.

    @method _generateTags
    @returns {Object} A list of commits.
  */
  _generateCommits() {
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
  }

  /**
    Generate the diagram for a bundle.

    @method _generateDiagram
    @return {Object} The diagram.
  */
  _generateDiagram() {
    if (this.props.type !== 'bundle') {
      return;
    }
    const url = this.props.getDiagramURL(this.props.entity.id);
    return (
      <div className="user-profile__entity-diagram twelve-col">
        <object type="image/svg+xml" data={url}
          className="entity-content__diagram-image" />
      </div>);
  }

  /**
    Generate the description.

    @method _generateDescription
    @return {Object} The description.
  */
  _generateDescription() {
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
  }

  /**
    Generate the series for a charm.

    @method _generateSeries
    @return {Object} The series component.
  */
  _generateSeries() {
    if (this.props.type !== 'charm') {
      return;
    }
    return (
      <div className="twelve-col last-col">
        Series: {this.props.entity.series.join(', ')}
      </div>);
  }

  /**
    Generate the services for a bundle.

    @method _generateServices
    @return {Object} The services component.
  */
  _generateServices() {
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
  }

  /**
    Generate the credentials for a model.

    @method _generateCredentials
    @return {Object} The credential markup.
  */
  _generateModelInfo() {
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
          <DateDisplay
            date={model.lastConnection || '--'}
            relative={true} />
        </div>
      </div>
    );
  }

  /**
    Generate and return the destroy button if the user is allowed to destroy
    the given model.

    @param {Object} model A model object as returned by the controller
      listModelsWithInfo API call.
    @return {Object} The react button node.
  */
  _generateDestroyButton(model) {
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
      <GenericButton
        action={props.displayConfirmation}
        type="inline-neutral">
        Destroy model
      </GenericButton>
    );
  }

  /**
    Retrieve metrics from the plans service.

    @method _getMetrics
    @param {Object} filters Additional filters to add to the metrics query.
  */
  _getMetrics(filters) {
    if (this.state.hasMetrics) {
      return;
    }
    // TODO frankban: metrics are not fully implemented in Omnibus yet.
    // We can remove this "if" block when they are. For now, only this charm
    // seems to work.
    if (this.props.entity.id !== 'cs:~yellow/trusty/uptime-0') {
      return;
    }
    // TODO filters such as summary-interval and start/end dates
    // can be passed in here, but will need UX first.
    // Makyo - 2017-03-10
    this.props.getKpiMetrics(
      this.props.entity.id,
      filters,
      (error, charmMetrics) => {
        if (error) {
          const message = 'unable to retrieve metrics';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          // don't render metrics in case of an error
          this.setState({hasMetrics: false});
          return;
        }
        if (charmMetrics.length > 0) {
          let metrics = [];
          let metricTypes = this.state.metricTypes;
          charmMetrics.forEach(item => {
            // refrain from adding duplicate types to metricTypes
            if (metricTypes.indexOf(item.metric) === -1) {
              metricTypes.push(item.metric);
            }
            metrics.push(item);
          });
          this.setState({
            hasMetrics: true,
            metrics: metrics,
            metricTypes: metricTypes
          });
        } else {
          this.setState({
            hasMetrics: false,
            metrics: {},
            metricTypes: []
          });
        }
      });
  }

  /**
    Show the metrics component, gated on state.

    @return {Object} The KPI chart component
  */
  _showMetrics() {
    return (
      <UserProfileEntityKPI
        d3={this.props.d3}
        metrics={this.state.metrics}
        metricTypes={this.state.metricTypes} />);
  }

  /**
    Set state to make KPI metrics visible/not visible.
  */
  _toggleKpiVisibility() {
    this.setState({
      kpiVisible: !this.state.kpiVisible
    });
  }

  /**
    For charms, generate a button for showing/hiding the metrics component.

    @return {Object} Depending on whether or not there are metrics, either
      a button which, when clicked, displays the KPI chart, or undefined.
  */
  _generateMetrics() {
    if (!this.state.hasMetrics) {
      return;
    }
    if (this.props.type === 'charm') {
      return (
        <div>
          <GenericButton
            action={this._toggleKpiVisibility.bind(this)}>
            {this.state.kpiMetrics ? 'Hide KPI Metrics' : 'Show KPI Metrics'}
          </GenericButton>
          {this.state.kpiVisible ? this._showMetrics() : undefined}
        </div>
      );
    }
  }

  componentDidMount() {
    if (this.props.type === 'charm') {
      this._getMetrics();
    }
  }

  render() {
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
      <ExpandingRow classes={classes}
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
              <GenericButton
                action={buttonAction}
                type="inline-neutral">
                {isModel ? 'Manage' : 'View'}
              </GenericButton>
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
            {this._generateMetrics()}
          </div>
        </div>
      </ExpandingRow>);
  }
};

UserProfileEntity.propTypes = {
  acl: PropTypes.object,
  addNotification: PropTypes.func,
  changeState: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  d3: PropTypes.object,
  displayConfirmation: PropTypes.func,
  entity: PropTypes.object.isRequired,
  expanded: PropTypes.bool,
  getDiagramURL: PropTypes.func,
  getKpiMetrics: PropTypes.func,
  permission: PropTypes.string,
  switchModel: PropTypes.func,
  type: PropTypes.string.isRequired
};

module.exports = UserProfileEntity;
