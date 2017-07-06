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

class UserProfile extends React.Component {
  constructor() {
    super();
    this.state = {
      bundles: null,
      charms: null,
      models: null
    };
  }

  componentDidMount() {
    this.props.setPageTitle(this.props.userInfo.profile);
  }

  componentWillUnmount () {
    this.props.setPageTitle();
  }

  /**
    Set the list of entities, used by the child component.

    @param type {String} The entity type e.g. bundle, charm or model.
    @param entities {Array} The list of entities.
  */
  _setEntities(type, entities) {
    const state = {};
    state[type] = entities;
    this.setState(state);
  }

  /**
    Calls the bakery to get a charm store macaroon.

    @method _interactiveLogin
  */
  _interactiveLogin() {
    const props = this.props;
    const handler = err => {
      if (err) {
        console.log('cannot retrieve charm store macaroon:', err);
        return;
      }
      props.storeUser('charmstore', true);
    };
    // TODO frankban: should pass an user object as prop here instead.
    const macaroon = props.charmstore.bakery.storage.get('charmstore');
    if (macaroon) {
      handler(null);
      return;
    }
    props.charmstore.getMacaroon((err, macaroon) => {
      handler(err);
    });
  }

  /**
    Generate the content for the panel.

    @returns {Array} The markup for the content.
  */
  _generateContent() {
    const props = this.props;
    const bundles = this.state.bundles;
    const charms = this.state.charms;
    const models = this.state.models;
    if (bundles && bundles.length === 0 && charms && charms.length === 0 &&
      models && models.length === 0) {
      return (
        <juju.components.EmptyUserProfile
          changeState={props.changeState}
          isCurrentUser={props.userInfo.isCurrent}
          staticURL={props.staticURL}
          switchModel={props.switchModel} />);
    }
    // All possible components, that can be rendered on the profile page;
    // these may be filtered down to a smaller list depending on the context.
    const lists = [
      <juju.components.UserProfileModelList
        acl={props.acl}
        addNotification={props.addNotification}
        changeState={props.changeState}
        key='modelList'
        ref='modelList'
        currentModel={props.currentModel}
        facadesExist={props.facadesExist}
        destroyModels={props.destroyModels}
        listModelsWithInfo={props.listModelsWithInfo}
        models={this.state.models}
        setEntities={this._setEntities.bind(this, 'models')}
        switchModel={props.switchModel}
        userInfo={props.userInfo} />,
      <juju.components.UserProfileEntityList
        key='bundleList'
        ref='bundleList'
        addNotification={props.addNotification}
        changeState={props.changeState}
        charmstore={props.charmstore}
        entities={this.state.bundles}
        getDiagramURL={props.getDiagramURL}
        setEntities={this._setEntities.bind(this, 'bundles')}
        type='bundle'
        user={props.userInfo.external} />,
      <juju.components.UserProfileEntityList
        key='charmList'
        ref='charmList'
        addNotification={props.addNotification}
        changeState={props.changeState}
        charmstore={props.charmstore}
        d3={props.d3}
        entities={this.state.charms}
        getDiagramURL={props.getDiagramURL}
        getKpiMetrics={props.getKpiMetrics}
        setEntities={this._setEntities.bind(this, 'charms')}
        type='charm'
        user={props.userInfo.external} />
    ];
    // The list of models is always included, even if the profile is not for
    // the current user, in which case we'll display only the models owned
    // by that profile.
    const toRender = ['modelList'];
    // Exclude/include sections only displayed to the current user.
    if (props.userInfo.isCurrent) {
      toRender.push('agreementList');
    }
    // Exclude/include sections that require a charm store user.
    if (props.userInfo.external) {
      toRender.push('bundleList');
      toRender.push('charmList');
    }
    // Filter the original list of components based on which sections are in
    // and which are out.
    const componentsToRender = lists.filter(list => {
      return toRender.indexOf(list.key) >= 0;
    });
    return (
      <div>
        {componentsToRender}
      </div>);
  }

  render() {
    // XXX kadams54 2016-09-05: Will need to restore the header links and
    // counts functionality here.
    const links = [];
    return (
      <juju.components.Panel
        instanceName="user-profile"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <juju.components.UserProfileHeader
              avatar=""
              interactiveLogin={this._interactiveLogin.bind(this)}
              links={links}
              userInfo={this.props.userInfo} />
            {this._generateContent()}
          </div>
        </div>
      </juju.components.Panel>
    );
  }
};

UserProfile.propTypes = {
  acl: React.PropTypes.object,
  addNotification: React.PropTypes.func.isRequired,
  changeState: React.PropTypes.func.isRequired,
  charmstore: React.PropTypes.object.isRequired,
  currentModel: React.PropTypes.string,
  d3: React.PropTypes.object,
  destroyModels: React.PropTypes.func.isRequired,
  facadesExist: React.PropTypes.bool.isRequired,
  getAgreements: React.PropTypes.func.isRequired,
  getDiagramURL: React.PropTypes.func.isRequired,
  getKpiMetrics: React.PropTypes.func.isRequired,
  interactiveLogin: React.PropTypes.bool,
  listBudgets: React.PropTypes.func.isRequired,
  listModelsWithInfo: React.PropTypes.func.isRequired,
  pluralize: React.PropTypes.func.isRequired,
  setPageTitle: React.PropTypes.func.isRequired,
  staticURL: React.PropTypes.string,
  storeUser: React.PropTypes.func.isRequired,
  switchModel: React.PropTypes.func.isRequired,
  // userInfo must have the following attributes:
  // - external: the external user name to use for retrieving data, for
  //   instance, from the charm store. Might be null if the user is being
  //   displayed for the current user and they are not authenticated to
  //   the charm store;
  // - isCurrent: whether the profile is being displayed for the currently
  //   authenticated user;
  // - profile: the user name for whom profile details must be displayed.
  userInfo: React.PropTypes.object.isRequired
};

YUI.add('user-profile', function() {
  juju.components.UserProfile = UserProfile;
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
