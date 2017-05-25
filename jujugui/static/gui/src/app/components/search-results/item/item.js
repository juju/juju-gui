/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

YUI.add('search-results-item', function(Y) {

  juju.components.SearchResultsItem = React.createClass({
    displayName: 'SearchResultsItem',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      deployTarget: React.PropTypes.func.isRequired,
      item: React.PropTypes.object.isRequired
    },

    /**
      Generate the element for the special flag.

      @method _generateSpecialFlag
      @returns {String} The generated elements.
    */
    _generateSpecialFlag: function() {
      if (!this.props.item.special) {
        return;
      }
      return (
          <span className="special-flag"></span>
      );
    },

    /**
      Generate the elements for the tag list.

      @method _generateTagList
      @returns {String} The generated elements.
    */
    _generateTagList: function() {
      var components = [];
      var tags = this.props.item.tags || [];
      if (tags.length === 0) {
        return <span>{' '}</span>;
      }
      tags.forEach(function(tag, i) {
        components.push(
          <li className="tag-list--item"
            key={tag + i}
            role="button" tabIndex="0"
            onClick={this._handleTagClick.bind(this, tag)}>
            {tag}
          </li>
        );
      }, this);
      return components;
    },

    /**
      Generate the elements for the icon list.

      @method _generateIconList
      @returns {String} The generated elements.
    */
    _generateIconList: function() {
      var applications = this.props.item.applications || [this.props.item];
      var components = [];
      applications.forEach(function(service) {
        var src = service.iconPath ||
            'static/gui/build/app/assets/images/non-sprites/charm_160.svg';
        components.push(
          <li className="list-icons__item tooltip"
            key={service.displayName}
            role="button" tabIndex="0"
            onClick={this._handleItemClick.bind(this, service.id)}>
            <img src={src}
              className="list-icons__image"
              alt={service.displayName} />
            <span className="tooltip__tooltip">
              <span className="tooltip__inner tooltip__inner--down">
                {service.displayName}
              </span>
            </span>
          </li>
        );
      }, this);
      return components;
    },

    /**
      Generate the elements for the series list.

      @method _generateSeriesList
      @returns {String} The generated elements.
    */
    _generateSeriesList: function() {
      var item = this.props.item;
      var series = item.series;
      var components = [];
      // Prevent layouts from collapsing due to empty content.
      if (series.length === 0) {
        return <li>&nbsp;</li>;
      }
      series.forEach(function(s) {
        components.push(
          <li className="list-series__item"
            key={s.name}>
            <a onClick={this._handleItemClick.bind(this, s.storeId)}>
              {s.name}
            </a>
          </li>
        );
      }, this);
      return components;
    },

    /**
      Generate the base classes from the props.

      @method _generateClasses
      @param {Boolean} selected Whether the filter is selected.
      @returns {String} The collection of class names.
    */
    _generateClasses: function(selected) {
      return classNames(
        {selected: selected}
      );
    },

    /**
      Show the entity details when clicked.

      @method _handleItemClick
      @param {String} id The entity id.
      @param {Object} evt The click event.
    */
    _handleItemClick: function(id, evt) {
      evt.stopPropagation();
      // TODO frankban: it should be clear whether this id is legacy or not.
      let url;
      try {
        url = window.jujulib.URL.fromLegacyString(id);
      } catch(_) {
        url = window.jujulib.URL.fromString(id);
      }
      this.props.changeState({
        search: null,
        store: url.path()
      });
    },

    /**
      Show search results for the given tag.

      @method _handleTagClick
      @param {String} tag The tag name.
      @param {Object} e The click event.
    */
    _handleTagClick: function(tag, e) {
      e.stopPropagation();
      this.props.changeState({
        search: {
          owner: null,
          provides: null,
          requires: null,
          series: null,
          tags: tag,
          text: '',
          type: null
        }
      });
    },

    /**
      Navigate to the profile page of the given owner.

      @method _handleOwnerClick
      @param {String} owner The owner's name.
      @param {Object} evt The click event.
    */
    _handleOwnerClick: function(owner, evt) {
      evt.stopPropagation();
      this.props.changeState({search: null, profile: owner});
    },

    /**
      Deploy the entity.

      @param id {String} The id of the entity to deploy.
    */
    _handleDeploy: function(id) {
      this.props.deployTarget(id);
      // Close the search results so that the deployed entity is visible on the
      // canvas.
      this.props.changeState({
        search: null,
        profile: null
      });
    },

    /**
      Generate the series list item class based on entity type

      @method _generateSeriesClass
      @returns {String} The generated class name.
    */
    _generateSeriesClass: function() {
      var item = this.props.item.type;
      return classNames(
        'series__column',
        {
          'two-col': item === 'bundle'
        },
        {
          'four-col': item === 'charm'
        }
      );
    },

    /**
      Generate the charms column class based on entity type

      @method _generateCharmsClass
      @returns {String} The generated class name.
    */
    _generateCharmsClass: function() {
      var item = this.props.item.type;
      return classNames(
        'charm-logos__column list-block__column',
        {
          'three-col': item === 'bundle'
        },
        {
          'one-col': item === 'charm'
        }
      );
    },

    render: function() {
      var item = this.props.item;
      return (
        <li className={'list-block__list--item ' + item.type}
            tabIndex="0" role="button"
            onClick={this._handleItemClick.bind(this, item.id)}>
          <div className="four-col charm-name__column">
            <h3 className="list-block__list--item-title">
              {item.displayName}
              {this._generateSpecialFlag()}
            </h3>
            <ul className="tag-list">
              {this._generateTagList()}
            </ul>
          </div>
          <div className={this._generateSeriesClass()}>
            <ul className="list-series">
              {this._generateSeriesList()}
            </ul>
          </div>
          <div className={this._generateCharmsClass()}>
            <ul className="list-icons clearfix">
              {this._generateIconList()}
            </ul>
          </div>
          <div className="two-col owner__column list-block__column">
            <p className="cell">
              {'By '}
              <span className="link"
                onClick={this._handleOwnerClick.bind(this, item.owner)}
                role="button"
                tabIndex="0">
                {item.owner}
              </span>
            </p>
          </div>
          <div className="one-col last-col list-block__list--item-deploy">
            <juju.components.GenericButton
              extraClasses="list-block__list--item-deploy-link"
              action={this._handleDeploy.bind(this, item.id)}
              disabled={this.props.acl.isReadOnly()}
              type="inline-neutral">
              <juju.components.SvgIcon
                name="add-icon"
                size="16" />
            </juju.components.GenericButton>
          </div>
        </li>
      );
    }
  });

}, '0.1.0', {requires: [
  'generic-button',
  'svg-icon'
]});
