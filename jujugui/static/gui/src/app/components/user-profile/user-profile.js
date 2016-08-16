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

YUI.add('user-profile', function() {

  juju.components.UserProfile = React.createClass({
    propTypes: {
      addNotification: React.PropTypes.func.isRequired,
      canCreateNew: React.PropTypes.bool.isRequired,
      changeState: React.PropTypes.func.isRequired,
      charmstore: React.PropTypes.object.isRequired,
      currentModel: React.PropTypes.string,
      env: React.PropTypes.object.isRequired,
      getAgreements: React.PropTypes.func.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      hideConnectingMask: React.PropTypes.func.isRequired,
      interactiveLogin: React.PropTypes.bool,
      jem: React.PropTypes.object,
      listBudgets: React.PropTypes.func.isRequired,
      listModels: React.PropTypes.func.isRequired,
      pluralize: React.PropTypes.func.isRequired,
      showConnectingMask: React.PropTypes.func.isRequired,
      staticURL: React.PropTypes.string,
      storeUser: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      user: React.PropTypes.object,
      users: React.PropTypes.object.isRequired
    },

    /**
      Calls the bakery to get a charmstore macaroon.

      @method _interactiveLogin
    */
    _interactiveLogin: function() {
      var bakery = this.props.charmstore.bakery;
      bakery.fetchMacaroonFromStaticPath(this._fetchMacaroonCallback);
    },

    /**
      Callback for fetching the macaroon.

      @method _fetchMacaroonCallback
      @param {String|Object|Null} error The error response from the callback.
      @param {String} macaroon The resolved macaroon.
    */
    _fetchMacaroonCallback: function(error, macaroon) {
      if (error) {
        console.log(error);
      } else {
        this.props.storeUser('charmstore', true);
      }
    },

    /**
      Return a list's length or default to 0, in a manner that doesn't fall
      over when confronted with a null list.

      @method _safeCount
      @returns {Array} The list.
    */
    /* XXX: Disabled until we solve the problem of getting counts from the
       child list components.
    _safeCount: function(list) {
      return (list && list.length) || 0;
    },
    */

    /**
      Generate the content for the panel.

      @method _generateContent
      @returns {Array} The markup for the content.
    */
    _generateContent: function() {
      var props = this.props;
      return (
        <div>
          <juju.components.SectionLoadWatcher
            EmptyComponent={juju.components.EmptyUserProfile}
            timeout={10}>
            <juju.components.UserProfileModelList
              addNotification={props.addNotification}
              canCreateNew={props.canCreateNew}
              currentModel={props.currentModel}
              env={props.env}
              hideConnectingMask={props.hideConnectingMask}
              jem={props.jem}
              listModels={props.listModels}
              showConnectingMask={props.showConnectingMask}
              switchModel={props.switchModel}
              user={props.user}
              users={props.users} />
            <juju.components.UserProfileEntityList
              changeState={props.changeState}
              charmstore={props.charmstore}
              getDiagramURL={props.getDiagramURL}
              type='bundle'
              user={props.user}
              users={props.users} />
            <juju.components.UserProfileEntityList
              changeState={props.changeState}
              charmstore={props.charmstore}
              getDiagramURL={props.getDiagramURL}
              type='charm'
              user={props.user}
              users={props.users} />
            <juju.components.UserProfileAgreementList
              getAgreements={props.getAgreements}
              user={props.user} />
            <juju.components.UserProfileBudgetList
              listBudgets={props.listBudgets}
              user={props.user} />
          </juju.components.SectionLoadWatcher>
        </div>);
    },

    render: function() {
      var username = this.props.user && this.props.user.usernameDisplay;
      /* XXX Find some way to percolate these up from the child components. */
      /*
      var state = this.state;
      var bundleCount = this._safeCount(state.bundleList);
      var charmCount = this._safeCount(state.charmList);
      var modelCount = this._safeCount(state.envList);
      */
      /* XXX Should include agreements, budgets, etc. in these links. */
      /*
      var pluralize = this.props.pluralize;
      var links = [{
        label: `${modelCount} ${pluralize('model', modelCount)}`
      }, {
        label: `${bundleCount} ${pluralize('bundle', bundleCount)}`
      }, {
        label: `${charmCount} ${pluralize('charm', charmCount)}`
      }];
      var links = [{
        label: `${modelCount} ${pluralize('model', modelCount)}`
      }];
      */
      var links = [];
      return (
        <juju.components.Panel
          instanceName="user-profile"
          visible={true}>
          <div className="twelve-col">
            <div className="inner-wrapper">
              <juju.components.UserProfileHeader
                users={this.props.users}
                avatar=""
                interactiveLogin={this.props.interactiveLogin ?
                  this._interactiveLogin : undefined}
                links={links}
                username={username} />
              {this._generateContent()}
            </div>
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'empty-user-profile',
    'generic-input',
    'loading-spinner',
    'panel-component',
    'user-profile-agreement-list',
    'user-profile-budget-list',
    'user-profile-entity',
    'user-profile-entity-list',
    'user-profile-model-list',
    'user-profile-header'
  ]
});
