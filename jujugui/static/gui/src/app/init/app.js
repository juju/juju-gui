/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const queryString = require('query-string');
const React = require('react');
const shapeup = require('shapeup');
const jaaslib = require('jaaslib');

const urls = jaaslib.urls;

const yui = window.yui;

const autodeploy = require('./autodeploy');
const cookieUtil = require('./cookie-util');
const initUtils = require('./utils');
const localCharmHelpers = require('../components/local-inspector/local-charm-import-helpers');
const changesUtils = require('./changes-utils');
const relationUtils = require('./relation-utils');
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
const Notification = require('../components/notification/notification');
const NotificationList = require('../components/notification-list/notification-list');
const Panel = require('../components/panel/panel');
const Popup = require('../components/popup/popup');
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
    A component to render the app.
*/
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragOverNotificationVisible: false,
      hoveredService: null,
      lightbox: false,
      loginNotificiationURL: null,
      popupAction: null,
      settingsModalVisible: false,
      sharingVisible: false,
      shortcutsModalVisible: false
    };
    /**
      A collection of pre-bound methods to pass to render methods.
      @type {Object}
    */
    this._bound = this._bindRenderUtilities();
    /**
      A mapping of bound methods to events.
      @type {Object}
    */
    this._domEventHandlers = {};
  }

  componentDidMount() {
    // Trigger the resized method so that the topology fills the viewport.
    this.props.topology.topo.modules.ViewportModule.resized();
    // Subscribe to events for code outside the React components that need to
    // control App state.
    this._addEvent('loginNotification', this._loginNotificationListener.bind(this));
    this._addEvent('displaySettingsModal', this._settingsModalListener.bind(this));
    this._addEvent('displayShortcutsModal', this._shortcutsModalListener.bind(this));
    this._addEvent('hideModals', this._hideModalsListener.bind(this));
    this._addEvent('popupAction', this._popupActionListener.bind(this));
    this._addEvent('showDragOverNotification', this._dragOverNotificationListener.bind(this));
  }

  componentDidUpdate(prevProps, prevState) {
    const currentGUI = this.props.appState.current.gui;
    const currrentLocalType = currentGUI && currentGUI.inspector &&
      currentGUI.inspector.localType;
    // If the local inspector has just been shown then hide the drag over message.
    if (currrentLocalType && this.state.dragOverNotificationVisible) {
      this._showDragOverNotification(false);
    }
  }

  componentWillUnmount() {
    Object.keys(this._domEventHandlers).forEach(eventType => this._removeEvent(eventType));
  }

  /**
   Check that a state parameter is not set.
   @param key {Any} A state key.
   @returns {Bool} Whether the parameter is set.
   */
  _isSet(key) {
    // Some state keys are set to empty strings which JavaScript treats as falsey
    // but we want them to be truthy.
    return key !== undefined && key !== null && key !== false;
  }

  /**
   Add an event listener and store the bound method.
   @param eventType {String} The type of event.
   @param method {Function} The function to call when the event is fired.
   */
  _addEvent(eventType, method) {
    this._domEventHandlers[eventType] = method;
    document.addEventListener(eventType, method);
  }

  /**
   Remove an event listener.
   @param eventType {String} The type of event.
   */
  _removeEvent(eventType) {
    document.removeEventListener(eventType, this._domEventHandlers[eventType]);
  }

  /**
    As a minor performance boost and to avoid potential rerenderings
    because of rebinding functions in the render methods. Any method that
    requires binding and is passed into components should be bound here
    and then used across components.
    @returns {Object} The bound methods.
  */
  _bindRenderUtilities() {
    return {
      addNotification: this.props.db.notifications.add.bind(this.props.db.notifications),
      changeState: this.props.appState.changeState.bind(this.props.appState),
      destroyModels: this.props.controllerAPI.destroyModels.bind(this.props.controllerAPI),
      listModelsWithInfo: this.props.controllerAPI.listModelsWithInfo.bind(
        this.props.controllerAPI)
    };
  }

  /**
    The method to call for loginNotification event changes.
    @param evt {String} The event details.
  */
  _loginNotificationListener(evt) {
    this.setState({ loginNotificiationURL: evt.detail });
  }

  /**
    The method to call for displaySettingsModal event changes.
  */
  _settingsModalListener() {
    this.setState({
      settingsModalVisible: !this.state.settingsModalVisible,
      shortcutsModalVisible: false
    });
  }

  /**
    The method to call for displayShortcutsModal event changes.
  */
  _shortcutsModalListener() {
    this.setState({
      settingsModalVisible: false,
      shortcutsModalVisible: !this.state.shortcutsModalVisible
    });
  }

  /**
    The method to call for hideModals event changes.
  */
  _hideModalsListener() {
    this.setState({
      settingsModalVisible: false,
      shortcutsModalVisible: false
    });
  }

  /**
    The method to call for showDragOverNotification event changes.
    @param evt {String} The event details.
  */
  _dragOverNotificationListener(evt) {
    this._showDragOverNotification(evt.detail);
  }

  /**
    The method to call for popupAction event changes.
    @param evt {String} The event details.
  */
  _popupActionListener(evt) {
    this.setState({ popupAction: evt.detail });
  }

  /**
    Get the current model name.
    @returns {String} The current model name.
  */
  _getModelName() {
    return this.props.modelAPI.get('environmentName');
  }

  /**
    Renders the Added Services component to the page in the appropriate
    element.
  */
  _generateAddedServices() {
    const gui = this.props.appState.current.gui;
    // Don't display the added services component when the inspector is visible.
    if (gui && gui.inspector) {
      return null;
    }
    const instance = this.props.topology;
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
      this._removeEvent('topo.hoverService');
    }
    const onHover = evt => {
      this.setState({ hoveredService: evt.detail.id });
    };
    this._addEvent('topo.hoverService', onHover);
    // Deselect the active service token. This needs to happen so that when a
    // user closes the service details the service token deactivates.
    ServiceModule.deselectNodes();
    const db = this.props.db;
    return (
      <Panel
        instanceName="inspector-panel"
        visible={db.services.size() > 0}>
        <AddedServicesList
          changeState={this._bound.changeState}
          hoveredId={this.state.hoveredService}
          serviceModule={
            shapeup.fromShape(ServiceModule, AddedServicesList.propTypes.serviceModule)}
          services={db.services} />
      </Panel>);
  }
  /**
    Renders the Environment Size Display component to the page in the
    designated element.
  */
  _generateEnvSizeDisplay() {
    const { db } = this.props;
    return (
      <EnvSizeDisplay
        appState={this.props.appState}
        machineCount={db.machines.filterByParent().length}
        providerType={this.props.modelAPI.get('providerType') || ''}
        serviceCount={db.services.size()} />);
  }
  /**
    Renders the model action components to the page in the designated
    element.
  */
  _generateModelActions() {
    const modelAPI = this.props.modelAPI;
    return (
      <div id="model-actions-container">
        <ModelActions
          acl={this.props.acl}
          appState={this.props.appState}
          changeState={this._bound.changeState}
          displayTerminalButton={this._enableTerminal()}
          exportEnvironmentFile={
            initUtils.exportEnvironmentFile.bind(initUtils, this.db, this.sendAnalytics)}
          hideDragOverNotification={this._showDragOverNotification.bind(this, false)}
          importBundleFile={this.props.bundleImporter.importBundleFile.bind(
            this.props.bundleImporter)}
          loadingModel={modelAPI.loading}
          renderDragOverNotification={
            this._showDragOverNotification.bind(this)}
          sharingVisibility={this._sharingVisibility.bind(this)}
          userIsAuthenticated={modelAPI.userIsAuthenticated} />
      </div>);
  }
  /**
    Display or hide the sharing modal.
    @param {Boolean} visibility Controls whether to show (true) or hide
                     (false); defaults to true.
  */
  _sharingVisibility(visibility = true) {
    this.setState({ sharingVisible: visibility });
  }

  /**
    Generate the sharing modal.
  */
  _generateSharing() {
    if (!this.state.sharingVisible) {
      return null;
    }
    const modelAPI = this.props.modelAPI;
    const grantRevoke = (action, username, access, callback) => {
      if (this.props.applicationConfig.gisf && username.indexOf('@') === -1) {
        username += '@external';
      }
      action(modelAPI.get('modelUUID'), [username], access, callback);
    };
    const controllerAPI = this.props.controllerAPI;
    const grantAccess = controllerAPI.grantModelAccess.bind(controllerAPI);
    const revokeAccess = controllerAPI.revokeModelAccess.bind(controllerAPI);
    return (
      <Sharing
        addNotification={this._bound.addNotification}
        canShareModel={this.props.acl.canShareModel()}
        closeHandler={this._sharingVisibility.bind(this, false)}
        getModelUserInfo={modelAPI.modelUserInfo.bind(modelAPI)}
        grantModelAccess={grantRevoke.bind(this, grantAccess)}
        revokeModelAccess={grantRevoke.bind(this, revokeAccess)} />);
  }

  _generateTerminal(address, payload) {
    const config = this.props.applicationConfig;
    const user = this.props.user;
    const identityURL = user.identityURL();
    const modelAPI = this.props.modelAPI;
    const commands = [];
    const modelName = modelAPI.get('environmentName');
    if (modelName) {
      const modelOwner = modelAPI.get('modelOwner');
      commands.push(`juju switch ${modelOwner}/${modelName}`);
    }
    if (Array.isArray(payload)) {
      payload.forEach(command => {
        commands.push(command);
      });
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
    return (
      <Terminal
        addNotification={this._bound.addNotification}
        // If a URL has been provided for the jujuShellURL then use it over any
        // provided by the environment.
        address={address}
        changeState={this._bound.changeState}
        commands={commands}
        creds={creds}
        WebSocket={WebSocket} />);
  }

  _displayTerminal() {
    const state = this.props.appState.current;
    if (!state.terminal) {
      return null;
    }
    const config = this.props.applicationConfig;
    const db = this.props.db;
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
      this.props.appState.changeState({terminal: null});
      return;
    }
    const payload = state.terminal;
    return this._generateTerminal(address, payload);
  }
  /**
    Renders the ISV profile component.
  */
  _generateISVProfile() {
    return (
      <ISVProfile
        d3={yui.d3} />);
  }
  /**
    Renders the user profile component.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _generateUserProfile() {
    const state = this.props.appState.current;
    if (!this._isSet(state.profile)) {
      return null;
    }
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
      !this.props.controllerAPI.get('connected') ||
      !this.props.controllerAPI.userIsAuthenticated
    ) {
      return null;
    }
    // XXX Jeff - 18-11-2016 - This profile gets rendered before the
    // controller has completed connecting and logging in when in gisf. The
    // proper fix is to queue up the RPC calls but due to time constraints
    // we're setting up this handler to simply re-render the profile when
    // the controller is properly connected.
    const facadesExist = !!this.props.controllerAPI.get('facades');
    if (!facadesExist) {
      const handler = this.props.controllerAPI.after('facadesChange', e => {
        if (e.newVal) {
          this.appState.dispatch();
          handler.detach();
        }
      });
    }
    // NOTE: we need to clone this.get('users') below; passing in without
    // cloning breaks React's ability to distinguish between this.props and
    // nextProps on the lifecycle methods.
    const charmstore = this.props.charmstore;
    const payment = this.props.payment;
    const stripe = this.props.stripe;
    const userInfo = this.props.getUserInfo(state);
    return (
      <Profile
        acl={shapeup.fromShape(this.props.acl, Profile.propTypes.acl)}
        activeSection={state.hash}
        addNotification={this._bound.addNotification}
        addToModel={this.props.addToModel.bind(this, charmstore)}
        bakery={this.props.bakery}
        baseURL={this.props.applicationConfig.baseUrl}
        changeState={this._bound.changeState}
        charmstore={charmstore}
        controllerAPI={
          shapeup.fromShape(this.props.controllerAPI, Profile.propTypes.controllerAPI)}
        controllerIP={
          this.props.controllerAPI.get('socket_url')
            .replace('wss://', '').replace('ws://', '').split(':')[0]}
        controllerIsReady={this._controllerIsReady.bind(this)}
        controllerUser={this.props.user.controller.user}
        destroyModel={
          initUtils.destroyModel.bind(
            initUtils, this._bound.destroyModels, this.props.modelAPI,
            this.props.switchModel)}
        facadesExist={facadesExist}
        generatePath={this.props.appState.generatePath.bind(this.props.appState)}
        getModelName={this._getModelName.bind(this)}
        getUser={this.props.identity.getUser.bind(this.props.identity)}
        gisf={this.props.applicationConfig.gisf}
        payment={payment && shapeup.fromShape(payment, Profile.propTypes.payment)}
        sendAnalytics={this.props.sendAnalytics}
        showPay={this.props.applicationConfig.flags.pay || false}
        storeUser={this.props.storeUser.bind(this)}
        stripe={stripe && shapeup.fromShape(stripe, Profile.propTypes.stripe)}
        switchModel={this.props.switchModel}
        userInfo={shapeup.fromShape(userInfo, Profile.propTypes.userInfo)} />);
  }

  /**
    Renders the Header Search component to the page in the
    designated element.
  */
  _generateHeaderSearch() {
    return (
      <li className="header-banner__list-item header-banner__list-item--no-padding">
        <HeaderSearch appState={this.props.appState} />
      </li>);
  }

  /**
    Renders the Header Help component to the page.
  */
  _generateHeaderHelp() {
    const openHelp = () => {
      this.props.appState.changeState({
        help: true
      });
    };
    return (
      <li className="header-banner__list-item header-banner__list-item--no-padding"
        id="header-help">
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
        </span>
      </li>);
  }

  /**
    Display the shortcuts modal.
    @param visible {Boolean} Whether the modal should be shown.
  */
  _displayShortcutsModal(visible=true) {
    this.setState({ shortcutsModalVisible: visible });
  }

  /**
    Generates the shortcuts modal.
  */
  _generateShortcutsModal() {
    if (!this.state.shortcutsModalVisible) {
      return null;
    }
    return (
      <ModalShortcuts
        closeModal={this._displayShortcutsModal.bind(this, false)}
        guiVersion={window.GUI_VERSION.version} />);
  }

  /**
    Display the settings modal.
    @param visible {Boolean} Whether the modal should be shown.
  */
  _displaySettingsModal(visible=true) {
    this.setState({ settingsModalVisible: visible });
  }

  /**
    Generates the settings modal.
  */
  _generateSettingsModal() {
    if (!this.state.settingsModalVisible) {
      return null;
    }
    return (
      <ModalGUISettings
        closeModal={this._displaySettingsModal.bind(this, false)}
        localStorage={localStorage} />);
  }

  /**
    Opens the lightbox with provided content.
    @param {Object} content React Element.
    @param {String} caption A string to display under the content.
  */
  _displayLightbox(content, caption) {
    this.setState({
      lightbox: {
        content,
        caption
      }
    });
  }

  /**
    Hides the lightbox.
  */
  _hideLightbox() {
    this.setState({ lightbox: null });
  }

  /**
    Displays a lightbox with provided content.
  */
  _generateLightbox() {
    const { lightbox } = this.state;
    if (!lightbox) {
      return null;
    }
    return (
      <Lightbox
        caption={lightbox.caption}
        close={this._hideLightbox.bind(this)}>
        {lightbox.content}
      </Lightbox>);
  }

  /**
    Opens the help overlay.
  */
  _generateHelp() {
    if (!this._isSet(this.props.appState.current.help)) {
      return null;
    }
    const handler = new WebHandler();
    return (<Help
      changeState={this._bound.changeState}
      displayShortcutsModal={this._displayShortcutsModal.bind(this, true)}
      gisf={this.props.applicationConfig.gisf}
      sendGetRequest={handler.sendGetRequest.bind(handler)}
      staticURL={this.props.applicationConfig.staticURL || ''}
      user={this.props.user}
      youtubeAPIKey={this.props.applicationConfig.youtubeAPIKey} />);
  }

  /**
    Display post deployment help.

    @param {Object} state The current state.
    @param {Function} next Run the next handler.
  */
  _generatePostDeployment(state, next) {
    let entityURLs = [];
    if (typeof state.postDeploymentPanel === 'string') {
      // A specific URL was provided so pass that through
      entityURLs.push(state.postDeploymentPanel);
    } else {
      entityURLs = entityURLs.concat(this.db.services.toArray().reduce(
        (accumulator, app) => {
          const url = app.get('annotations').bundleURL;
          if (url) {
            accumulator.push(url);
          }
          return accumulator;
        }, []));
    }
    if (entityURLs.length > 0) {
      ReactDOM.render(
        <PostDeployment
          changeState={this._bound.changeState}
          charmstore={
            shapeup.fromShape(this.charmstore, PostDeployment.propTypes.charmstore)}
          entityURLs={entityURLs} />);
    }
  }

  _generateHeaderLogo() {
    const userName = this.props.user.displayName;
    const gisf = this.props.applicationConfig.gisf;
    const homePath = gisf ? '/' :
      this.props.appState.generatePath({profile: userName});
    return (
      <div className="header-banner__logo"
        id="header-logo" >
        <HeaderLogo
          gisf={gisf}
          homePath={homePath}
          showProfile={initUtils.showProfile.bind(this, this._bound.changeState, userName)} />
      </div>);
  }

  /**
    Renders the Charmbrowser component to the page in the designated element.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _generateCharmbrowser() {
    const state = this.props.appState.current;
    if (!this._isSet(state.store) && !this._isSet(state.search)) {
      return null;
    }
    const charmstore = this.props.charmstore;
    const propTypes = Charmbrowser.propTypes;
    return (
      <Charmbrowser
        acl={this.props.acl}
        addNotification={this._bound.addNotification}
        addToModel={this.props.addToModel.bind(this, charmstore)}
        appState={this.props.appState}
        charmstore={shapeup.fromShape(this.props.charmstore, propTypes.charmstore)}
        charmstoreURL={
          initUtils.ensureTrailingSlash(window.juju_config.charmstoreURL)}
        clearLightbox={this._hideLightbox.bind(this)}
        deployService={this.props.deployService.bind(this)}
        displayLightbox={this._displayLightbox.bind(this)}
        flags={window.juju_config.flags}
        getModelName={this._getModelName.bind(this)}
        gisf={this.props.applicationConfig.gisf}
        importBundleYAML={this.props.bundleImporter.importBundleYAML.bind(
          this.props.bundleImporter)}
        listPlansForCharm={this.props.plans.listPlansForCharm.bind(this.props.plans)}
        sendAnalytics={this.props.sendAnalytics}
        setPageTitle={this.props.setPageTitle.bind(this)}
        showTerms={this.props.terms.showTerms.bind(this.props.terms)}
        staticURL={this.props.applicationConfig.staticURL || ''} />);
  }

  /**
    Determines if the jujushell buttons should be shown

    @returns {Bool} Inidication of whether jujushell is enabled
   */
  _enableTerminal() {
    return (
      this.props.applicationConfig.flags.terminal ||
      // Always allow for opening the terminal if the user specified a
      // jujushell URL in the GUI settings.
      !!localStorage.getItem('jujushell-url') ||
      // Also allow for opening the terminal if the user deployed the juju
      // shell charm.
      !!this.props.db.environment.get('jujushellURL')
    );
  }

  /**
    Handles rendering and/or updating the machine UI component.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _generateMachineView() {
    const state = this.props.appState.current;
    if (!this._isSet(state.gui) || !this._isSet(state.gui.machines)) {
      return null;
    }
    const db = this.props.db;
    const modelAPI = this.props.modelAPI;
    const ecs = modelAPI.get('ecs');
    const decorated = MachineView.DecoratedComponent;
    const propTypes = decorated.propTypes;
    return (
      <MachineView
        acl={shapeup.fromShape(this.props.acl, propTypes.acl)}
        changeState={this._bound.changeState}
        dbAPI={shapeup.addReshape({
          addGhostAndEcsUnits: initUtils.addGhostAndEcsUnits.bind(
            this, db, modelAPI),
          applications: db.services,
          modelName: db.environment.get('name') || '',
          machines: db.machines,
          units: db.units
        })}
        machine={this.props.appState.current.gui.machines}
        modelAPI={shapeup.addReshape({
          autoPlaceUnits: autodeploy.autoPlaceUnits.bind(this, db, modelAPI),
          createMachine: autodeploy.createMachine.bind(this, db, modelAPI),
          destroyMachines: modelAPI.destroyMachines.bind(modelAPI),
          placeUnit: modelAPI.placeUnit.bind(modelAPI),
          providerType: modelAPI.get('providerType') || '',
          region: modelAPI.get('region'),
          removeUnits: modelAPI.remove_units.bind(modelAPI),
          updateMachineConstraints: ecs.updateMachineConstraints.bind(ecs),
          updateMachineSeries: ecs.updateMachineSeries.bind(ecs)
        })}
        parseConstraints={initUtils.parseConstraints.bind(
          initUtils, modelAPI.genericConstraints)}
        parseMachineDetails={initUtils.parseMachineDetails.bind(
          initUtils, modelAPI.genericConstraints)}
        parseMachineName={db.machines.parseMachineName.bind(db.machines)}
        sendAnalytics={this.props.sendAnalytics}
        series={urls.CHARM_SERIES}
        showSSHButtons={this._enableTerminal()} />);
  }

  /**
    Handles rendering and/or updating the status UI component.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _generateStatusView() {
    const state = this.props.appState.current;
    if (!this._isSet(state.gui) || !this._isSet(state.gui.status)) {
      return null;
    }
    const propTypes = Status.propTypes;
    return (
      <Status
        changeState={this._bound.changeState}
        db={shapeup.fromShape(this.props.db, propTypes.db)}
        generatePath={this.props.appState.generatePath.bind(this.props.appState)}
        model={shapeup.fromShape(this.props.modelAPI.getAttrs(), propTypes.model)} />);
  }

  /**
    Renders the Inspector component to the page.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _generateInspector() {
    const state = this.props.appState.current;
    if (!this._isSet(state.gui) || !this._isSet(state.gui.inspector)) {
      return null;
    }
    const instance = this.props.topology;
    if (!instance) {
      return;
    }
    const topo = instance.topo;
    const charmstore = this.props.charmstore;
    let inspector = {};
    const inspectorState = state.gui.inspector;
    const service = this.props.db.services.getById(inspectorState.id);
    const localType = inspectorState.localType;
    // If there is a hoverService event listener then we need to detach it
    // when rendering the inspector.
    const hoverHandler = this._domEventHandlers['topo.hoverService'];
    if (hoverHandler) {
      this._removeEvent('topo.hoverService');
    }
    const modelAPI = this.props.modelAPI;
    const db = this.props.db;
    // If the url was provided with a service id which isn't in the localType
    // db then change state back to the added services list. This usually
    // happens if the user tries to visit the inspector of a ghost service
    // id which no longer exists.
    if (service) {
      // Select the service token.
      topo.modules.ServiceModule.selectService(service.get('id'));
      const charm = db.charms.getById(service.get('charm'));
      const relatableApplications = relationUtils.getRelatableApplications(
        db, endpointUtils.getEndpoints(service, this.props.endpointsController));
      const ecs = modelAPI.get('ecs');
      const addCharm = (url, callback, options) => {
        modelAPI.addCharm(url, charmstore, callback, options);
      };
      const propTypes = Inspector.propTypes;
      inspector = (
        <Inspector
          acl={this.props.acl}
          addCharm={addCharm}
          addNotification={this._bound.addNotification}
          appState={this.props.appState}
          charm={charm}
          getAvailableVersions={charmstore.getAvailableVersions.bind(charmstore)}
          initUtils={shapeup.addReshape({
            addGhostAndEcsUnits: initUtils.addGhostAndEcsUnits.bind(
              this, db, modelAPI, service),
            createMachinesPlaceUnits: initUtils.createMachinesPlaceUnits.bind(
              this, db, modelAPI, service),
            destroyService: initUtils.destroyService.bind(
              this, db, modelAPI, service)
          })}
          modelAPI={shapeup.addReshape({
            destroyUnits: modelAPI.remove_units.bind(modelAPI),
            envResolved: modelAPI.resolved.bind(modelAPI),
            exposeService: modelAPI.expose.bind(modelAPI),
            getCharm: modelAPI.get_charm.bind(modelAPI),
            setCharm: modelAPI.setCharm.bind(modelAPI),
            setConfig: modelAPI.set_config.bind(modelAPI),
            unexposeService: modelAPI.unexpose.bind(modelAPI)
          })}
          modelUUID={this.props.modelUUID || ''}
          providerType={modelAPI.get('providerType') || ''}
          relatableApplications={relatableApplications}
          relationUtils={shapeup.addReshape({
            createRelation: relationUtils.createRelation.bind(this, db, modelAPI),
            destroyRelations: relationUtils.destroyRelations.bind(
              this, db, modelAPI),
            getAvailableEndpoints: relationUtils.getAvailableEndpoints.bind(
              this, this.props.endpointsController, db, endpointUtils.getEndpoints)
          })}
          service={service}
          serviceRelations={
            relationUtils.getRelationDataForService(db, service)}
          services={shapeup.fromShape(db.services, propTypes.services)}
          showActivePlan={this.props.plans.showActivePlan.bind(this.props.plans)}
          showPlans={window.juju_config.flags.plans || false}
          showSSHButtons={this._enableTerminal()}
          unplaceServiceUnits={ecs.unplaceServiceUnits.bind(ecs)}
          updateServiceUnitsDisplayname={
            db.updateServiceUnitsDisplayname.bind(db)} />
      );
    } else if (localType && window.localCharmFile) {
      inspector = (
        <LocalInspector
          acl={this.props.acl}
          changeState={this._bound.changeState}
          file={window.localCharmFile}
          localType={localType}
          series={initUtils.getSeriesList()}
          services={db.services}
          upgradeServiceUsingLocalCharm={
            localCharmHelpers.upgradeServiceUsingLocalCharm.bind(
              this, modelAPI, db)}
          uploadLocalCharm={
            localCharmHelpers.uploadLocalCharm.bind(
              this, modelAPI, db)} />
      );
    } else {
      this.props.appState.changeState({gui: {inspector: null}});
      return;
    }
    return (
      <Panel
        instanceName="inspector-panel"
        visible={true}>
        {inspector}
      </Panel>);
  }

  /**
    Renders the Deployment component to the page in the
    designated element.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _generateDeployment() {
    const state = this.props.appState.current;
    if (!this._isSet(state.gui) || !this._isSet(state.gui.deploy)) {
      return null;
    }
    const modelAPI = this.props.modelAPI;
    const db = this.props.db;
    const connected = this.props.modelAPI.get('connected');
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
      this.props.appState.changeState({
        gui: {
          deploy: null
        }
      });
      return;
    }
    const controllerAPI = this.props.controllerAPI;
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
      return this.props.user.username;
    };
    const loginToController = controllerAPI.loginWithMacaroon.bind(
      controllerAPI, this.props.bakery);
    const charmstore = this.props.charmstore;
    const isLoggedIn = () => this.props.controllerAPI.userIsAuthenticated;
    const autoPlaceUnits = autodeploy.autoPlaceUnits.bind(null, db, modelAPI);
    const propTypes = DeploymentFlow.propTypes;
    return (
      <DeploymentFlow
        acl={this.props.acl}
        addNotification={this._bound.addNotification}
        applications={services.toArray()}
        changes={currentChangeSet}
        changeState={this._bound.changeState}
        changesUtils={shapeup.addReshape({
          generateAllChangeDescriptions:
            changesUtils.generateAllChangeDescriptions.bind(
              changesUtils, services, db.units),
          generateChangeDescription:
            changesUtils.generateChangeDescription.bind(
              changesUtils, services, db.units),
          sortDescriptionsByApplication:
            changesUtils.sortDescriptionsByApplication.bind(null,
              services.getById.bind(services))
        })}
        charms={db.charms}
        charmsGetById={db.charms.getById.bind(db.charms)}
        charmstore={shapeup.fromShape(charmstore, propTypes.charmstore)}
        cloud={cloud}
        controllerAPI={shapeup.fromShape(controllerAPI, propTypes.controllerAPI)}
        controllerIsReady={this._controllerIsReady.bind(this)}
        credential={modelAPI.get('credential')}
        ddData={ddData}
        generatePath={this.props.appState.generatePath.bind(this.props.appState)}
        getCurrentChangeSet={ecs.getCurrentChangeSet.bind(ecs)}
        getServiceByName={services.getServiceByName.bind(services)}
        getSLAMachineRates={
          this.props.rates.getSLAMachineRates.bind(this.props.rates)}
        getUserName={getUserName}
        gisf={this.props.gisf}
        gtmEnabled={this.props.applicationConfig.GTM_enabled}
        hash={state.hash}
        initUtils={shapeup.addReshape({
          deploy: initUtils.deploy.bind(initUtils, this, autoPlaceUnits),
          formatConstraints: initUtils.formatConstraints.bind(initUtils),
          generateMachineDetails: initUtils.generateMachineDetails.bind(
            initUtils, modelAPI.genericConstraints, db.units)
        })}
        isLoggedIn={isLoggedIn}
        loginToController={loginToController}
        modelAPI={shapeup.fromShape(modelAPI, propTypes.modelAPI)}
        modelCommitted={connected}
        modelName={modelName}
        payment={
          this.props.payment && shapeup.fromShape(this.props.payment, propTypes.payment)}
        plans={this.props.plans && shapeup.fromShape(this.props.plans, propTypes.plans)}
        profileUsername={this.props.getUserInfo(state).profile}
        region={modelAPI.get('region')}
        sendAnalytics={this.props.sendAnalytics}
        setModelName={modelAPI.set.bind(modelAPI, 'environmentName')}
        showPay={this.props.applicationConfig.flags.pay || false}
        staticURL={this.props.applicationConfig.staticURL || ''}
        stats={this.props.stats}
        stripe={this.props.stripe && shapeup.fromShape(this.props.stripe, propTypes.stripe)}
        terms={shapeup.fromShape(this.props.terms, propTypes.terms)}
        username={this.props.user ? this.props.user.displayName : undefined}
        WebHandler={WebHandler}
        withPlans={false} />);
  }
  /**
    Report whether the controller API connection is ready, connected and
    authenticated.
    @return {Boolean} Whether the controller is ready.
  */
  _controllerIsReady() {
    return !!(
      this.props.controllerAPI &&
      this.props.controllerAPI.get('connected') &&
      this.props.controllerAPI.userIsAuthenticated
    );
  }

  /**
    Renders the Deployment component to the page in the
    designated element.
  */
  _generateDeploymentBar() {
    var modelAPI = this.props.modelAPI;
    var ecs = modelAPI.get('ecs');
    var db = this.props.db;
    var services = db.services;
    var servicesArray = services.toArray();
    var machines = db.machines.toArray();
    var units = db.units;
    return (
      <div id="deployment-bar-container">
        <DeploymentBar
          acl={this.props.acl}
          changeState={this._bound.changeState}
          currentChangeSet={ecs.getCurrentChangeSet()}
          generateChangeDescription={
            changesUtils.generateChangeDescription.bind(
              changesUtils, services, units)}
          hasEntities={servicesArray.length > 0 || machines.length > 0}
          modelCommitted={this.props.modelAPI.get('connected')}
          sendAnalytics={this.props.sendAnalytics} />
      </div>);
  }

  /**
    Renders the login component.

    @method _generateLogin
    @param {String} err Possible authentication error, or null if no error
      message must be displayed.
  */
  _generateLogin(err) {
    if (this.props.appState.current.root !== 'login') {
      return null;
    }
    document.getElementById('loading-message').style.display = 'none';
    const loginToController = () => {
      this.props.loginToAPIs(null, true, [this.props.controllerAPI]);
    };
    const controllerIsConnected = () => {
      return this.props.controllerAPI && this.props.controllerAPI.get('connected');
    };
    return (
      <div className="full-screen-mask">
        <Login
          addNotification={this._bound.addNotification}
          bakeryEnabled={this.props.applicationConfig.bakeryEnabled}
          controllerIsConnected={controllerIsConnected}
          errorMessage={err}
          gisf={this.props.applicationConfig.gisf}
          loginToAPIs={this.props.loginToAPIs}
          loginToController={loginToController} />
      </div>);
  }

  /**
    Renders the Log out component or log in link depending on the
    modelAPIironment the GUI is executing in.
  */
  _generateUserMenu() {
    if (!this._controllerIsReady()) {
      return null;
    }
    const controllerAPI = this.props.controllerAPI;
    const charmstore = this.props.charmstore;
    const bakery = this.props.bakery;
    const _USSOLoginLink = (
      <USSOLoginLink
        addNotification={this._bound.addNotification}
        displayType="text"
        loginToController={
          controllerAPI.loginWithMacaroon.bind(controllerAPI, bakery)} />);
    let logoutUrl = '/logout';
    const applicationConfig = this.props.applicationConfig;
    if (applicationConfig.baseUrl) {
      logoutUrl = applicationConfig.baseUrl.replace(/\/?$/, logoutUrl);
    }
    const doCharmstoreLogout = () => {
      return this.props.getUser('charmstore') && !applicationConfig.gisf;
    };
    const LogoutLink = (<Logout
      charmstoreLogoutUrl={charmstore.getLogoutUrl()}
      doCharmstoreLogout={doCharmstoreLogout}
      locationAssign={window.location.assign.bind(window.location)}
      logoutUrl={logoutUrl}
      // If the charmbrowser is open then do not show the logout link.
      visible={!this.props.appState.current.store} />);

    const navigateUserProfile = () => {
      const username = this.props.user.displayName;
      if (!username) {
        return;
      }
      initUtils.showProfile(this._bound.changeState, username);
    };

    const showHelp = () => {
      this.props.appState.changeState({
        help: true
      });
    };

    return (
      <li className="header-banner__list-item header-banner__list-item--no-padding"
        id="profile-link-container">
        <UserMenu
          controllerAPI={controllerAPI}
          LogoutLink={LogoutLink}
          navigateUserProfile={navigateUserProfile}
          showHelp={showHelp}
          USSOLoginLink={_USSOLoginLink} />
      </li>);
  }

  /**
    Renders the breadcrumb component to the DOM.
  */
  _generateBreadcrumb() {
    const modelAPI = this.props.modelAPI;
    const controllerAPI = this.props.controllerAPI;
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
    return (
      <div id="header-breadcrumb">
        <HeaderBreadcrumb
          acl={this.props.acl}
          addNotification={this._bound.addNotification}
          appState={this.props.appState}
          changeState={this._bound.changeState}
          listModelsWithInfo={listModelsWithInfo}
          loadingModel={modelAPI.loading}
          modelCommitted={!!modelAPI.get('modelUUID')}
          modelName={this.props.db.environment.get('name')}
          modelOwner={modelAPI.get('modelOwner')}
          setModelName={modelAPI.set.bind(modelAPI, 'environmentName')}
          showEnvSwitcher={showEnvSwitcher}
          showProfile={initUtils.showProfile.bind(this, this._bound.changeState)}
          switchModel={this.props.switchModel}
          user={this.props.user} />
      </div>);
  }
  /**
    Renders the logo for the current cloud provider.
  */
  _generateProviderLogo() {
    const cloudProvider = this.props.modelAPI.get('providerType');
    let providerDetails = initUtils.getCloudProviderDetails(cloudProvider);
    const currentState = this.props.appState.current || {};
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
    return (
      <div className="header-banner__provider">
        <div className={classes}>
          <SvgIcon
            height={providerDetails.svgHeight * scale}
            name={providerDetails.id || ''}
            width={providerDetails.svgWidth * scale} />
        </div>
      </div>);
  }
  /**
    Renders the notification component to the page in the designated element.
  */
  _generateNotifications() {
    const notifications = this.props.db.notifications.toArray().map(
      notification => notification.getAttrs());
    return (
      <NotificationList
        notifications={notifications} />);
  }

  /**
    Renders the mask and animations for the drag over notification for when
    a user drags a yaml file or zip file over the canvas.
    @param {Boolean} showIndicator
  */
  _generateDragOverNotification(showIndicator = true) {
    if (!this.state.dragOverNotificationVisible) {
      return null;
    }
    return (
      <ExpandingProgress />);
  }

  /**
    Show or hide the drag over notification for when a user drags a yaml file or zip
    file over the canvas.
    @param {Boolean} showIndicator Whether to show the notification.
  */
  _showDragOverNotification(showIndicator = true) {
    this.props.topology.fadeHelpIndicator(showIndicator);
    this.setState({ dragOverNotificationVisible: showIndicator });
  }

  /**
    Renders the zoom component to the page in the designated element.
  */
  _generateZoom() {
    return (
      <div id="zoom-container">
        <Zoom
          topo={this.props.topology.topo} />
      </div>);
  }

  /**
    Generate the cookie notice.
  */
  _generateCookieNotice() {
    if (this.props.applicationConfig.GTM_enabled) {
      return cookieUtil.check(document, this.props.appState);
    }
  }

  /**
    Generate the login notification.
  */
  _generateLoginNotification() {
    const { loginNotificiationURL } = this.state;
    if (!loginNotificiationURL) {
      return null;
    }
    let dismiss = null;
    if (this.props.appState.current.root !== 'login') {
      dismiss = this.setState.bind(this, { loginNotificiationURL: null });
    }
    const content = (
      <span>
        To proceed with the authentication, please accept the pop up window or&nbsp;
        <a href={loginNotificiationURL} target="_blank">click here</a>.
      </span>);
    return (
      <div id="login-notification">
        <Notification
          content={content}
          dismiss={dismiss}
          extraClasses="four-col"
          isBlocking={true} />
      </div>);
  }

  /**
    Generate the MAAS link.
  */
  _generateMAASLink() {
    const { maasServer } = this.props;
    if (!maasServer) {
      return null;
    }
    return (
      <li className="header-banner__list-item">
        <a className="header-banner__link"
          href={maasServer}
          target="_blank">
          MAAS UI
        </a>
      </li>);
  }

  /**
    Generate the confirmation for losing uncommitted changes.
  */
  _generateUncommittedConfirm() {
    const { popupAction } = this.state;
    if (!popupAction) {
      return null;
    }
    const buttons = [{
      title: 'Cancel',
      action: this.setState.bind(this, { popupAction: null }),
      type: 'inline-neutral'
    }, {
      title: 'Continue',
      action: popupAction,
      type: 'destructive'
    }];
    return (
      <Popup
        buttons={buttons}
        title="Uncommitted changes">
        <p>
          You have uncommitted changes to your model. You will
          lose these changes if you continue.
        </p>
      </Popup>);
  }

  render() {
    return (
      <div>
        <div className="header-banner header-banner--left">
          {this._generateHeaderLogo()}
          {this._generateBreadcrumb()}
          {this._generateModelActions()}
          {this._generateProviderLogo()}
        </div>
        <div className="header-banner header-banner--right">
          <ul className="header-banner__list--right">
            {this._generateMAASLink()}
            {this._generateHeaderSearch()}
            {this._generateHeaderHelp()}
            {this._generateUserMenu()}
          </ul>
        </div>
        {this._generateZoom()}
        {this._generateLogin()}
        {this._generateUserProfile()}
        {this._generateUncommittedConfirm()}
        {this._generateSharing()}
        {this._generateCharmbrowser()}
        {this._generateDeployment()}
        {this._generateEnvSizeDisplay()}
        {this._generateAddedServices()}
        {this._generateInspector()}
        {this._generateMachineView()}
        {this._generatePostDeployment()}
        {this._generateStatusView()}
        {this._generateLoginNotification()}
        {this._generateCookieNotice()}
        {this._generateHelp()}
        {this._generateShortcutsModal()}
        {this._generateSettingsModal()}
        {this._generateLightbox()}
        {this._generateDragOverNotification()}
        {this._generateNotifications()}
        <div id="app-footer">
          {this._generateDeploymentBar()}
          {this._displayTerminal()}
        </div>
      </div>
    );
  }
};

App.propTypes = {
  acl: PropTypes.object.isRequired,
  addToModel: PropTypes.func.isRequired,
  appState: PropTypes.object.isRequired,
  applicationConfig: PropTypes.object.isRequired,
  bakery: PropTypes.object.isRequired,
  bundleImporter: PropTypes.object.isRequired,
  charmstore: PropTypes.object.isRequired,
  controllerAPI: PropTypes.object,
  db: PropTypes.object.isRequired,
  deployService: PropTypes.func.isRequired,
  endpointsController: PropTypes.object.isRequired,
  getUser: PropTypes.func.isRequired,
  getUserInfo: PropTypes.func.isRequired,
  gisf: PropTypes.object,
  identity: PropTypes.object.isRequired,
  loginToAPIs: PropTypes.func.isRequired,
  maasServer: PropTypes.string,
  modelAPI: PropTypes.object.isRequired,
  modelUUID: PropTypes.string,
  payment: PropTypes.object,
  plans: PropTypes.object,
  rates: PropTypes.object,
  sendAnalytics: PropTypes.func.isRequired,
  setPageTitle: PropTypes.func.isRequired,
  stats: PropTypes.object,
  storeUser: PropTypes.func.isRequired,
  stripe: PropTypes.object,
  switchModel: PropTypes.func.isRequired,
  terms: PropTypes.object,
  topology: PropTypes.object.isRequired,
  user: PropTypes.object
};

module.exports = App;
