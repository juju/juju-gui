/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const mixwith = require('mixwith');

const hotkeys = require('./init/hotkeys');
const csUser = require('./init/charmstore-user');

const yui = window.yui;

class GUIApp {
  constructor(config) {
    /**
      The keydown event listener from the hotkey activation.
      @type {Object}
    */
    this._hotkeyListener = hotkeys.activate(this);
    /**
      The application database
      @type {Object}
    */
    this.db = new yui.juju.models.Database();
    /**
      Application instance of the user class.
      @type {Object}
    */
    this.user = config.user || new window.jujugui.User({
      externalAuth: config.auth,
      expiration: window.sessionStorage.getItem('expirationDatetime')
    });

    /**
      Stores the user object for the charmstore.
      @type {Object}
    */
    this.users = csUser.create();

    const webHandler = new yui.juju.environments.web.WebHandler();
    const stateGetter = () => this.state.current;
    const cookieSetter = (value, callback) => {
      this.charmstore.setAuthCookie(value, callback);
    };
    /**
      Application instance of the bakery
      @type {Object}
      @readonly
    */
    this.bakery = yui.juju.bakeryutils.newBakery(
      config, this.user, stateGetter, cookieSetter, webHandler);
  }

  /**
    Cleans up the instance of the application.
  */
  destructor() {
    this._hotkeyListener.detach();
  }
}

class JujuGUI extends mixwith.mix(GUIApp)
                             .with(csUser.CharmstoreUserMixin) {}

module.exports = JujuGUI;
