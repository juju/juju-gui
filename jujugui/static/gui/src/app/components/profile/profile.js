/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

const Profile = React.createClass({
  displayName: 'Profile',

  getInitialState: function() {
    this.SECTIONS = {
      'summary': {
        label: 'Summary'
      },
      'models': {
        label: 'Models'
      },
      'bundles': {
        label: 'Bundles'
      },
      'charms': {
        label: 'Charms'
      },
      'credentials': {
        label: 'Cloud credentails'
      },
      'ssh': {
        label: 'SSH keys'
      },
      'payment': {
        label: 'Payment'
      },
      'budgets': {
        label: 'Budgets'
      },
      'terms': {
        label: 'Terms'
      }
    };
    return {
      section: 'summary'
    };
  },

  _handleNavClick: function(section) {
    this.setState({section: section});
  },

  _generateNav: function() {
    const links = Object.keys(this.SECTIONS).map(id => {
      const section = this.SECTIONS[id];
      const classes = classNames(
        'profile__nav-link',
        'link',
        {'profile__nav-link--active': this.state.section === id}
      );
      return (
        <li className={classes}
          key={id}
          onClick={this._handleNavClick.bind(this, id)}>
          {section.label}
        </li>);
    });
    return (
      <ul className="profile__nav">
        {links}
      </ul>);
  },

  _generateContent: function() {
    return (
      <div>
        <img src={`/static/gui/build/app/assets/images/profile/${this.state.section}.png`} />
      </div>);
  },

  render: function() {
    return (
      <juju.components.Panel
        instanceName="profile"
        visible={true}>
        <div className="profile__header">
          <div className="twelve-col">
            <div className="inner-wrapper">
              <img src="/static/gui/build/app/assets/images/profile/header.png" />
            </div>
          </div>
        </div>
        <div className="twelve-col">
          <div className="inner-wrapper">
            {this._generateNav()}
            <div className="profile__content">
              {this._generateContent()}
            </div>
          </div>
        </div>
      </juju.components.Panel>
    );
  }

});

YUI.add('profile', function() {
  juju.components.Profile = Profile;
}, '', {
  requires: [
    'panel'
  ]
});
