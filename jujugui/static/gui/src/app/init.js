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
