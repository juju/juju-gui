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

YUI.add('account', function() {

  juju.components.Account = React.createClass({
    xhrs: [],

    propTypes: {
      user: React.PropTypes.object,
      users: React.PropTypes.object.isRequired
    },

    /**
      Generate the rows of credentials.

      @method _generateCredentials
      @returns {Array} The list of credentials.
    */
    _generateCredentials: function() {
      var components = [];
      var credentials = ['one', 'two'];
      credentials.forEach((credential) => {
        components.push(
          <juju.components.ExpandingRow
            key={credential}>
            <div>
              <span className="user-profile__list-col three-col">
                Google personal
              </span>
              <span className="user-profile__list-col three-col">
                4
              </span>
              <span className="user-profile__list-col three-col">
                spinach
              </span>
              <span className="user-profile__list-col three-col last-col">
                Google
              </span>
            </div>
            <div>
              <div className="expanding-row__expanded-header twelve-col">
                <div className="ten-col no-margin-bottom">
                  Google personal
                </div>
                <div className={'expanding-row__expanded-header-action ' +
                  'two-col last-col no-margin-bottom'}>
                  <juju.components.GenericButton
                    action={() => {}}
                    type='inline-base'
                    title="Destroy" />
                  <juju.components.GenericButton
                    action={() => {}}
                    type='inline-neutral'
                    title="Edit" />
                </div>
              </div>
              <div className={'expanding-row__expanded-content twelve-col ' +
                'no-margin-bottom'}>
                Content
              </div>
            </div>
          </juju.components.ExpandingRow>);
      });
      return components;
    },

    render: function() {
      var username = this.props.user && this.props.user.usernameDisplay;
      var links = [{
        label: '(Primary account)',
        type: 'light'
      }, {
        action: () => {},
        label: 'Sign out'
      }];
      return (
        <juju.components.Panel
          instanceName="account"
          visible={true}>
          <div className="twelve-col">
            <div className="inner-wrapper">
              <juju.components.UserProfileHeader
                users={this.props.users}
                avatar=""
                links={links}
                username={username} />
              <h2>Account management</h2>
              <h3>
                Cloud credentials
                <ul className="">
                  <li className="">
                    Add
                  </li>
                  <li className="">
                    Edit defaults
                  </li>
                </ul>
              </h3>
              <form className="twelve-col">
                <div className="six-col">
                  <label className="deployment-panel__label"
                    htmlFor="default-credential">
                    Default credential
                  </label>
                  <input className="deployment-panel__input"
                    id="default-credential"
                    type="text" />
                </div>
                <div className="six-col last-col">
                  <label className="deployment-panel__label"
                    htmlFor="default-region">
                    Default region
                  </label>
                  <input className="deployment-panel__input"
                    id="default-region"
                    type="text" />
                </div>
              </form>
              <ul className="user-profile__list twelve-col">
                <li className="user-profile__list-header twelve-col">
                  <span className="user-profile__list-col three-col">
                    Credential name
                  </span>
                  <span className="user-profile__list-col three-col">
                    No. of models
                  </span>
                  <span className="user-profile__list-col three-col">
                    Owner
                  </span>
                  <span className="user-profile__list-col three-col last-col">
                    Provider
                  </span>
                </li>
                {this._generateCredentials()}
              </ul>
            </div>
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'expanding-row',
    'panel-component',
    'svg-icon',
    'user-profile-entity',
    'user-profile-header'
  ]
});
