/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

if (typeof this.jujugui === 'undefined') {
  this.jujugui = {};
}

/** Class representing the State of the Juju GUI */
this.jujugui.State = class State {
  /**
    Create a new instance of the GUI state.
    @param {Object} cfg - The configuration options for a new State instance.
  */
  constructor(cfg) {
    /**
      The baseURL to use when generating URLs.
      @type {String}
    */
    this.baseURL = cfg.baseURL;
    /**
      The list of dispatchers for the various components from the url.
      @type {Object}
    */
    this.dispatchers = cfg.dispatchers;
  }

  /**
    Takes a complete url, strips off the supplied baseURL and extra slashes.
    @param {String} url - The url to sanitize.
    @return {String} The sanitized url.
  */
  _sanitizeURL(url) {
    return url
      // Strip the baseURL before parsing the sections.
      .replace(this.baseURL, '')
    // Strip the leading and trailing slashes off the url.
      .replace(/^\//, '').replace(/\/$/, '');
  }

  /**
    Splits the url up and generates a state object.
    @param {String} url - The url to turn into state.
  */
  buildState(url) {
    url = this._sanitizeURL(url);
  }
};
