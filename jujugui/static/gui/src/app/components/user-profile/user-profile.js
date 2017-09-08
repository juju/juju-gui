/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EmptyUserProfile = require('./empty-user-profile');
const Panel = require('../panel/panel');
const UserProfileEntityList = require('./entity-list/entity-list');
const UserProfileModelList = require('./model-list/model-list');
const UserProfileHeader = require('./header/header');

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
      props.storeUser('charmstore');
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
        <EmptyUserProfile
          changeState={props.changeState}
          isCurrentUser={props.userInfo.isCurrent}
          staticURL={props.staticURL}
          switchModel={props.switchModel} />);
    }
    // All possible components, that can be rendered on the profile page;
    // these may be filtered down to a smaller list depending on the context.
    const lists = [
      <UserProfileModelList
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
      <UserProfileEntityList
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
      <UserProfileEntityList
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
      <Panel
        instanceName="user-profile"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <UserProfileHeader
              avatar=""
              interactiveLogin={this._interactiveLogin.bind(this)}
              links={links}
              userInfo={this.props.userInfo} />
            {this._generateContent()}
          </div>
        </div>
      </Panel>
    );
  }
};

UserProfile.propTypes = {
  acl: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: PropTypes.object.isRequired,
  currentModel: PropTypes.string,
  d3: PropTypes.object,
  destroyModels: PropTypes.func.isRequired,
  facadesExist: PropTypes.bool.isRequired,
  getAgreements: PropTypes.func.isRequired,
  getDiagramURL: PropTypes.func.isRequired,
  getKpiMetrics: PropTypes.func.isRequired,
  interactiveLogin: PropTypes.bool,
  listBudgets: PropTypes.func.isRequired,
  listModelsWithInfo: PropTypes.func.isRequired,
  pluralize: PropTypes.func.isRequired,
  setPageTitle: PropTypes.func.isRequired,
  staticURL: PropTypes.string,
  storeUser: PropTypes.func.isRequired,
  switchModel: PropTypes.func.isRequired,
  // userInfo must have the following attributes:
  // - external: the external user name to use for retrieving data, for
  //   instance, from the charm store. Might be null if the user is being
  //   displayed for the current user and they are not authenticated to
  //   the charm store;
  // - isCurrent: whether the profile is being displayed for the currently
  //   authenticated user;
  // - profile: the user name for whom profile details must be displayed.
  userInfo: PropTypes.object.isRequired
};

module.exports = UserProfile;
