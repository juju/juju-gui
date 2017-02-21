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

YUI.add('user-profile-entity-list', function() {

  juju.components.UserProfileEntityList = React.createClass({
    // broadcastStatus is necessary for communicating loading status back to
    // the parent SectionLoadWatcher.
    propTypes: {
      broadcastStatus: React.PropTypes.func,
      changeState: React.PropTypes.func.isRequired,
      charmstore: React.PropTypes.object.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      type: React.PropTypes.string.isRequired,
      user: React.PropTypes.string,
    },

    getInitialState: function() {
      this.xhrs = [];

      return {
        entityList: [],
        loadingEntities: false,
      };
    },

    getDefaultProps: function() {
      // Just in case broadcastStatus isn't passed in (e.g., in tests), calls
      // to it should not fail, so default to an empty function.
      return {
        broadcastStatus: function() {}
      };
    },

    componentWillMount: function() {
      if (this.props.user) {
        this._fetchEntities(this.props);
      }
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    componentWillReceiveProps: function(nextProps) {
      const props = this.props;
      // Compare next and previous charmstore users in a data-safe manner.
      if (props.user !== nextProps.user) {
        this._fetchEntities(nextProps);
      }
    },

    /**
      Requests a list from charmstore of the user's entities.

      @method _fetchEntities
      @param {Object} props the component properties to use.
    */
    _fetchEntities:  function(props) {
      const charmstore = props.charmstore;
      if (charmstore && charmstore.list && props.user) {
        this.props.broadcastStatus('starting');
        const callback = this._fetchEntitiesCallback;
        // Delay the call until after the state change to prevent race
        // conditions.
        this.setState({loadingEntities: true}, () => {
          const xhr = charmstore.list(props.user, callback, props.type);
          this.xhrs.push(xhr);
        });
      }
    },

    /**
      Callback for the request to list a user's entities.

      @method _fetchEntitiesCallback
      @param {String} error The error from the request, or null.
      @param {Object} data The data from the request.
    */
    _fetchEntitiesCallback: function(error, data) {
      this.setState({loadingEntities: false}, () => {
        const broadcastStatus = this.props.broadcastStatus;
        if (error) {
          broadcastStatus('error');
          console.error('Can not retrieve entities: ', error);
          return;
        }
        if (!data || !data.length || data.length === 0) {
          broadcastStatus('empty');
        } else {
          broadcastStatus('ok');
        }
        this.setState({entityList: data});
      });
    },

    /**
      Generate a list of tags.

      @method _generateTags
      @param {Array} tagList A list of tags.
      @param {String} id The id of the entity.
      @returns {Object} A list of tag components.
    */
    _generateTags: function(tagList, id) {
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
    },

    /**
      Generate a list of series.

      @method _generateSeries
      @param {Array} series A list of series.
      @param {String} id The id of the entity.
      @returns {Object} A list of series components.
    */
    _generateSeries: function(series, id) {
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
    },

    /**
      Construct the URL for a service icon.

      @method _getIcon
      @param {String} id The service ID.
      @returns {String} The icon URL.
    */
    _getIcon: function(id) {
      if (!id) {
        return;
      }
      const cs = this.props.charmstore;
      const path = id.replace('cs:', '');
      return `${cs.url}/${path}/icon.svg`;
    },

    /**
      Generate the details for the provided bundle.

      @method _generateBundleRow
      @param {Object} bundle A bundle object.
      @returns {Array} The markup for the row.
    */
    _generateBundleRow: function(bundle) {
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
        <juju.components.UserProfileEntity
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
          <span className="user-profile__list-col one-col prepend-one">
            {unitCount}
          </span>
          <span className="user-profile__list-col two-col last-col">
            {bundle.owner}
          </span>
        </juju.components.UserProfileEntity>);
    },

    /**
      Generate the header for the bundles.

      @method _generateBundleHeader
      @returns {Array} The markup for the header.
    */
    _generateBundleHeader: function() {
      return (
        <li className="user-profile__list-header twelve-col">
          <span className="user-profile__list-col five-col">
            Name
          </span>
          <span className={'user-profile__list-col three-col ' +
            'user-profile__list-icons'}>
            Charms
          </span>
          <span className="user-profile__list-col one-col prepend-one">
            Units
          </span>
          <span className={
            'user-profile__list-col two-col last-col'}>
            Owner
          </span>
        </li>);
    },

    /**
      Generate the details for the provided charm.

      @method _generateCharmRow
      @param {Object} charm A charm object.
      @returns {Array} The markup for the row.
    */
    _generateCharmRow: function(charm) {
      const id = charm.id;
      // Ensure the icon is set.
      charm.icon = charm.icon || this._getIcon(id);
      return (
        <juju.components.UserProfileEntity
          changeState={this.props.changeState}
          entity={charm}
          key={id}
          type="charm">
          <span className={'user-profile__list-col three-col ' +
            'user-profile__list-name'}>
            {charm.name}
            {this._generateTags(charm.tags, id)}
          </span>
          <span className="user-profile__list-col four-col">
            {this._generateSeries(charm.series, id)}
          </span>
          <span className={'user-profile__list-col one-col ' +
            'user-profile__list-icons'}>
            <img className="user-profile__list-icon"
              src={charm.icon}
              title={charm.name} />
          </span>
          <span className={'user-profile__list-col two-col ' +
            'prepend-two last-col'}>
            {charm.owner}
          </span>
        </juju.components.UserProfileEntity>);
    },

    /**
      Generate the header for the charms.

      @method _generateCharmHeader
      @returns {Array} The markup for the header.
    */
    _generateCharmHeader: function() {
      return (
        <li className="user-profile__list-header twelve-col">
          <span className="user-profile__list-col three-col">
            Name
          </span>
          <span className="user-profile__list-col seven-col">
            Series
          </span>
          <span className="user-profile__list-col two-col last-col">
            Owner
          </span>
        </li>);
    },

    render: function() {
      const type = this.props.type;
      const classes = classNames(
        `user-profile__${type}-list`,
        { 'twelve-col': this.state.loadingEntities }
      );
      if (this.state.loadingEntities) {
        return (
          <div className={classes}>
            <juju.components.Spinner />
          </div>
        );
      }
      const list = this.state.entityList;
      if (!list || list.length === 0) {
        return null;
      }
      let generateRow,
          header,
          title;
      if (type === 'bundle') {
        generateRow = this._generateBundleRow;
        header = this._generateBundleHeader();
        title = 'Bundles';
      } else if (type === 'charm') {
        generateRow = this._generateCharmRow;
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

  });

}, '', {
  requires: [
    'loading-spinner',
    'user-profile-entity'
  ]
});
