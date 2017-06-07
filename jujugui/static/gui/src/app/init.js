/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const hotkeys = require('./init/hotkeys');

const yui = window.yui;

const JujuGUI = class JujuGUI {
  constructor(config) {
    /**
      The keydown event listener from the hotkey activation.
      @type {Object}
      @readonly
    */
    this._hotkeyListener = hotkeys.activate(this);
    /**
      The application database
      @type {Object}
      @readonly
    */
    this.db = new yui.juju.models.Database();
  }

  /**
    Cleans up the instance of the application.
  */
  destructor() {
    this._hotkeyListener.detach();
  }

};

module.exports = JujuGUI;
