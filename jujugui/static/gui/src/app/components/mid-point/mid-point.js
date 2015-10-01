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
      Generate the list of tags.

      @method _generateTagList
      @returns {Array} The list of tags.
    */
    _generateTagList: function() {
      var tags = [];
      this.tags.forEach(function (tag) {
        tags.push(
          <li tabIndex="0" role="button"
            className="mid-point__tag">
            {tag.name}
            <span className="mid-point__tag-count">
              ({tag.count})
            </span>
          </li>
        );
      }, this);
      return tags;
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
            <button className="mid-point__store-button">
              Show more
            </button>
          </div>
        </div>
      );
    }
  });

}, '0.1.0', { requires: []});
