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

    /**
      Add the charm to the canvas when clicked.

      @method _handleCharmClick
      @param {Object} e The click event
    */
    _handleCharmClick: function(e) {
      var charmId = e.currentTarget.getAttribute('data-id');
      // app has already been bound to this function in
      // the app.js definition.
      this.props.addService(charmId);
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

    render: function() {
      return (
        <div className="mid-point">
          <h4 className="mid-point__title">Featured searches</h4>
          <ul className="mid-point__charm-list">
            {this._generateCharmList()}
          </ul>
        </div>
      );
    }
  });

}, '0.1.0', { requires: []});
