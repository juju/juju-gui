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

YUI.add('mid-point', function() {

  juju.components.MidPoint = React.createClass({
    mixins: [OnClickOutside],

    charms: [{
        id: 'trusty/mariadb',
        icon: 'https://api.jujucharms.com/charmstore/v4/trusty/mariadb/icon.svg', // eslint-disable-line max-len
        name: 'Mariadb'
      }, {
        id: 'trusty/hadoop',
        icon: 'https://api.jujucharms.com/charmstore/v4/trusty/hadoop/icon.svg', // eslint-disable-line max-len
        name: 'Hadoop'
      }, {
        id: 'trusty/wordpress',
        icon: 'https://api.jujucharms.com/charmstore/v4/trusty/wordpress/icon.svg', // eslint-disable-line max-len
        name: 'Wordpress'
      }, {
        id: 'trusty/ceph',
        icon: 'https://api.jujucharms.com/charmstore/v4/trusty/ceph/icon.svg', // eslint-disable-line max-len
        name: 'Ceph'
      }, {
        id: 'trusty/redis',
        icon: 'https://api.jujucharms.com/charmstore/v4/trusty/redis/icon.svg', // eslint-disable-line max-len
        name: 'Redis'
      }, {
        id: 'trusty/mongodb',
        icon: 'https://api.jujucharms.com/charmstore/v4/trusty/mongodb/icon.svg', // eslint-disable-line max-len
        name: 'Mongodb'
    }],

    tags: [{
        name: 'databases',
        count: 71
      }, {
        name: 'app-servers',
        count: 75
      }, {
        name: 'file-servers',
        count: 48
      }, {
        name: 'monitoring',
        count: 48
      }, {
        name: 'ops',
        count: 22
      }, {
        name: 'openstack',
        count: 108
      }, {
        name: 'applications',
        count: 248
      }, {
        name: 'misc',
        count: 279
    }],

    /**
      Get the current state of the mid-point.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      return {
        storeOpen: this.props.storeOpen,
        outsideClickClose: this.props.outsideClickClose
      };
    },

    /**
      Close the midpoint when there is a click outside of the component.
      Called by the OnClickOutside mixin.

      @method handleClickOutside
      @param {Object} e The click event
    */
    handleClickOutside: function(e) {
      if (this.state.outsideClickClose) {
        this.props.changeState({
          sectionC: {
            component: null,
            metadata: null
          }
        });
      }
    },

    /**
      Show the charm details when clicked.

      @method _handleCharmClick
      @param {Object} e The click event
    */
    _handleCharmClick: function(e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: e.currentTarget.getAttribute('data-id')
          }
        }
      });
    },

    /**
      Generate the list of charms.

      @method _generateCharmList
      @returns {Array} The list of charms.
    */
    _generateCharmList: function() {
      var charms = [];
      this.charms.forEach(function (charm) {
        charms.push(
          <li tabIndex="0" role="button"
            className="mid-point__charm"
            data-id={charm.id}
            key={charm.id}
            onClick={this._handleCharmClick}>
            <img src={charm.icon} alt={charm.name}
              className="mid-point__charm-icon" />
            <span className="mid-point__charm-name">
              {charm.name}
            </span>
          </li>
        );
      }, this);
      return charms;
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
            tags: e.currentTarget.getAttribute('data-id')
          }
        }
      });
    },

    /**
      Generate the list of tags.

      @method _generateTagList
      @returns {Array} The list of tags.
    */
    _generateTagList: function() {
      var tags = [];
      this.tags.forEach(function (tag) {
        var tagCount = '(' + tag.count + ')';

        tags.push(
          <li tabIndex="0" role="button"
            key={tag.name}
            data-id={tag.name}
            onClick={this._handleTagClick}
            className="mid-point__tag">
            {tag.name}
            <span className="mid-point__tag-count">
              {tagCount}
            </span>
          </li>
        );
      }, this);
      return tags;
    },

    /**
      Navigate to the store when the button is clicked.

      @method _handleStoreClick
      @param {Object} e The click event
    */
    _handleStoreClick: function(e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: this.state.storeOpen ? 'mid-point' : 'store'
          }
        }
      });
    },

    /**
      Display the appropriate label for the store button depending on the store
      state.

      @method _generateStoreLabel
      @returns {String} The button label
    */
    _generateStoreLabel: function() {
      return this.state.storeOpen ? 'Show less' : 'Show more';
    },

    render: function() {
      return (
        <div className="mid-point">
          <h4 className="mid-point__title">Featured searches</h4>
          <ul className="mid-point__charm-list">
            {this._generateCharmList()}
          </ul>
          <div className="mid-point__footer-row">
            <ul className="mid-point__tag-list">
              {this._generateTagList()}
            </ul>
            <button className="mid-point__store-button"
              onClick={this._handleStoreClick}>
              {this._generateStoreLabel()}
            </button>
          </div>
        </div>
      );
    }
  });

}, '0.1.0', { requires: []});
