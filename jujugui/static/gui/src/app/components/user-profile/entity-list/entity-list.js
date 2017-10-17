/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../spinner/spinner');
const UserProfileEntity = require('../entity/entity');

class UserProfileEntityList extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      loadingEntities: false
    };
  }

  componentWillMount() {
    if (this.props.user) {
      this._fetchEntities(this.props);
    }
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    // Compare next and previous charmstore users in a data-safe manner.
    if (props.user !== nextProps.user) {
      this._fetchEntities(nextProps);
    }
  }

  /**
    Requests a list from charmstore of the user's entities.

    @method _fetchEntities
    @param {Object} props the component properties to use.
  */
  _fetchEntities(props) {
    const charmstore = props.charmstore;
    if (charmstore && charmstore.list && props.user) {
      const callback = this._fetchEntitiesCallback.bind(this);
      // Delay the call until after the state change to prevent race
      // conditions.
      this.setState({loadingEntities: true}, () => {
        const xhr = charmstore.list(props.user, callback, props.type);
        this.xhrs.push(xhr);
      });
    }
  }

  /**
    Callback for the request to list a user's entities.

    @method _fetchEntitiesCallback
    @param {String} error The error from the request, or null.
    @param {Object} data The data from the request.
  */
  _fetchEntitiesCallback(error, data) {
    this.setState({loadingEntities: false}, () => {
      if (error) {
        const message = `Cannot retrieve ${this.props.type}s`;
        console.error(message, error);
        this.props.addNotification({
          title: message,
          message: `${message}: ${error}`,
          level: 'error'
        });
        return;
      }
      this.props.setEntities(data || []);
    });
  }

  /**
    Generate a list of tags.

    @method _generateTags
    @param {Array} tagList A list of tags.
    @param {String} id The id of the entity.
    @returns {Object} A list of tag components.
  */
  _generateTags(tagList, id) {
    if (!tagList) {
      return;
    }
    const tags = [];
    tagList.forEach((tag) => {
      tags.push(
        <li className="user-profile__comma-item"
          key={id + '-' + tag}>
          {tag}
        </li>);
    });
    return (
      <ul className="user-profile__list-tags">
        {tags}
      </ul>);
  }

  /**
    Generate a list of series.

    @method _generateSeries
    @param {Array} series A list of series.
    @param {String} id The id of the entity.
    @returns {Object} A list of series components.
  */
  _generateSeries(series, id) {
    if (!series) {
      return;
    }
    const listItems = [];
    series.forEach((release) => {
      listItems.push(
        <li className="user-profile__comma-item"
          key={id + '-' + release}>
          {release}
        </li>);
    });
    return (
      <ul className="user-profile__list-series">
        {listItems}
      </ul>);
  }

  /**
    Construct the URL for a service icon.

    @method _getIcon
    @param {String} id The service ID.
    @returns {String} The icon URL.
  */
  _getIcon(id) {
    if (!id) {
      return;
    }
    const cs = this.props.charmstore;
    const path = id.replace('cs:', '');
    return `${cs.url}/${path}/icon.svg`;
  }

  /**
    Generate the details for the provided bundle.

    @method _generateBundleRow
    @param {Object} bundle A bundle object.
    @returns {Array} The markup for the row.
  */
  _generateBundleRow(bundle) {
    const id = bundle.id;
    const services = [];
    const applications = bundle.applications || bundle.services || {};
    const serviceNames = Object.keys(applications);
    serviceNames.forEach((serviceName, idx) => {
      const service = applications[serviceName];
      const id = service.charm;
      const key = `icon-${idx}-${id}`;
      services.push(
        <img className="user-profile__list-icon"
          key={key}
          src={this._getIcon(id)}
          title={service.charm} />);
    });
    const unitCount = bundle.unitCount || <span>&nbsp;</span>;
    return (
      <UserProfileEntity
        addNotification={this.props.addNotification}
        changeState={this.props.changeState}
        entity={bundle}
        getDiagramURL={this.props.getDiagramURL}
        key={id}
        type="bundle">
        <span className={'user-profile__list-col five-col ' +
          'user-profile__list-name'}>
          {bundle.name}
          {this._generateTags(bundle.tags, id)}
        </span>
        <span className={'user-profile__list-col three-col ' +
          'user-profile__list-icons'}>
          {services}
        </span>
        <span className={'user-profile__list-col three-col prepend-one ' +
          'last-col'}>
          {unitCount}
        </span>
      </UserProfileEntity>);
  }

  /**
    Generate the header for the bundles.

    @method _generateBundleHeader
    @returns {Array} The markup for the header.
  */
  _generateBundleHeader() {
    return (
      <li className="user-profile__list-header twelve-col">
        <span className="user-profile__list-col five-col">
          Name
        </span>
        <span className={'user-profile__list-col three-col ' +
          'user-profile__list-icons'}>
          Charms
        </span>
        <span className={'user-profile__list-col three-col prepend-one ' +
          'last-col'}>
          Units
        </span>
      </li>);
  }

  /**
    Generate the details for the provided charm.

    @method _generateCharmRow
    @param {Object} charm A charm object.
    @returns {Array} The markup for the row.
  */
  _generateCharmRow(charm) {
    const id = charm.id;
    // Ensure the icon is set.
    charm.icon = charm.icon || this._getIcon(id);
    return (
      <UserProfileEntity
        addNotification={this.props.addNotification}
        changeState={this.props.changeState}
        d3={this.props.d3}
        entity={charm}
        key={id}
        getKpiMetrics={this.props.getKpiMetrics}
        type="charm">
        <span className={'user-profile__list-col five-col ' +
          'user-profile__list-name'}>
          {charm.name}
          {this._generateTags(charm.tags, id)}
        </span>
        <span className={'user-profile__list-col three-col ' +
          'user-profile__list-icons'}>
          <img className="user-profile__list-icon"
            src={charm.icon}
            title={charm.name} />
        </span>
        <span className={'user-profile__list-col prepend-one three-col ' +
          'last-col'}>
          {this._generateSeries(charm.series, id)}
        </span>
      </UserProfileEntity>);
  }

  /**
    Generate the header for the charms.

    @method _generateCharmHeader
    @returns {Array} The markup for the header.
  */
  _generateCharmHeader() {
    return (
      <li className="user-profile__list-header twelve-col">
        <span className="user-profile__list-col eight-col">
          Name
        </span>
        <span className={'user-profile__list-col prepend-one three-col ' +
          'last-col'}>
          Series
        </span>
      </li>);
  }

  render() {
    const type = this.props.type;
    const classes = classNames(
      `user-profile__${type}-list`,
      { 'twelve-col': this.state.loadingEntities }
    );
    if (this.state.loadingEntities) {
      return (
        <div className={classes}>
          <Spinner />
        </div>
      );
    }
    const list = this.props.entities;
    if (!list || list.length === 0) {
      return null;
    }
    let generateRow,
        header,
        title;
    if (type === 'bundle') {
      generateRow = this._generateBundleRow.bind(this);
      header = this._generateBundleHeader();
      title = 'Bundles';
    } else if (type === 'charm') {
      generateRow = this._generateCharmRow.bind(this);
      header = this._generateCharmHeader();
      title = 'Charms';
    }
    const rows = list.map(generateRow);
    return (
      <div className={classes}>
        <div className="user-profile__header twelve-col no-margin-bottom">
          {title}
          <span className="user-profile__size">
            ({list.length})
          </span>
        </div>
        <ul className="user-profile__list twelve-col">
          {header}
          {rows}
        </ul>
      </div>
    );
  }

};

UserProfileEntityList.propTypes = {
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: PropTypes.object.isRequired,
  d3: PropTypes.object,
  entities: PropTypes.array,
  getDiagramURL: PropTypes.func.isRequired,
  getKpiMetrics: PropTypes.func,
  setEntities: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  user: PropTypes.string
};

module.exports = UserProfileEntityList;
