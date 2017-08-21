/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const fromShape = require('shapeup').fromShape;
const yui = window.yui;
/**
    A mixin for the JujuGUI class.
    Stores all of the component renderer and cleanup methods.
*/
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
        serviceCount={serviceCount}
      />,
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
        addNotification={this._bound.addNotification}
        canShareModel={this.acl.canShareModel()}
        closeHandler={this._sharingVisibility.bind(this, false)}
        getModelUserInfo={env.modelUserInfo.bind(env)}
        grantModelAccess={grantRevoke.bind(this, grantAccess)}
        humanizeTimestamp={yui.juju.views.utils.humanizeTimestamp}
        revokeModelAccess={grantRevoke.bind(this, revokeAccess)}
      />, sharing);
  }
  /**
    Renders the ISV profile component.
  */
  _renderISVProfile() {
    ReactDOM.render(
      <window.juju.components.ISVProfile
        d3={yui.d3} />,
      document.getElementById('top-page-container'));
    // The model name should not be visible when viewing the profile.
    this._renderBreadcrumb({ showEnvSwitcher: false });
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
    let profile = (
      <window.juju.components.UserProfile
        acl={this.acl}
        addNotification={this._bound.addNotification}
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
        switchModel={this._bound.switchModel}
        userInfo={this._getUserInfo(state)}
      />);

    if (this.applicationConfig.flags.profile) {
      profile =
        <window.juju.components.Profile
          acl={this.acl}
          activeSection={state.hash}
          addNotification={this._bound.addNotification}
          baseURL={this.applicationConfig.baseUrl}
          changeState={this._bound.changeState}
          charmstore={charmstore}
          facadesExist={facadesExist}
          listModelsWithInfo={this._bound.listModelsWithInfo}
          destroyModels={this._bound.destroyModels}
          switchModel={this._bound.switchModel}
          userInfo={this._getUserInfo(state)} />;
    }

    ReactDOM.render(profile, document.getElementById('top-page-container'));
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

  _displaySettingsModal() {
    ReactDOM.render(
      <window.juju.components.ModalGUISettings
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
      <window.juju.components.Lightbox
        caption={caption}
        close={this._clearLightbox.bind(this)}>
        {content}
      </window.juju.components.Lightbox>,
      document.getElementById('lightbox'));
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
  /**
    Renders the Charmbrowser component to the page in the designated element.
    @param {Object} state - The app state.
    @param {Function} next - Call to continue dispatching.
  */
  _renderCharmbrowser(state, next) {
    const utils = yui.juju.views.utils;
    const charmstore = this.charmstore;
    // Configure syntax highlighting for the markdown renderer.
    marked.setOptions({
      highlight: function(code, lang) {
        const language = Prism.languages[lang];
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
    const getModelName = () => this.modelAPI.get('environmentName');
    ReactDOM.render(
      <window.juju.components.Charmbrowser
        acl={this.acl}
        apiUrl={charmstore.url}
        charmstoreSearch={charmstore.search.bind(charmstore)}
        clearLightbox={this._clearLightbox.bind(this)}
        deployTarget={this.deployTarget.bind(this, charmstore)}
        displayLightbox={this._displayLightbox.bind(this)}
        series={utils.getSeriesList()}
        importBundleYAML={this.bundleImporter.importBundleYAML.bind(
          this.bundleImporter)}
        flags={window.juju_config.flags}
        getBundleYAML={charmstore.getBundleYAML.bind(charmstore)}
        getEntity={getEntity}
        getFile={charmstore.getFile.bind(charmstore)}
        getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
        getModelName={getModelName}
        gisf={this.applicationConfig.gisf}
        listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
        renderMarkdown={marked}
        deployService={this.deployService.bind(this)}
        appState={this.state}
        utils={utils}
        staticURL={window.juju_config.staticURL}
        charmstoreURL={
          utils.ensureTrailingSlash(window.juju_config.charmstoreURL)}
        apiVersion={window.jujulib.charmstoreAPIVersion}
        addNotification={this._bound.addNotification}
        makeEntityModel={yui.juju.makeEntityModel}
        setPageTitle={this.setPageTitle.bind(this)}
        showTerms={this.terms.showTerms.bind(this.terms)}
        urllib={window.jujulib.URL}
      />,
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
  /**
    Renders the account component.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _renderAccount(state, next) {
    const controllerAPI = this.controllerAPI;
    if (!controllerAPI || !controllerAPI.userIsAuthenticated) {
      // If the controller isn't ready yet then don't render anything.
      return;
    }
    // When going to the account view, we are theoretically no longer
    // connected to any model.
    this.modelUUID = null;
    ReactDOM.render(
      <window.juju.components.Account
        acl={this.acl}
        addAddress={
          this.payment && this.payment.addAddress.bind(this.payment)}
        addBillingAddress={
          this.payment && this.payment.addBillingAddress.bind(this.payment)}
        addNotification={this._bound.addNotification}
        controllerIsReady={this._controllerIsReady.bind(this)}
        createCardElement={
          this.stripe && this.stripe.createCardElement.bind(this.stripe)}
        createPaymentMethod={
          this.payment && this.payment.createPaymentMethod.bind(this.payment)}
        createToken={this.stripe && this.stripe.createToken.bind(this.stripe)}
        createUser={
          this.payment && this.payment.createUser.bind(this.payment)}
        generateCloudCredentialName={
          yui.juju.views.utils.generateCloudCredentialName}
        getUser={this.payment && this.payment.getUser.bind(this.payment)}
        getCharges={
          this.payment && this.payment.getCharges.bind(this.payment)}
        getCloudCredentialNames={
          controllerAPI.getCloudCredentialNames.bind(controllerAPI)}
        getCloudProviderDetails={
          yui.juju.views.utils.getCloudProviderDetails.bind(
            yui.juju.views.utils)}
        getCountries={
          this.payment && this.payment.getCountries.bind(this.payment)}
        getReceipt={
          this.payment && this.payment.getReceipt.bind(this.payment)}
        listClouds={controllerAPI.listClouds.bind(controllerAPI)}
        removeAddress={
          this.payment && this.payment.removeAddress.bind(this.payment)}
        removeBillingAddress={
          this.payment && this.payment.removeBillingAddress.bind(
            this.payment)}
        removePaymentMethod={
          this.payment && this.payment.removePaymentMethod.bind(this.payment)}
        revokeCloudCredential={
          controllerAPI.revokeCloudCredential.bind(controllerAPI)}
        sendAnalytics={this.sendAnalytics}
        showPay={window.juju_config.flags.pay || false}
        updateCloudCredential={
          controllerAPI.updateCloudCredential.bind(controllerAPI)}
        updateAddress={
          this.payment && this.payment.updateAddress.bind(this.payment)}
        updateBillingAddress={
          this.payment && this.payment.updateBillingAddress.bind(
            this.payment)}
        updatePaymentMethod={
          this.payment && this.payment.updatePaymentMethod.bind(this.payment)}
        user={this.user.controller.user}
        userInfo={this._getUserInfo(state)}
        validateForm={
          yui.juju.views.utils.validateForm.bind(yui.juju.views.utils)} />,
      document.getElementById('top-page-container'));
    next();
  }

  /**
    The cleanup dispatcher for the account path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearAccount(state, next) {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('top-page-container'));
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
    const ecs = this.modelAPI.get('ecs');
    const utils = yui.juju.views.utils;
    const genericConstraints = this.modelAPI.genericConstraints;
    ReactDOM.render(
      <window.juju.components.MachineView
        acl={this.acl}
        addGhostAndEcsUnits={utils.addGhostAndEcsUnits.bind(
          this, this.db, this.modelAPI)}
        autoPlaceUnits={this._autoPlaceUnits.bind(this)}
        changeState={this.state.changeState.bind(this.state)}
        createMachine={this._createMachine.bind(this)}
        destroyMachines={this.modelAPI.destroyMachines.bind(this.modelAPI)}
        environmentName={db.environment.get('name') || ''}
        generateMachineDetails={
          utils.generateMachineDetails.bind(
            utils, genericConstraints, db.units)}
        machines={db.machines}
        parseConstraints={
          utils.parseConstraints.bind(utils, genericConstraints)}
        placeUnit={this.modelAPI.placeUnit.bind(this.modelAPI)}
        providerType={this.modelAPI.get('providerType') || ''}
        removeUnits={this.modelAPI.remove_units.bind(this.modelAPI)}
        services={db.services}
        series={window.jujulib.CHARM_SERIES}
        units={db.units}
        updateMachineConstraints={ecs.updateMachineConstraints.bind(ecs)}
        updateMachineSeries={ecs.updateMachineSeries.bind(ecs)} />,
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
    const propTypes = window.juju.components.Status.propTypes;
    ReactDOM.render(
      <window.juju.components.Status
        db={fromShape(this.db, propTypes.db)}
        model={fromShape(this.modelAPI.getAttrs(), propTypes.model)}
        urllib={fromShape(window.jujulib.URL, propTypes.urllib)}
      />,
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
    const relationUtils = this.relationUtils;
    const utils = yui.juju.views.utils;
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
        db, yui.juju.models.getEndpoints(service, this.endpointsController));
      const ecs = model.get('ecs');
      const addCharm = (url, callback, options) => {
        model.addCharm(url, charmstore, callback, options);
      };
      inspector = (
        <window.juju.components.Inspector
          acl={this.acl}
          addCharm={addCharm}
          addGhostAndEcsUnits={utils.addGhostAndEcsUnits.bind(
            this, db, model, service)}
          addNotification={this._bound.addNotification}
          appState={this.state}
          charm={charm}
          clearState={utils.clearState.bind(this, topo)}
          createMachinesPlaceUnits={utils.createMachinesPlaceUnits.bind(
            this, db, model, service)}
          createRelation={relationUtils.createRelation.bind(this, db, model)}
          destroyService={utils.destroyService.bind(
            this, db, model, service)}
          destroyRelations={this.relationUtils.destroyRelations.bind(
            this, db, model)}
          destroyUnits={utils.destroyUnits.bind(this, model)}
          displayPlans={utils.compareSemver(
            this.applicationConfig.jujuCoreVersion, '2') > -1}
          getCharm={model.get_charm.bind(model)}
          getUnitStatusCounts={utils.getUnitStatusCounts}
          getYAMLConfig={utils.getYAMLConfig.bind(this)}
          envResolved={model.resolved.bind(model)}
          exposeService={model.expose.bind(model)}
          getAvailableEndpoints={relationUtils.getAvailableEndpoints.bind(
            this, this.endpointsController, db, yui.juju.models.getEndpoints)}
          getAvailableVersions={charmstore.getAvailableVersions.bind(
            charmstore)}
          getServiceById={db.services.getById.bind(db.services)}
          getServiceByName={db.services.getServiceByName.bind(db.services)}
          linkify={utils.linkify}
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
            db.updateServiceUnitsDisplayname.bind(db)}
        />
      );
    } else if (localType && window.localCharmFile) {
      // When dragging a local charm zip over the canvas it animates the
      // drag over notification which needs to be closed when the inspector
      // is opened.
      this._hideDragOverNotification();
      const localCharmHelpers = juju.localCharmHelpers;
      inspector = (
        <window.juju.components.LocalInspector
          acl={this.acl}
          changeState={this.state.changeState.bind(this.state)}
          file={window.localCharmFile}
          localType={localType}
          services={db.services}
          series={utils.getSeriesList()}
          upgradeServiceUsingLocalCharm={
            localCharmHelpers.upgradeServiceUsingLocalCharm.bind(
              this, model, db)}
          uploadLocalCharm={
            localCharmHelpers.uploadLocalCharm.bind(
              this, model, db)}
        />
      );
    } else {
      this.state.changeState({gui: {inspector: null}});
      return;
    }
    ReactDOM.render(
      <window.juju.components.Panel
        instanceName="inspector-panel"
        visible={true}>
        {inspector}
      </window.juju.components.Panel>,
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
    const utils = yui.juju.views.utils;
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
    const changesUtils = this.changesUtils;
    const controllerAPI = this.controllerAPI;
    const services = db.services;
    // Auto place the units. This is probably not the best UX, but is required
    // to display the machines in the deployment flow.
    this._autoPlaceUnits();
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
    ReactDOM.render(
      <window.juju.components.DeploymentFlow
        acl={this.acl}
        addAgreement={this.terms.addAgreement.bind(this.terms)}
        addNotification={this._bound.addNotification}
        addSSHKeys={modelAPI.addKeys.bind(modelAPI)}
        applications={services.toArray()}
        charmstore={charmstore}
        changesFilterByParent={
          changesUtils.filterByParent.bind(changesUtils, currentChangeSet)}
        changeState={this.state.changeState.bind(this.state)}
        cloud={cloud}
        controllerIsReady={this._controllerIsReady.bind(this)}
        createToken={this.stripe && this.stripe.createToken.bind(this.stripe)}
        createCardElement={
          this.stripe && this.stripe.createCardElement.bind(this.stripe)}
        createUser={
          this.payment && this.payment.createUser.bind(this.payment)}
        credential={modelAPI.get('credential')}
        changes={currentChangeSet}
        charmsGetById={db.charms.getById.bind(db.charms)}
        deploy={utils.deploy.bind(utils, this)}
        sendAnalytics={this.sendAnalytics}
        setModelName={modelAPI.set.bind(modelAPI, 'environmentName')}
        formatConstraints={utils.formatConstraints.bind(utils)}
        generateAllChangeDescriptions={
          changesUtils.generateAllChangeDescriptions.bind(
            changesUtils, services, db.units)}
        generateCloudCredentialName={utils.generateCloudCredentialName}
        generateMachineDetails={
          utils.generateMachineDetails.bind(
            utils, modelAPI.genericConstraints, db.units)}
        generatePath={this.state.generatePath.bind(this.state)}
        getAgreementsByTerms={
          this.terms.getAgreementsByTerms.bind(this.terms)}
        getGithubSSHKeys={window.jujugui.sshKeys.githubSSHKeys}
        sortDescriptionsByApplication={
          changesUtils.sortDescriptionsByApplication.bind(null,
            services.getById.bind(services))}
        isLoggedIn={isLoggedIn}
        getCloudCredentials={
          controllerAPI.getCloudCredentials.bind(controllerAPI)}
        getCloudCredentialNames={
          controllerAPI.getCloudCredentialNames.bind(controllerAPI)}
        getCloudProviderDetails={utils.getCloudProviderDetails.bind(utils)}
        getCurrentChangeSet={ecs.getCurrentChangeSet.bind(ecs)}
        getCountries={
          this.payment && this.payment.getCountries.bind(this.payment)
            || null}
        getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
        getEntity={charmstore.getEntity.bind(charmstore)}
        getUser={this.payment && this.payment.getUser.bind(this.payment)}
        getUserName={getUserName}
        gisf={this.gisf}
        groupedChanges={changesUtils.getGroupedChanges(currentChangeSet)}
        listBudgets={this.plans.listBudgets.bind(this.plans)}
        listClouds={controllerAPI.listClouds.bind(controllerAPI)}
        listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
        loginToController={loginToController}
        makeEntityModel={yui.juju.makeEntityModel}
        modelCommitted={connected}
        modelName={modelName}
        ddData={ddData}
        profileUsername={this._getUserInfo(state).profile}
        region={modelAPI.get('region')}
        renderMarkdown={marked}
        getServiceByName={services.getServiceByName.bind(services)}
        showPay={this.applicationConfig.flags.pay || false}
        showTerms={this.terms.showTerms.bind(this.terms)}
        stats={this.stats}
        updateCloudCredential={
          controllerAPI.updateCloudCredential.bind(controllerAPI)}
        validateForm={utils.validateForm.bind(utils)}
        WebHandler={yui.juju.environments.web.WebHandler}
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
    var changesUtils = this.changesUtils;
    ReactDOM.render(
      <window.juju.components.DeploymentBar
        acl={this.acl}
        changeState={this.state.changeState.bind(this.state)}
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
      <window.juju.components.Login
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
    const USSOLoginLink = (
      <window.juju.components.USSOLoginLink
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
      return this.getUser('charmstore') && !this.get('gisf');
    };
    const LogoutLink = (<window.juju.components.Logout
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

  /**
    Renders the breadcrumb component to the DOM.
    @param {Object} options
      showEnvSwitcher: true
  */
  _renderBreadcrumb({ showEnvSwitcher=true } = {}) {
    const modelAPI = this.modelAPI;
    const ecs = modelAPI.get('ecs');
    const controllerAPI = this.controllerAPI;
    const utils = yui.juju.views.utils;
    let listModelsWithInfo =
      controllerAPI &&
        controllerAPI.listModelsWithInfo.bind(this.controllerAPI);
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
      <juju.components.HeaderBreadcrumb
        acl={this.acl}
        addNotification={this._bound.addNotification}
        appState={this.state}
        user={this.user}
        changeState={this.state.changeState.bind(this.state)}
        humanizeTimestamp={yui.juju.views.humanizeTimestamp}
        listModelsWithInfo={listModelsWithInfo}
        modelName={this.db.environment.get('name')}
        modelOwner={modelAPI.get('modelOwner')}
        setModelName={modelAPI.set.bind(modelAPI, 'environmentName')}
        showEnvSwitcher={showEnvSwitcher}
        showProfile={utils.showProfile.bind(
          this, modelAPI && ecs,
          this.state.changeState.bind(this.state))}
        switchModel={this._bound.switchModel}
        loadingModel={this.modelAPI.loading} />,
      document.getElementById('header-breadcrumb'));
  }
  /**
    Renders the logo for the current cloud provider.
  */
  _renderProviderLogo() {
    const container = document.getElementById('provider-logo-container');
    const cloudProvider = this.modelAPI.get('providerType');
    let providerDetails =
      yui.juju.views.utils.getCloudProviderDetails(cloudProvider);
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
        <window.juju.components.SvgIcon
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
    var notification = null;
    if (e && e.details) {
      notification = e.details[0].model.getAttrs();
    }
    ReactDOM.render(
      <window.juju.components.NotificationList
        notification={notification}/>,
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
      <window.juju.components.ExpandingProgress />,
      document.getElementById('drag-over-notification-container'));
  }

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
