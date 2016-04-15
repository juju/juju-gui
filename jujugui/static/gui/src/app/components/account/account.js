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
      listTemplates: React.PropTypes.func.isRequired,
      user: React.PropTypes.object.isRequired,
      users: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      return {
        credentials: []
      };
    },

    componentWillMount: function() {
      this.props.listTemplates((error, credentials) => {
        // XXX kadams54: This is basic error handling for the initial
        // implementation. It should be replaced with an error message for the
        // user in subsequent UI polish work.
        if (error) {
          console.error('Unable to list templates', error);
          return;
        }
        this.setState({credentials: credentials});
      });
    },

    /**
      Generate the rows of credentials.

      @method _generateCredentials
      @returns {Array} The list of credentials.
    */
    _generateCredentials: function() {
      var credentials = this.state.credentials;
      if (credentials.length === 0) {
        return (
          <juju.components.Spinner />);
      }
      var components = [];
      var classes = {
        'user-profile__entity': true,
        'user-profile__list-row': true
      };
      credentials.forEach((credential) => {
        var path = credential.path;
        var parts = path.split('/');
        var owner = parts[0];
        var name = parts[1];
        components.push(
          <juju.components.ExpandingRow
            classes={classes}
            key={path}>
            <div>
              <span className="user-profile__list-col three-col">
                {name}
              </span>
              <span className="user-profile__list-col three-col">
                --
              </span>
              <span className="user-profile__list-col three-col">
                {owner}
              </span>
              <span className="user-profile__list-col three-col last-col">
                --
              </span>
            </div>
            <div>
              <div className="expanding-row__expanded-header twelve-col">
                <div className="nine-col no-margin-bottom">
                  {name}
                </div>
                <div className={'expanding-row__expanded-header-action ' +
                  'three-col last-col no-margin-bottom'}>
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
                <ul className="user-profile__list twelve-col">
                  <li className="user-profile__list-header twelve-col">
                    <span className="user-profile__list-col three-col">
                      Model
                    </span>
                    <span className="user-profile__list-col three-col">
                      Units
                    </span>
                    <span className="user-profile__list-col three-col">
                      Owner
                    </span>
                    <span className="user-profile__list-col three-col last-col">
                      Region
                    </span>
                  </li>
                  <li className="user-profile__list-row twelve-col">
                    <span className="user-profile__list-col three-col">
                      Callisto
                    </span>
                    <span className="user-profile__list-col three-col">
                      4
                    </span>
                    <span className="user-profile__list-col three-col">
                      Spinach
                    </span>
                    <span className="user-profile__list-col three-col last-col">
                      US (East)
                    </span>
                  </li>
                  <li className="user-profile__list-row twelve-col">
                    <span className="user-profile__list-col three-col">
                      Callisto
                    </span>
                    <span className="user-profile__list-col three-col">
                      4
                    </span>
                    <span className="user-profile__list-col three-col">
                      Spinach
                    </span>
                    <span className="user-profile__list-col three-col last-col">
                      US (East)
                    </span>
                  </li>
                </ul>
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
              <h2 className="account__title twelve-col">
                Account management
              </h2>
              <h3 className="account__title2 twelve-col">
                Cloud credentials
                <ul className="account__title-links">
                  <li className="account__title-link">
                    Add
                  </li>
                  <li className="account__title-bullet">
                    &nbsp;&bull;&nbsp;
                  </li>
                  <li className="account__title-link">
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
    'loading-spinner',
    'panel-component',
    'svg-icon',
    'user-profile-entity',
    'user-profile-header'
  ]
});
