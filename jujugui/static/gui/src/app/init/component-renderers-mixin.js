/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const ComponentRenderersMixin = (superclass) => class extends superclass {
  _clearRoot() {}
  _renderUserProfile() {}
  _clearUserProfile() {}
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
  _renderUserMenu() {}
  _renderBreadcrumb() {}
  _renderProviderLogo() {}
  _renderComponents() {}
  _renderNotifications() {}
  _renderDragOverNotification() {}
  _hideDragOverNotification() {}
};

module.exports = ComponentRenderersMixin;
