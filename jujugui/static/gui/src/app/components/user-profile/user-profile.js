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
      controllerAPI: React.PropTypes.object.isRequired,
      currentModel: React.PropTypes.string,
      getAgreements: React.PropTypes.func.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      hideConnectingMask: React.PropTypes.func.isRequired,
      interactiveLogin: React.PropTypes.bool,
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

    getInitialState: function() {
      return {
        modelCount: 0,
      };
    },

    componentDidMount: function() {
      const refs = this.refs;
      refs.modelList.subscribeStatusListener(
        this._updateCounts.bind(this, 'modelCount'));
    },

    componentWillUnmount: function() {
      const refs = this.refs;
      refs.modelList.unsubscribeStatusListener(
        this._updateCounts.bind(this, 'modelCount'));
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

    _updateCounts: function(key, status, data) {
      if (status === 'ok' && data.count) {
        const state = {};
        state[key] = data.count;
        this.setState(state);
      }
    },

    /**
      Generate the content for the panel.

      @method _generateContent
      @returns {Array} The markup for the content.
    */
    _generateContent: function() {
      var props = this.props;
      var emptyComponent = (
        <juju.components.EmptyUserProfile
          addNotification={props.addNotification}
          controllerAPI={props.controllerAPI}
          hideConnectingMask={props.hideConnectingMask}
          showConnectingMask={props.showConnectingMask}
          staticURL={props.staticURL}
          switchModel={props.switchModel}
          user={props.user} />
      );
      return (
        <div>
          <juju.components.SectionLoadWatcher
            EmptyComponent={emptyComponent}
            timeout={10}>
            <juju.components.UserProfileModelList
              ref='modelList'
              addNotification={props.addNotification}
              canCreateNew={props.canCreateNew}
              controllerAPI={props.controllerAPI}
              currentModel={props.currentModel}
              hideConnectingMask={props.hideConnectingMask}
              listModels={props.listModels}
              showConnectingMask={props.showConnectingMask}
              switchModel={props.switchModel}
              user={props.user}
              users={props.users} />
            <juju.components.UserProfileEntityList
              ref='bundleList'
              changeState={props.changeState}
              charmstore={props.charmstore}
              getDiagramURL={props.getDiagramURL}
              type='bundle'
              user={props.user}
              users={props.users} />
            <juju.components.UserProfileEntityList
              ref='charmList'
              changeState={props.changeState}
              charmstore={props.charmstore}
              getDiagramURL={props.getDiagramURL}
              type='charm'
              user={props.user}
              users={props.users} />
            <juju.components.UserProfileAgreementList
              ref='agreementList'
              getAgreements={props.getAgreements}
              user={props.user} />
            <juju.components.UserProfileBudgetList
              ref='budgetList'
              listBudgets={props.listBudgets}
              user={props.user} />
          </juju.components.SectionLoadWatcher>
        </div>);
    },

    render: function() {
      var username = this.props.user && this.props.user.usernameDisplay;
      var state = this.state;
      var pluralize = this.props.pluralize;
      var links = [{
        label: `${state.modelCount} ${pluralize('model', state.modelCount)}`
      }];
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
    'section-load-watcher',
    'user-profile-agreement-list',
    'user-profile-budget-list',
    'user-profile-entity',
    'user-profile-entity-list',
    'user-profile-model-list',
    'user-profile-header'
  ]
});
