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
const State = class State {
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
    List of reserved keywords for the paths.
    @type {Array}
    @static
  */
  static get ROOT_RESERVED() {
    return [
      'about', 'bigdata', 'docs', 'juju', 'login', 'logout', 'new', 'store'];
  }

  /**
    List of reserved keywords for the profile paths.
    @type {Array}
    @static
  */
  static get PROFILE_RESERVED() {
    return ['billing', 'charms', 'issues', 'revenue', 'settings'];
  }

  /**
    A map of path delimeters and their labels.
    @type {Map}
    @static
  */
  static get PATH_DELIMETERS() {
    return new Map([
      ['search', 'q'],
      ['user', 'u'],
      ['gui', 'i']
    ]);
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
    let state = {};
    url = this._sanitizeURL(url);
    const parts = url.split('/');
    state = this._parseRoot(parts, state);
    // If we have root paths in the url then we can ignore everything else.
    if (state.root) {
      return state;
    }
    // The order of the PATH_DELIMETERS is important so we can assume the
    // order for easy parsing of the path.
    if (parts[0] === State.PATH_DELIMETERS.get('search')) {
      state = this._parseSearch(parts.splice(1), state);
      // If we have a search path in the url then we can ignore everything else.
      return state;
    }

    return state;
  }

  /**
    Inspects the url path to see if it is for the root.
    @param {Array} urlParts - The url path split into parts.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object} The updated state to contain the root value, if any.
  */
  _parseRoot(urlParts, state) {
    State.ROOT_RESERVED.some(key => {
      if (urlParts[0] === key) {
        state.root = key;
        return true;
      }
    });
    return state;
  }

  /**
    Parses the search portion of the url with out the
    State.PATH_DELIMETERS.get('search') key value.
    @param {Array} urlParts - The url path split into parts.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object} The updated state to contain the search value, if any.
  */
  _parseSearch(urlParts, state) {
    if (urlParts.length > 0) {
      state.search = urlParts.join('/');
    }
    return state;
  }
};

this.jujugui.State = State;
