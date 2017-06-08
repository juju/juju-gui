/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const yui = window.yui;

const ComponentRenderersMixin = (superclass) => class extends superclass {
  _clearRoot() {}
  /**
    Renders the Added Services component to the page in the appropriate
    element.
    @param {String} hoveredId An id for a service.
  */
  _renderAddedServices(hoveredId) {
    const instance = this.topology;
    if (!instance) {
      // TODO frankban: investigate in what cases instance is undefined on
      // the environment object. Is this some kind of race?
      return;
    }
    const topo = instance.topo;
    const ServiceModule = topo.modules.ServiceModule;
    // Set up a handler for syncing the service token hover. This needs to be
    // attached only when the component is visible otherwise the added
    // services component will try to render if the user hovers a service
    // when they have the service details open.
    const hoverHandler = this._domEventHandlers['topo.hoverService'];
    if (hoverHandler) {
      document.removeEventListener('topo.hoverService', hoverHandler);
    }
    this._domEventHandlers['topo.hoverService'] = evt => {
      this._renderAddedServices(evt.detail.id);
    };
    document.addEventListener(
      'topo.hoverService', this._domEventHandlers['topo.hoverService']);
    // Deselect the active service token. This needs to happen so that when a
    // user closes the service details the service token deactivates.
    ServiceModule.deselectNodes();
    const db = this.db;
    ReactDOM.render(
      <window.juju.components.Panel
        instanceName="inspector-panel"
        visible={db.services.size() > 0}>
        <window.juju.components.AddedServicesList
          services={db.services}
          hoveredId={hoveredId}
          updateUnitFlags={db.updateUnitFlags.bind(db)}
          findRelatedServices={db.findRelatedServices.bind(db)}
          findUnrelatedServices={db.findUnrelatedServices.bind(db)}
          getUnitStatusCounts={yui.juju.views.utils.getUnitStatusCounts}
          hoverService={ServiceModule.hoverService.bind(ServiceModule)}
          panToService={ServiceModule.panToService.bind(ServiceModule)}
          changeState={this.state.changeState.bind(this.state)} />
      </window.juju.components.Panel>,
      document.getElementById('inspector-container'));
  }
  /**
    Renders the Environment Size Display component to the page in the
    designated element.
    @param {Integer} serviceCount The serviceCount to display.
    @param {Integer} machineCount The machineCount to display.
  */
  _renderEnvSizeDisplay(serviceCount=0, machineCount=0) {
    ReactDOM.render(
      <window.juju.components.EnvSizeDisplay
        appState={this.state}
        machineCount={machineCount}
        pluralize={yui.juju.views.utils.pluralize.bind(this)}
        serviceCount={serviceCount} />,
      document.getElementById('env-size-display-container'));
  }
  /**
    Renders the model action components to the page in the designated
    element.
  */
  _renderModelActions() {
    const db = this.db;
    const utils = yui.juju.views.utils;
    const modelAPI = this.modelAPI;
    ReactDOM.render(
      <window.juju.components.ModelActions
        acl={this.acl}
        appState={this.state}
        changeState={this.state.changeState.bind(this.state)}
        exportEnvironmentFile={
          utils.exportEnvironmentFile.bind(utils, db)}
        hideDragOverNotification={this._hideDragOverNotification.bind(this)}
        importBundleFile={this.bundleImporter.importBundleFile.bind(
          this.bundleImporter)}
        renderDragOverNotification={
          this._renderDragOverNotification.bind(this)}
        sharingVisibility={this._sharingVisibility.bind(this)}
        loadingModel={modelAPI.loading}
        userIsAuthenticated={modelAPI.userIsAuthenticated} />,
      document.getElementById('model-actions-container'));
  }
  /**
    Display or hide the sharing modal.
    @param {Boolean} visibility Controls whether to show (true) or hide
                     (false); defaults to true.
  */
  _sharingVisibility(visibility = true) {
    const sharing = document.getElementById('sharing-container');
    if (!visibility) {
      ReactDOM.unmountComponentAtNode(sharing);
      return;
    }
    const db = this.db;
    const env = this.env;
    const grantRevoke = (action, username, access, callback) => {
      if (this.get('gisf') && username.indexOf('@') === -1) {
        username += '@external';
      }
      action(env.get('modelUUID'), [username], access, callback);
    };
    const controllerAPI = this.controllerAPI;
    const grantAccess = controllerAPI.grantModelAccess.bind(controllerAPI);
    const revokeAccess = controllerAPI.revokeModelAccess.bind(controllerAPI);
    ReactDOM.render(
      <window.juju.components.Sharing
        addNotification={db.notifications.add.bind(db.notifications)}
        canShareModel={this.acl.canShareModel()}
        closeHandler={this._sharingVisibility.bind(this, false)}
        getModelUserInfo={env.modelUserInfo.bind(env)}
        grantModelAccess={grantRevoke.bind(this, grantAccess)}
        humanizeTimestamp={yui.juju.views.utils.humanizeTimestamp}
        revokeModelAccess={grantRevoke.bind(this, revokeAccess)}
      />, sharing);
  }
  /**
    Renders the user profile component.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _renderUserProfile(state, next) {
    // XXX Jeff - 1-2-2016 - Because of a bug in the state system the profile
    // view renders itself and then makes requests to identity before the
    // controller is setup and the user has successfully logged in. As a
    // temporary workaround we will just prevent rendering the profile until
    // the controller is connected.
    // XXX frankban: it seems that the profile is rendered even when the
    // profile is not included in the state.
    const guiState = state.gui || {};
    if (
      guiState.deploy !== undefined ||
      !state.profile ||
      !this.controllerAPI.get('connected') ||
      !this.controllerAPI.userIsAuthenticated
    ) {
      return;
    }
    // XXX Jeff - 18-11-2016 - This profile gets rendered before the
    // controller has completed connecting and logging in when in gisf. The
    // proper fix is to queue up the RPC calls but due to time constraints
    // we're setting up this handler to simply re-render the profile when
    // the controller is properly connected.
    const facadesExist = !!this.controllerAPI.get('facades');
    if (!facadesExist) {
      const handler = this.controllerAPI.after('facadesChange', e => {
        if (e.newVal) {
          this._renderUserProfile(state, next);
          handler.detach();
        }
      });
    }
    const charmstore = this.charmstore;
    const utils = yui.juju.views.utils;
    const currentModel = this.modelUUID;
    // When going to the profile view, we are theoretically no longer
    // connected to any model. Setting the current model identifier to null
    // also allows switching to the same model from the profile view.
    this.modelUUID = null;
    // NOTE: we need to clone this.get('users') below; passing in without
    // cloning breaks React's ability to distinguish between this.props and
    // nextProps on the lifecycle methods.
    ReactDOM.render(
      <window.juju.components.UserProfile
        acl={this.acl}
        addNotification=
          {this.db.notifications.add.bind(this.db.notifications)}
        charmstore={charmstore}
        currentModel={currentModel}
        d3={yui.d3}
        facadesExist={facadesExist}
        listBudgets={this.plans.listBudgets.bind(this.plans)}
        listModelsWithInfo={
          this.controllerAPI.listModelsWithInfo.bind(this.controllerAPI)}
        getKpiMetrics={this.plans.getKpiMetrics.bind(this.plans)}
        changeState={this.state.changeState.bind(this.state)}
        destroyModels={
          this.controllerAPI.destroyModels.bind(this.controllerAPI)}
        getAgreements={this.terms.getAgreements.bind(this.terms)}
        getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
        interactiveLogin={this.applicationConfig.interactiveLogin}
        pluralize={utils.pluralize.bind(this)}
        setPageTitle={this.setPageTitle}
        staticURL={this.applicationConfig.staticURL}
        storeUser={this.storeUser.bind(this)}
        switchModel={utils.switchModel.bind(this, this.modelAPI)}
        userInfo={this._getUserInfo(state)}
      />,
      document.getElementById('top-page-container'));
  }
  /**
    The cleanup dispatcher for the user profile path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearUserProfile(state, next) {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('top-page-container'));
    next();
  }
  /**
    Renders the Header Search component to the page in the
    designated element.
  */
  _renderHeaderSearch() {
    ReactDOM.render(
      <window.juju.components.HeaderSearch appState={this.state} />,
      document.getElementById('header-search-container'));
  }

  /**
    Renders the Header Help component to the page.
  */
  _renderHeaderHelp() {
    ReactDOM.render(
      <window.juju.components.HeaderHelp
        appState={this.state}
        gisf={this.applicationConfig.gisf}
        displayShortcutsModal={this._displayShortcutsModal.bind(this)}
        user={this.user} />,
      document.getElementById('header-help'));
  }

  /**
    Renders the shortcuts modal.
  */
  _displayShortcutsModal() {
    ReactDOM.render(
      <window.juju.components.ModalShortcuts
        closeModal={this._clearShortcutsModal.bind(this)}
        guiVersion={window.GUI_VERSION.version}
        keybindings={this.keybindings} />,
      document.getElementById('modal-shortcuts'));
  }

  /**
    The cleanup dispatcher keyboard shortcuts modal.
  */
  _clearShortcutsModal() {
    ReactDOM.unmountComponentAtNode(document.getElementById('modal-shortcuts'));
  }

  _renderHeaderLogo() {
    const userName = this.user.displayName;
    const gisf = this.applicationConfig.gisf;
    const homePath = gisf ? '/' :
      this.state.generatePath({profile: userName});
    const showProfile = () =>
      this.state.changeState({
        profile: userName,
        model: null,
        store: null,
        root: null,
        search: null,
        account: null,
        user: null
      });
    ReactDOM.render(
      <window.juju.components.HeaderLogo
        gisf={gisf}
        homePath={homePath}
        showProfile={showProfile}
         />,
      document.getElementById('header-logo'));
  }

  _clearUserEntity() {}
  _renderCharmbrowser() {}
  _clearCharmbrowser() {}
  _renderAccount() {}
  _clearAccount() {}
  _clearAllGUIComponents() {}
  _renderMachineView() {}
  _clearMachineView() {}
  _renderInspector() {}
  _renderDeployment() {}
  _clearDeployment() {}
  _renderDeploymentBar() {}
  /**
    Renders the login component.

    @method _renderLogin
    @param {String} err Possible authentication error, or null if no error
      message must be displayed.
  */
  _renderLogin(err) {
    document.getElementById('loading-message').style.display = 'none';
    // XXX j.c.sackett 2017-01-30 Right now USSO link is using
    // loginToController, while loginToAPIs is used by the login form.
    // We want to use loginToAPIs everywhere since it handles more.
    const loginToController =
      this.controllerAPI.loginWithMacaroon.bind(
        this.controllerAPI, this.bakery);
    const controllerIsConnected = () => {
      return this.controllerAPI && this.controllerAPI.get('connected');
    };
    ReactDOM.render(
      <window.juju.components.Login
        controllerIsConnected={controllerIsConnected}
        errorMessage={err}
        gisf={this.applicationConfig.gisf}
        loginToAPIs={this.loginToAPIs.bind(this)}
        loginToController={loginToController} />,
        document.getElementById('login-container'));
  }

  _clearLogin() {}
  /**
    Renders the Log out component or log in link depending on the
    environment the GUI is executing in.
  */
  _renderUserMenu() {
    const controllerAPI = this.controllerAPI;
    const linkContainerId = 'profile-link-container';
    const linkContainer = document.getElementById(linkContainerId);
    if (!linkContainer) {
      console.error(`no linkContainerId: ${linkContainerId}`);
      return;
    }
    const charmstore = this.charmstore;
    const bakery = this.bakery;
    const USSOLoginLink = (<window.juju.components.USSOLoginLink
      displayType={'text'}
      loginToController={controllerAPI.loginWithMacaroon.bind(
        controllerAPI, bakery)}
    />);
    const config = this.applicationConfig;
    const LogoutLink = (<window.juju.components.Logout
      logout={this.logout.bind(this)}
      clearCookie={bakery.storage.clear.bind(bakery.storage)}
      gisfLogout={config.gisfLogout || ''}
      gisf={config.gisf || false}
      charmstoreLogoutUrl={charmstore.getLogoutUrl()}
      getUser={this.getUser.bind(this, 'charmstore')}
      clearUser={this.clearUser.bind(this, 'charmstore')}
      // If the charmbrowser is open then don't show the logout link.
      visible={!this.state.current.store}
      locationAssign={window.location.assign.bind(window.location)}
    />);

    const navigateUserProfile = () => {
      const username = this.user.displayName;
      if (!username) {
        return;
      }
      yui.juju.views.utils.showProfile(
        this.modelAPI && this.modelAPI.get('ecs'),
        this.state.changeState.bind(this.state),
        username);
    };
    const navigateUserAccount = () => {
      const username = this.user.displayName;
      if (!username) {
        return;
      }
      yui.juju.views.utils.showAccount(
        this.modelAPI && this.modelAPI.get('ecs'),
        this.state.changeState.bind(this.state));
    };

    ReactDOM.render(<window.juju.components.UserMenu
      controllerAPI={controllerAPI}
      LogoutLink={LogoutLink}
      navigateUserAccount={navigateUserAccount}
      navigateUserProfile={navigateUserProfile}
      USSOLoginLink={USSOLoginLink}
     />, linkContainer);
  }

  _renderBreadcrumb() {}
  _renderProviderLogo() {}
  _renderNotifications() {}
  _renderDragOverNotification() {}
  _hideDragOverNotification() {}
  /**
    Renders the zoom component to the page in the designated element.
  */
  _renderZoom() {
    ReactDOM.render(
      <window.juju.components.Zoom
      topo={this.topology.topo} />,
      document.getElementById('zoom-container'));
  }
  /**
    Render the react components.
  */
  _renderComponents() {
    // Update the react views on database change
    this._renderEnvSizeDisplay(
      this.db.services.size(),
      this.db.machines.filterByParent().length
    );
    this._renderDeploymentBar();
    this._renderModelActions();
    this._renderProviderLogo();
    this._renderZoom();
    this._renderBreadcrumb();
    this._renderHeaderSearch();
    this._renderHeaderHelp();
    this._renderHeaderLogo();
    const gui = this.state.current.gui;
    if (!gui || (gui && !gui.inspector)) {
      this._renderAddedServices();
    }
  }
};

module.exports = ComponentRenderersMixin;
