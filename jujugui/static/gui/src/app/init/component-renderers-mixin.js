/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const marked = require('marked');
const Prism = require('prismjs');
const prismLanguages = require('prism-languages');
const queryString = require('query-string');
const React = require('react');
const ReactDOM = require('react-dom');
const shapeup = require('shapeup');

const yui = window.yui;

const autodeploy = require('./autodeploy');
const initUtils = require('./utils');
const hotkeys = require('./hotkeys');
const jujulibConversionUtils = require('./jujulib-conversion-utils');
const localCharmHelpers = require('../components/local-inspector/local-charm-import-helpers');
const changesUtils = require('./changes-utils');
const relationUtils = require('./relation-utils');
const viewUtils = require('../views/utils');
const endpointUtils = require('./endpoint-utils');
const WebHandler = require('../store/env/web-handler');

const AddedServicesList = require('../components/added-services-list/added-services-list');
const Charmbrowser = require('../components/charmbrowser/charmbrowser');
const DeploymentBar = require('../components/deployment-bar/deployment-bar');
const DeploymentFlow = require('../components/deployment-flow/deployment-flow');
const EnvSizeDisplay = require('../components/env-size-display/env-size-display');
const ExpandingProgress = require('../components/expanding-progress/expanding-progress');
const HeaderBreadcrumb = require('../components/header-breadcrumb/header-breadcrumb');
const HeaderLogo = require('../components/header-logo/header-logo');
const HeaderSearch = require('../components/header-search/header-search');
const Help = require('../components/help/help');
const Inspector = require('../components/inspector/inspector');
const ISVProfile = require('../components/isv-profile/isv-profile');
const Lightbox = require('../components/lightbox/lightbox');
const LocalInspector = require('../components/local-inspector/local-inspector');
const Login = require('../components/login/login');
const Logout = require('../components/logout/logout');
const MachineView = require('../components/machine-view/machine-view');
const ModelActions = require('../components/model-actions/model-actions');
const ModalGUISettings = require('../components/modal-gui-settings/modal-gui-settings');
const ModalShortcuts = require('../components/modal-shortcuts/modal-shortcuts');
const NotificationList = require('../components/notification-list/notification-list');
const Panel = require('../components/panel/panel');
const PostDeployment = require('../components/post-deployment/post-deployment');
const Profile = require('../components/profile/profile');
const Sharing = require('../components/sharing/sharing');
const Status = require('../components/status/status');
const SvgIcon = require('../components/svg-icon/svg-icon');
const Terminal = require('../components/terminal/terminal');
const UserMenu = require('../components/user-menu/user-menu');
const USSOLoginLink = require('../components/usso-login-link/usso-login-link');
const Zoom = require('../components/zoom/zoom');

/**
    A mixin for the JujuGUI class.
    Stores all of the component renderer and cleanup methods.
*/
const ComponentRenderersMixin = superclass => class extends superclass {
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
      <Panel
        instanceName="inspector-panel"
        visible={db.services.size() > 0}>
        <AddedServicesList
          changeState={this._bound.changeState}
          findRelatedServices={db.findRelatedServices.bind(db)}
          findUnrelatedServices={db.findUnrelatedServices.bind(db)}
          getUnitStatusCounts={initUtils.getUnitStatusCounts}
          hoveredId={hoveredId}
          hoverService={ServiceModule.hoverService.bind(ServiceModule)}
          panToService={ServiceModule.panToService.bind(ServiceModule)}
          services={db.services}
          updateUnitFlags={db.updateUnitFlags.bind(db)} />
      </Panel>,
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
      <EnvSizeDisplay
        appState={this.state}
        machineCount={machineCount}
        pluralize={initUtils.pluralize.bind(this)}
        serviceCount={serviceCount} />,
      document.getElementById('env-size-display-container'));
  }
  /**
    Renders the model action components to the page in the designated
    element.
  */
  _renderModelActions() {
    const modelAPI = this.modelAPI;
    const displayTerminalButton = (
      this.applicationConfig.flags.terminal ||
      // Always allow for opening the terminal if the user specified a
      // jujushell URL in the GUI settings.
      !!localStorage.getItem('jujushell-url') ||
      // Also allow for opening the terminal if the user deployed the juju
      // shell charm.
      !!this.db.environment.get('jujushellURL')
    );
    ReactDOM.render(
      <ModelActions
        acl={this.acl}
        appState={this.state}
        changeState={this._bound.changeState}
        displayTerminalButton={displayTerminalButton}
        exportEnvironmentFile={
          initUtils.exportEnvironmentFile.bind(initUtils, this.db)}
        hideDragOverNotification={this._hideDragOverNotification.bind(this)}
        importBundleFile={this.bundleImporter.importBundleFile.bind(
          this.bundleImporter)}
        loadingModel={modelAPI.loading}
        renderDragOverNotification={
          this._renderDragOverNotification.bind(this)}
        sharingVisibility={this._sharingVisibility.bind(this)}
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
    const modelAPI = this.modelAPI;
    const grantRevoke = (action, username, access, callback) => {
      if (this.applicationConfig.gisf && username.indexOf('@') === -1) {
        username += '@external';
      }
      action(modelAPI.get('modelUUID'), [username], access, callback);
    };
    const controllerAPI = this.controllerAPI;
    const grantAccess = controllerAPI.grantModelAccess.bind(controllerAPI);
    const revokeAccess = controllerAPI.revokeModelAccess.bind(controllerAPI);
    ReactDOM.render(
      <Sharing
        addNotification={this._bound.addNotification}
        canShareModel={this.acl.canShareModel()}
        closeHandler={this._sharingVisibility.bind(this, false)}
        getModelUserInfo={modelAPI.modelUserInfo.bind(modelAPI)}
        grantModelAccess={grantRevoke.bind(this, grantAccess)}
        humanizeTimestamp={initUtils.humanizeTimestamp}
        revokeModelAccess={grantRevoke.bind(this, revokeAccess)} />, sharing);
  }

  _renderTerminal(address) {
    const config = this.applicationConfig;
    const user = this.user;
    const identityURL = user.identityURL();
    const modelAPI = this.modelAPI;
    const commands = [];
    const modelName = modelAPI.get('environmentName');
    if (modelName) {
      const modelOwner = modelAPI.get('modelOwner');
      commands.push(`juju switch ${modelOwner}/${modelName}`);
    }
    const creds = {};
    if (identityURL && config.gisf) {
      const serialized = user.getMacaroon('identity');
      // Note that the macaroons we provide to jujushell are not the same
      // already stored in the user. For being able to log in to both the
      // controller and models we provide the identity token here, and that's
      // the reason why we cannot use fromShape.
      creds.macaroons = {};
      creds.macaroons[identityURL] = JSON.parse(atob(serialized));
    } else {
      creds.user = user.controller.user;
      creds.password = user.controller.password;
    }
    ReactDOM.render(
      <Terminal
        addNotification={this._bound.addNotification}
        // If a URL has been provided for the jujuShellURL then use it over any
        // provided by the environment.
        address={address}
        changeState={this._bound.changeState}
        commands={commands}
        creds={creds}
        WebSocket={WebSocket} />,
      document.getElementById('terminal-container'));
  }

  _displayTerminal(state, next) {
    const config = this.applicationConfig;
    const db = this.db;
    const githubIssueHref = 'https://github.com/juju/juju-gui/issues/new';
    const githubIssueValues = {
      title: 'Juju shell unavailable',
      body: `GUI Version: ${window.GUI_VERSION.version}
JAAS: ${config.gisf}
Location: ${window.location.href}
Browser: ${navigator.userAgent}`
    };
    const githubIssueLink =
      `${githubIssueHref}?${queryString.stringify(githubIssueValues)}`;
    const address = initUtils.jujushellURL(localStorage, db, config);
    if (!address) {
      // This should never happen.
      let message = 'an unexpected error has occurred please file an issue ';
      let link = <a href={githubIssueLink} key="link" target="_blank">here</a>;
      const jujushell = db.services.getServicesFromCharmName('jujushell')[0];
      if (!jujushell || jujushell.get('pending')) {
        message = 'deploy and expose the "jujushell" charm and try again.';
        link = null;
      } else if (!jujushell.get('aggregated_status').running) {
        message = 'jujushell has not yet been successfully deployed.';
        link = null;
      } else if (jujushell && !jujushell.get('exposed')) {
        message = 'expose the "jujushell" charm and try again.';
        link = null;
      }
      this._bound.addNotification({
        title: 'Unable to open Terminal',
        message: [
          <span key="prefix">Unable to open Terminal, </span>,
          <span key="message">{message}</span>,
          link],
        level: 'error'
      });
      this.state.changeState({terminal: null});
      return;
    }
    this._renderTerminal(address);
    next();
  }

  _clearTerminal(state, next) {
    ReactDOM.unmountComponentAtNode(document.getElementById('terminal-container'));
    next();
  }
  /**
    Renders the ISV profile component.
  */
  _renderISVProfile() {
    ReactDOM.render(
      <ISVProfile
        d3={yui.d3} />,
      document.getElementById('top-page-container'));
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
    // NOTE: we need to clone this.get('users') below; passing in without
    // cloning breaks React's ability to distinguish between this.props and
    // nextProps on the lifecycle methods.
    const charmstore = this.charmstore;
    const payment = this.payment;
    const stripe = this.stripe;
    const userInfo = this._getUserInfo(state);
    ReactDOM.render(
      <Profile
        acl={shapeup.fromShape(this.acl, Profile.propTypes.acl)}
        activeSection={state.hash}
        addNotification={this._bound.addNotification}
        addToModel={this.addToModel.bind(this, charmstore)}
        bakery={this.bakery}
        baseURL={this.applicationConfig.baseUrl}
        changeState={this._bound.changeState}
        charmstore={charmstore}
        controllerAPI={
          shapeup.fromShape(this.controllerAPI, Profile.propTypes.controllerAPI)}
        controllerIP={
          this.controllerAPI.get('socket_url')
            .replace('wss://', '').replace('ws://', '').split(':')[0]}
        controllerIsReady={this._controllerIsReady.bind(this)}
        controllerUser={this.user.controller.user}
        destroyModel={
          initUtils.destroyModel.bind(
            initUtils, this._bound.destroyModels, this.modelAPI, this._bound.switchModel)}
        facadesExist={facadesExist}
        generatePath={this.state.generatePath.bind(this.state)}
        getModelName={this._getModelName.bind(this)}
        getUser={this.identity.getUser.bind(this.identity)}
        gisf={this.applicationConfig.gisf}
        initUtils={shapeup.fromShape(initUtils, Profile.propTypes.initUtils)}
        payment={payment && shapeup.fromShape(payment, Profile.propTypes.payment)}
        sendAnalytics={this.sendAnalytics}
        showPay={this.applicationConfig.flags.pay || false}
        storeUser={this.storeUser.bind(this)}
        stripe={stripe && shapeup.fromShape(stripe, Profile.propTypes.stripe)}
        switchModel={this._bound.switchModel}
        userInfo={shapeup.fromShape(userInfo, Profile.propTypes.userInfo)} />,
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
      <HeaderSearch appState={this.state} />,
      document.getElementById('header-search-container'));
  }

  /**
    Renders the Header Help component to the page.
  */
  _renderHeaderHelp() {
    const openHelp = () => {
      this.state.changeState({
        help: true
      });
    };
    ReactDOM.render(
      <span className="header__button"
        onClick={openHelp.bind(this)}
        role="button"
        tabIndex="0">
        <SvgIcon className="header__button-icon"
          name="help_16"
          size="16" />
        <span className="tooltip__tooltip--below">
          <span className="tooltip__inner tooltip__inner--up">
            Help
          </span>
        </span>
      </span>,
      document.getElementById('header-help'));
  }

  /**
    Renders the shortcuts modal.
  */
  _displayShortcutsModal() {
    ReactDOM.render(
      <ModalShortcuts
        closeModal={this._clearShortcutsModal.bind(this)}
        guiVersion={window.GUI_VERSION.version}
        keybindings={hotkeys.keyBindings} />,
      document.getElementById('modal-shortcuts'));
  }

  _displaySettingsModal() {
    ReactDOM.render(
      <ModalGUISettings
        closeModal={this._clearSettingsModal.bind(this)}
        localStorage={localStorage} />,
      document.getElementById('modal-gui-settings'));
  }

  /**
    Opents the lightbox with provided content.

    @param {Object} content React Element.
    @param {String} caption A string to display under the content.
  */
  _displayLightbox(content, caption) {
    ReactDOM.render(
      <Lightbox
        caption={caption}
        close={this._clearLightbox.bind(this)}>
        {content}
      </Lightbox>,
      document.getElementById('lightbox'));
  }

  /**
    Opens the help overlay.
  */
  _renderHelp(state, next) {
    const handler = new WebHandler();
    ReactDOM.render(<Help
      changeState={this._bound.changeState}
      displayShortcutsModal={this._displayShortcutsModal.bind(this)}
      gisf={this.applicationConfig.gisf}
      sendGetRequest={handler.sendGetRequest.bind(handler)}
      staticURL={this.applicationConfig.staticURL || ''}
      user={this.user}
      youtubeAPIKey={this.applicationConfig.youtubeAPIKey} />,
    document.getElementById('help')
    );
    next();
  }

  /**
    Remove the help overlay.
  */
  _clearHelp(state, next) {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('help')
    );
  }

  /**
    Display post deployment help.

    @param {Object} state The current state.
    @param {Function} next Run the next handler.
  */
  _displayPostDeployment(state, next) {
    if (!state.postDeploymentPanel.show) {
      next();
      return;
    }

    const entityId = state.postDeploymentPanel.entityId;
    // If no new applications have been deployed then there's no need to
    // display the panel.
    if (entityId) {
      const nowMillis = new Date().getTime();

      this.postDeploymentPanel = {
        openTime: nowMillis,
        entityId: entityId
      };

      const charmstore = this.charmstore;

      const showEntityDetails = id => {
        let url;
        try {
          url = window.jujulib.URL.fromString(id);
        } catch (_) {
          url = window.jujulib.URL.fromLegacyString(id);
        }

        const storeState = {
          profile: null,
          search: null,
          store: url.path()
        };

        this.state.changeState(storeState);
      };

      ReactDOM.render(
        <PostDeployment
          changeState={this._bound.changeState}
          entityId={entityId}
          getEntity={charmstore.getEntity.bind(charmstore)}
          getFile={charmstore.getFile.bind(charmstore)}
          makeEntityModel={jujulibConversionUtils.makeEntityModel}
          marked={marked}
          showEntityDetails={showEntityDetails.bind(this, entityId)} />,
        document.getElementById('post-deployment')
      );
    }

    next();
  }

  /**
    The cleanup dispatcher keyboard shortcuts modal.
  */
  _clearShortcutsModal() {
    ReactDOM.unmountComponentAtNode(document.getElementById('modal-shortcuts'));
  }
  /**
    The cleanup dispatcher global settings modal.
  */
  _clearSettingsModal() {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('modal-gui-settings'));
  }

  /**
    Remove the lightbox.
  */
  _clearLightbox() {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('lightbox')
    );
  }

  /**
    Remove post deployment.

    @param {Object} state The current state.
    @param {Function} next Run the next handler.
  */
  _clearPostDeployment(state, next) {
    const closeTime = new Date().getTime();

    if (this.postDeploymentPanel
      && this.postDeploymentPanel.openTime
      && this.postDeploymentPanel.entityId) {
      const entityId = this.postDeploymentPanel.entityId;
      const openTime = this.postDeploymentPanel.openTime;
      const action = 'Close post deployment panel';

      // Round it to the nearest second.
      let timeOpen = Math.round(
        (closeTime - openTime) / 1000
      );
      let args = [
        `${timeOpen}s`,
        entityId
      ];

      this.sendAnalytics(
        'Deployment Flow',
        action,
        args.join(' - ')
      );
    }

    ReactDOM.unmountComponentAtNode(
      document.getElementById('post-deployment')
    );
    next();
  }

  _renderHeaderLogo() {
    const userName = this.user.displayName;
    const gisf = this.applicationConfig.gisf;
    const homePath = gisf ? '/' :
      this.state.generatePath({profile: userName});
    ReactDOM.render(
      <HeaderLogo
        gisf={gisf}
        homePath={homePath}
        showProfile={initUtils.showProfile.bind(this, this._bound.changeState, userName)} />,
      document.getElementById('header-logo'));
  }

  /**
    Renders the Charmbrowser component to the page in the designated element.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _renderCharmbrowser(state, next) {
    const charmstore = this.charmstore;
    // Configure syntax highlighting for the markdown renderer.
    marked.setOptions({
      highlight: function(code, lang) {
        const language = prismLanguages[lang];
        if (language) {
          return Prism.highlight(code, language);
        }
      }
    });
    /*
     Retrieve from the charm store information on the charm or bundle with
     the given new style id.

     @returns {Object} The XHR reference for the getEntity call.
    */
    const getEntity = (id, callback) => {
      let url;
      try {
        url = window.jujulib.URL.fromString(id);
      } catch(err) {
        callback(err, {});
        return;
      }
      // Get the entity and return the XHR.
      return charmstore.getEntity(url.legacyPath(), callback);
    };
    ReactDOM.render(
      <Charmbrowser
        acl={this.acl}
        addNotification={this._bound.addNotification}
        addToModel={this.addToModel.bind(this, charmstore)}
        apiUrl={charmstore.url}
        apiVersion={window.jujulib.charmstoreAPIVersion}
        appState={this.state}
        charmstoreSearch={charmstore.search.bind(charmstore)}
        charmstoreURL={
          viewUtils.ensureTrailingSlash(window.juju_config.charmstoreURL)}
        clearLightbox={this._clearLightbox.bind(this)}
        deployService={this.deployService.bind(this)}
        displayLightbox={this._displayLightbox.bind(this)}
        flags={window.juju_config.flags}
        getBundleYAML={charmstore.getBundleYAML.bind(charmstore)}
        getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
        getEntity={getEntity}
        getFile={charmstore.getFile.bind(charmstore)}
        getModelName={this._getModelName.bind(this)}
        gisf={this.applicationConfig.gisf}
        importBundleYAML={this.bundleImporter.importBundleYAML.bind(
          this.bundleImporter)}
        listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
        makeEntityModel={jujulibConversionUtils.makeEntityModel}
        renderMarkdown={marked}
        sendAnalytics={this.sendAnalytics}
        series={viewUtils.getSeriesList()}
        setPageTitle={this.setPageTitle.bind(this)}
        showTerms={this.terms.showTerms.bind(this.terms)}
        staticURL={this.applicationConfig.staticURL || ''}
        urllib={window.jujulib.URL}
        utils={initUtils} />,
      document.getElementById('charmbrowser-container'));
    next();
  }
  /**
    The cleanup dispatcher for the store state path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearCharmbrowser(state, next) {
    if (state.search || state.store) {
      // State calls the cleanup methods on every dispatch even if the state
      // object exists between calls. Maybe this should be updated in state
      // but for now if we know that the new state still contains the
      // charmbrowser then just let the subsequent render method update
      // the rendered component.
      return;
    }
    ReactDOM.unmountComponentAtNode(
      document.getElementById('charmbrowser-container'));
    next();
  }

  _clearAllGUIComponents(state, next) {
    const noop = () => {};
    this._clearMachineView(state, noop);
    this._clearDeployment(state, noop);
    this._clearInspector(state, noop);
  }
  /**
    Handles rendering and/or updating the machine UI component.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _renderMachineView(state, next) {
    const db = this.db;
    const modelAPI = this.modelAPI;
    const ecs = modelAPI.get('ecs');
    const decorated = MachineView.DecoratedComponent;
    const propTypes = decorated.propTypes;
    ReactDOM.render(
      <MachineView
        acl={shapeup.fromShape(this.acl, propTypes.acl)}
        changeState={this._bound.changeState}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: initUtils.addGhostAndEcsUnits.bind(
            this, db, modelAPI),
          applications: db.services,
          modelName: db.environment.get('name') || '',
          machines: db.machines,
          units: db.units
        })}
        generateMachineDetails={initUtils.generateMachineDetails.bind(
          initUtils, modelAPI.genericConstraints, db.units)}
        machine={this.state.current.gui.machines}
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: autodeploy.autoPlaceUnits.bind(this, db, modelAPI),
          createMachine: autodeploy.createMachine.bind(this, db, modelAPI),
          destroyMachines: modelAPI.destroyMachines.bind(modelAPI),
          placeUnit: modelAPI.placeUnit.bind(modelAPI),
          providerType: modelAPI.get('providerType') || '',
          removeUnits: modelAPI.remove_units.bind(modelAPI),
          updateMachineConstraints: ecs.updateMachineConstraints.bind(ecs),
          updateMachineSeries: ecs.updateMachineSeries.bind(ecs)
        })}
        parseConstraints={initUtils.parseConstraints.bind(
          initUtils, modelAPI.genericConstraints)}
        parseMachineName={db.machines.parseMachineName.bind(db.machines)}
        sendAnalytics={this.sendAnalytics}
        series={window.jujulib.CHARM_SERIES} />,
      document.getElementById('machine-view'));
    next();
  }

  /**
    The cleanup dispatcher for the machines state path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearMachineView(state, next) {
    ReactDOM.unmountComponentAtNode(document.getElementById('machine-view'));
    next();
  }

  /**
    Handles rendering and/or updating the status UI component.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _renderStatusView(state, next) {
    const propTypes = Status.propTypes;
    ReactDOM.render(
      <Status
        changeState={this._bound.changeState}
        db={shapeup.fromShape(this.db, propTypes.db)}
        generatePath={this.state.generatePath.bind(this.state)}
        model={shapeup.fromShape(this.modelAPI.getAttrs(), propTypes.model)}
        urllib={shapeup.fromShape(window.jujulib.URL, propTypes.urllib)} />,
      document.getElementById('status-container')
    );
    next();
  }

  /**
    The cleanup dispatcher for the status state path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearStatusView(state, next) {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('status-container'));
    next();
  }

  /**
    Renders the Inspector component to the page.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _renderInspector(state, next) {
    const instance = this.topology;
    if (!instance) {
      return;
    }
    const topo = instance.topo;
    const charmstore = this.charmstore;
    let inspector = {};
    const inspectorState = state.gui.inspector;
    const service = this.db.services.getById(inspectorState.id);
    const localType = inspectorState.localType;
    // If there is a hoverService event listener then we need to detach it
    // when rendering the inspector.
    const hoverHandler = this._domEventHandlers['topo.hoverService'];
    if (hoverHandler) {
      document.removeEventListener('topo.hoverService', hoverHandler);
    }
    const model = this.modelAPI;
    const db = this.db;
    // If the url was provided with a service id which isn't in the localType
    // db then change state back to the added services list. This usually
    // happens if the user tries to visit the inspector of a ghost service
    // id which no longer exists.
    if (service) {
      // Select the service token.
      topo.modules.ServiceModule.selectService(service.get('id'));
      const charm = db.charms.getById(service.get('charm'));
      const relatableApplications = relationUtils.getRelatableApplications(
        db, endpointUtils.getEndpoints(service, this.endpointsController));
      const ecs = model.get('ecs');
      const addCharm = (url, callback, options) => {
        model.addCharm(url, charmstore, callback, options);
      };
      inspector = (
        <Inspector
          acl={this.acl}
          addCharm={addCharm}
          addGhostAndEcsUnits={initUtils.addGhostAndEcsUnits.bind(
            this, db, model, service)}
          addNotification={this._bound.addNotification}
          appState={this.state}
          charm={charm}
          clearState={initUtils.clearState.bind(this, topo)}
          createMachinesPlaceUnits={initUtils.createMachinesPlaceUnits.bind(
            this, db, model, service)}
          createRelation={relationUtils.createRelation.bind(this, db, model)}
          destroyRelations={relationUtils.destroyRelations.bind(
            this, db, model)}
          destroyService={initUtils.destroyService.bind(
            this, db, model, service)}
          destroyUnits={model.remove_units.bind(model)}
          displayPlans={initUtils.compareSemver(
            this.applicationConfig.jujuCoreVersion, '2') > -1}
          entityPath={window.jujulib.URL.fromAnyString(charm.get('id')).path()}
          envResolved={model.resolved.bind(model)}
          exposeService={model.expose.bind(model)}
          getAvailableEndpoints={relationUtils.getAvailableEndpoints.bind(
            this, this.endpointsController, db, endpointUtils.getEndpoints)}
          getAvailableVersions={charmstore.getAvailableVersions.bind(
            charmstore)}
          getCharm={model.get_charm.bind(model)}
          getServiceById={db.services.getById.bind(db.services)}
          getServiceByName={db.services.getServiceByName.bind(db.services)}
          getUnitStatusCounts={initUtils.getUnitStatusCounts}
          getYAMLConfig={initUtils.getYAMLConfig.bind(this)}
          linkify={initUtils.linkify}
          modelUUID={this.modelUUID || ''}
          providerType={model.get('providerType') || ''}
          relatableApplications={relatableApplications}
          service={service}
          serviceRelations={
            relationUtils.getRelationDataForService(db, service)}
          setCharm={model.setCharm.bind(model)}
          setConfig={model.set_config.bind(model)}
          showActivePlan={this.plans.showActivePlan.bind(this.plans)}
          showPlans={window.juju_config.flags.plans || false}
          unexposeService={model.unexpose.bind(model)}
          unplaceServiceUnits={ecs.unplaceServiceUnits.bind(ecs)}
          updateServiceUnitsDisplayname={
            db.updateServiceUnitsDisplayname.bind(db)} />
      );
    } else if (localType && window.localCharmFile) {
      // When dragging a local charm zip over the canvas it animates the
      // drag over notification which needs to be closed when the inspector
      // is opened.
      this._hideDragOverNotification();
      inspector = (
        <LocalInspector
          acl={this.acl}
          changeState={this._bound.changeState}
          file={window.localCharmFile}
          localType={localType}
          series={viewUtils.getSeriesList()}
          services={db.services}
          upgradeServiceUsingLocalCharm={
            localCharmHelpers.upgradeServiceUsingLocalCharm.bind(
              this, model, db)}
          uploadLocalCharm={
            localCharmHelpers.uploadLocalCharm.bind(
              this, model, db)} />
      );
    } else {
      this.state.changeState({gui: {inspector: null}});
      return;
    }
    ReactDOM.render(
      <Panel
        instanceName="inspector-panel"
        visible={true}>
        {inspector}
      </Panel>,
      document.getElementById('inspector-container'));
    next();
  }
  /**
    The cleanup dispatcher for the inspector state path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearInspector(state, next) {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('inspector-container'));
    next();
  }
  /**
    Renders the Deployment component to the page in the
    designated element.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _renderDeployment(state, next) {
    const modelAPI = this.modelAPI;
    const db = this.db;
    const connected = this.modelAPI.get('connected');
    const modelName = modelAPI.get('environmentName') || 'mymodel';
    const ecs = modelAPI.get('ecs');
    const currentChangeSet = ecs.getCurrentChangeSet();
    const deployState = state.gui.deploy;
    const ddData = deployState ? JSON.parse(deployState) : null;
    if (Object.keys(currentChangeSet).length === 0 && !ddData) {
      // If there are no changes then close the deployment flow. This is to
      // prevent showing the deployment flow if the user clicks back in the
      // browser or navigates directly to the url. This changeState needs to
      // happen in app.js, not the component otherwise it will have to try and
      // interrupt the mount to unmount the component.
      this.state.changeState({
        gui: {
          deploy: null
        }
      });
      return;
    }
    const controllerAPI = this.controllerAPI;
    const services = db.services;
    // Auto place the units. This is probably not the best UX, but is required
    // to display the machines in the deployment flow.
    autodeploy.autoPlaceUnits(db, modelAPI);
    let cloud = modelAPI.get('providerType');
    if (cloud) {
      cloud = {
        cloudType: cloud,
        name: modelAPI.get('cloud')
      };
    }
    const getUserName = () => {
      return this.user.username;
    };
    const loginToController = controllerAPI.loginWithMacaroon.bind(
      controllerAPI, this.bakery);
    const charmstore = this.charmstore;
    const isLoggedIn = () => this.controllerAPI.userIsAuthenticated;
    const autoPlaceUnits = autodeploy.autoPlaceUnits.bind(null, db, modelAPI);
    ReactDOM.render(
      <DeploymentFlow
        acl={this.acl}
        addAgreement={this.terms.addAgreement.bind(this.terms)}
        addNotification={this._bound.addNotification}
        addSSHKeys={modelAPI.addKeys.bind(modelAPI)}
        applications={services.toArray()}
        changes={currentChangeSet}
        changesFilterByParent={
          changesUtils.filterByParent.bind(changesUtils, currentChangeSet)}
        changeState={this._bound.changeState}
        charmsGetById={db.charms.getById.bind(db.charms)}
        charmstore={charmstore}
        cloud={cloud}
        controllerIsReady={this._controllerIsReady.bind(this)}
        createCardElement={
          this.stripe && this.stripe.createCardElement.bind(this.stripe)}
        createToken={this.stripe && this.stripe.createToken.bind(this.stripe)}
        createUser={
          this.payment && this.payment.createUser.bind(this.payment)}
        credential={modelAPI.get('credential')}
        ddData={ddData}
        deploy={initUtils.deploy.bind(
          viewUtils, this, autoPlaceUnits, initUtils.createSocketURL)}
        formatConstraints={viewUtils.formatConstraints.bind(viewUtils)}
        generateAllChangeDescriptions={
          changesUtils.generateAllChangeDescriptions.bind(
            changesUtils, services, db.units)}
        generateChangeDescription={
          changesUtils.generateChangeDescription.bind(
            changesUtils, services, db.units)}
        generateCloudCredentialName={initUtils.generateCloudCredentialName}
        generateMachineDetails={
          initUtils.generateMachineDetails.bind(
            initUtils, modelAPI.genericConstraints, db.units)}
        generatePath={this.state.generatePath.bind(this.state)}
        getAgreementsByTerms={
          this.terms.getAgreementsByTerms.bind(this.terms)}
        getCloudCredentialNames={
          controllerAPI.getCloudCredentialNames.bind(controllerAPI)}
        getCloudCredentials={
          controllerAPI.getCloudCredentials.bind(controllerAPI)}
        getCloudProviderDetails={initUtils.getCloudProviderDetails.bind(initUtils)}
        getCountries={
          this.payment && this.payment.getCountries.bind(this.payment)
            || null}
        getCurrentChangeSet={ecs.getCurrentChangeSet.bind(ecs)}
        getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
        getEntity={charmstore.getEntity.bind(charmstore)}
        getGithubSSHKeys={window.jujugui.sshKeys.githubSSHKeys}
        getServiceByName={services.getServiceByName.bind(services)}
        getUser={this.payment && this.payment.getUser.bind(this.payment)}
        getUserName={getUserName}
        gisf={this.gisf}
        groupedChanges={changesUtils.getGroupedChanges(currentChangeSet)}
        gtmEnabled={this.applicationConfig.GTM_enabled}
        importSSHKeys={modelAPI.importKeys.bind(modelAPI)}
        isLoggedIn={isLoggedIn}
        listBudgets={this.plans.listBudgets.bind(this.plans)}
        listClouds={controllerAPI.listClouds.bind(controllerAPI)}
        listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
        loginToController={loginToController}
        makeEntityModel={jujulibConversionUtils.makeEntityModel}
        modelCommitted={connected}
        modelName={modelName}
        profileUsername={this._getUserInfo(state).profile}
        region={modelAPI.get('region')}
        renderMarkdown={marked}
        sendAnalytics={this.sendAnalytics}
        setModelName={modelAPI.set.bind(modelAPI, 'environmentName')}
        showPay={this.applicationConfig.flags.pay || false}
        showTerms={this.terms.showTerms.bind(this.terms)}
        sortDescriptionsByApplication={
          changesUtils.sortDescriptionsByApplication.bind(null,
            services.getById.bind(services))}
        stats={this.stats}
        updateCloudCredential={
          controllerAPI.updateCloudCredential.bind(controllerAPI)}
        username={this.user ? this.user.displayName : undefined}
        validateForm={initUtils.validateForm.bind(initUtils)}
        WebHandler={WebHandler}
        withPlans={false} />,
      document.getElementById('deployment-container'));
  }
  /**
    Report whether the controller API connection is ready, connected and
    authenticated.
    @return {Boolean} Whether the controller is ready.
  */
  _controllerIsReady() {
    return !!(
      this.controllerAPI &&
      this.controllerAPI.get('connected') &&
      this.controllerAPI.userIsAuthenticated
    );
  }
  /**
    The cleanup dispatcher for the deployment flow state path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearDeployment(state, next) {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('deployment-container'));
    next();
  }
  /**
    Renders the Deployment component to the page in the
    designated element.
  */
  _renderDeploymentBar() {
    var modelAPI = this.modelAPI;
    var ecs = modelAPI.get('ecs');
    var db = this.db;
    var services = db.services;
    var servicesArray = services.toArray();
    var machines = db.machines.toArray();
    var units = db.units;
    ReactDOM.render(
      <DeploymentBar
        acl={this.acl}
        changeState={this._bound.changeState}
        currentChangeSet={ecs.getCurrentChangeSet()}
        generateChangeDescription={
          changesUtils.generateChangeDescription.bind(
            changesUtils, services, units)}
        hasEntities={servicesArray.length > 0 || machines.length > 0}
        modelCommitted={this.modelAPI.get('connected')}
        sendAnalytics={this.sendAnalytics} />,
      document.getElementById('deployment-bar-container'));
  }

  /**
    Renders the login component.

    @method _renderLogin
    @param {String} err Possible authentication error, or null if no error
      message must be displayed.
  */
  _renderLogin(err) {
    document.getElementById('loading-message').style.display = 'none';
    const loginToController = () => {
      this.loginToAPIs(null, true, [this.controllerAPI]);
    };
    const controllerIsConnected = () => {
      return this.controllerAPI && this.controllerAPI.get('connected');
    };
    ReactDOM.render(
      <Login
        addNotification={this._bound.addNotification}
        controllerIsConnected={controllerIsConnected}
        errorMessage={err}
        gisf={this.applicationConfig.gisf}
        loginToAPIs={this.loginToAPIs.bind(this)}
        loginToController={loginToController} />,
      document.getElementById('login-container'));
  }

  /**
    The cleanup dispatcher for the root state path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearLogin(state, next) {
    ReactDOM.unmountComponentAtNode(document.getElementById('login-container'));
    if (next) {
      next();
    }
  }

  /**
    Renders the Log out component or log in link depending on the
    modelAPIironment the GUI is executing in.
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
    const _USSOLoginLink = (
      <USSOLoginLink
        addNotification={this._bound.addNotification}
        displayType="text"
        loginToController={
          controllerAPI.loginWithMacaroon.bind(controllerAPI, bakery)} />);
    let logoutUrl = '/logout';
    const applicationConfig = this.applicationConfig;
    if (applicationConfig.baseUrl) {
      logoutUrl = applicationConfig.baseUrl.replace(/\/?$/, logoutUrl);
    }
    const doCharmstoreLogout = () => {
      return this.getUser('charmstore') && !applicationConfig.gisf;
    };
    const LogoutLink = (<Logout
      charmstoreLogoutUrl={charmstore.getLogoutUrl()}
      doCharmstoreLogout={doCharmstoreLogout}
      locationAssign={window.location.assign.bind(window.location)}
      logoutUrl={logoutUrl}
      // If the charmbrowser is open then don't show the logout link.
      visible={!this.state.current.store} />);

    const navigateUserProfile = () => {
      const username = this.user.displayName;
      if (!username) {
        return;
      }
      initUtils.showProfile(this._bound.changeState, username);
    };

    const showHelp = () => {
      this.state.changeState({
        help: true
      });
    };

    ReactDOM.render(<UserMenu
      controllerAPI={controllerAPI}
      LogoutLink={LogoutLink}
      navigateUserProfile={navigateUserProfile}
      showHelp={showHelp}
      USSOLoginLink={_USSOLoginLink} />, linkContainer);
  }

  /**
    Renders the breadcrumb component to the DOM.
  */
  _renderBreadcrumb() {
    const modelAPI = this.modelAPI;
    const controllerAPI = this.controllerAPI;
    let showEnvSwitcher = true;
    let listModelsWithInfo = controllerAPI && this._bound.listModelsWithInfo;
    // If controller is undefined then do not render the switcher because
    // there is no controller to connect to. It will be undefined when the
    // breadcrumb is initially rendered because it hasn't yet been given
    // time to connect and login.
    if (!controllerAPI) {
      // We do not want to show the model switcher if it isn't supported as
      // it throws an error in the browser console and confuses the user
      // as it's visible but not functional.
      showEnvSwitcher = false;
    }
    // It's possible that we have a controller instance and no facade if
    // we've connected but have not yet successfully logged in. This will
    // prevent the model switcher from rendering but after the login this
    // component will be re-rendered.
    if (controllerAPI &&
      controllerAPI.findFacadeVersion('ModelManager') === null) {
      showEnvSwitcher = false;
    }
    ReactDOM.render(
      <HeaderBreadcrumb
        acl={this.acl}
        addNotification={this._bound.addNotification}
        appState={this.state}
        changeState={this._bound.changeState}
        humanizeTimestamp={initUtils.humanizeTimestamp}
        listModelsWithInfo={listModelsWithInfo}
        loadingModel={modelAPI.loading}
        modelCommitted={!!modelAPI.get('modelUUID')}
        modelName={this.db.environment.get('name')}
        modelOwner={modelAPI.get('modelOwner')}
        setModelName={modelAPI.set.bind(modelAPI, 'environmentName')}
        showEnvSwitcher={showEnvSwitcher}
        showProfile={initUtils.showProfile.bind(this, this._bound.changeState)}
        switchModel={this._bound.switchModel}
        user={this.user} />,
      document.getElementById('header-breadcrumb'));
  }
  /**
    Renders the logo for the current cloud provider.
  */
  _renderProviderLogo() {
    const container = document.getElementById('provider-logo-container');
    const cloudProvider = this.modelAPI.get('providerType');
    let providerDetails = initUtils.getCloudProviderDetails(cloudProvider);
    const currentState = this.state.current || {};
    const isDisabled = (
      // There is no provider.
      !cloudProvider ||
      // It's not possible to get provider details.
      !providerDetails ||
      // We are in the profile page.
      currentState.profile ||
      // We are in the account page.
      currentState.root === 'account'
    );
    const classes = classNames(
      'provider-logo',
      {
        'provider-logo--disabled': isDisabled,
        [`provider-logo--${cloudProvider}`]: cloudProvider
      }
    );
    const scale = 0.65;
    if (!providerDetails) {
      // It's possible that the GUI is being run on a provider that we have
      // not yet setup in the cloud provider details.
      providerDetails = {};
    }
    ReactDOM.render(
      <div className={classes}>
        <SvgIcon
          height={providerDetails.svgHeight * scale}
          name={providerDetails.id || ''}
          width={providerDetails.svgWidth * scale} />
      </div>,
      container);
  }
  /**
    Renders the notification component to the page in the designated element.
  */
  _renderNotifications(e) {
    let notification = null;
    if (e && e.details) {
      notification = e.details[0].model.getAttrs();
    }
    ReactDOM.render(
      <NotificationList
        notification={notification} />,
      document.getElementById('notifications-container'));
  }
  /**
    Renders the mask and animations for the drag over notification for when
    a user drags a yaml file or zip file over the canvas.
    @param {Boolean} showIndicator
  */
  _renderDragOverNotification(showIndicator = true) {
    this.topology.fadeHelpIndicator(showIndicator);
    ReactDOM.render(
      <ExpandingProgress />,
      document.getElementById('drag-over-notification-container'));
  }
  /**
    Hide the drag notifications.
  */
  _hideDragOverNotification() {
    this.topology.fadeHelpIndicator(false);
    ReactDOM.unmountComponentAtNode(
      document.getElementById('drag-over-notification-container'));
  }
  /**
    Renders the zoom component to the page in the designated element.
  */
  _renderZoom() {
    ReactDOM.render(
      <Zoom
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
