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

    if (cfg.seriesList && !Array.isArray(cfg.seriesList)) {
      throw 'Series list must be an Array';
    }
    /**
      The list of possible distro 'series' for the store paths. ex)
      trusty, precise, xenial. The GUI has a utils method `getSeriesList` that
      is the central storage location for the series information. This Object
      should be converted to an array and passed to this state when being
      instantiated.
      @type {Array}
    */
    this.seriesList = (function() {
      if (!cfg.seriesList) {
        console.log('No series list provided, using default list');
        return ['bundle', 'precise', 'trusty', 'xenial'];
      } else {
        return cfg.seriesList.concat(['bundle']);
      }
    }());
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
    return ['charms', 'issues', 'revenue', 'settings'];
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
    List of path delimeters for the gui section.
    @type {Array}
    @static
  */
  static get GUI_PATH_DELIMETERS() {
    return [
      'account', 'applications', 'deploy', 'inspector', 'isv', 'machines'];
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
    let parts = this._sanitizeURL(url).split('/');
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
    // Working backwards to split up the URL.
    const guiIndex = parts.indexOf(State.PATH_DELIMETERS.get('gui'));
    if (guiIndex > -1) {
      state = this._parseGUI(parts.splice(guiIndex), state);
    }
    // Extract out the user sections.
    if (parts.includes(State.PATH_DELIMETERS.get('user'))) {
      ({state, parts} = this._parseUser(parts, state));
    }
    // By this point there should only be the 'store only' content left.
    if (!state.store && parts.length) {
      state.store = parts.join('/');
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
    Parses the search portion of the url without the
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

  /**
    Parses the GUI portion of the url without the
    State.PATH_DELIMETERS.get('gui') key value.
    @param {Array} urlParts - The url path split into parts.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object} The updated state to contain the search value, if any.
  */
  _parseGUI(urlParts, state) {
    let indexes = [];
    State.GUI_PATH_DELIMETERS.forEach(section => {
      const index = urlParts.indexOf(section);
      if (index > -1) {
        indexes.push(index);
      }
    });
    // If there were no sections found then just return.
    if (!indexes.length) {
      return state;
    }
    // JavaScript array sort sorts alphabetically which causes issues if
    // you have multiple default sections ie) [0, 9, 17] gets sorted as
    // [0, 17, 9]. So we must pass a custom sorter to it so that it sorts
    // numerically.
    indexes.sort((a, b) => a-b);
    // Split out and store the sections
    let guiParts = {};
    indexes.forEach((index, arIndex) => {
      const end = indexes[arIndex+1] || urlParts.length;
      guiParts[urlParts[index]] = urlParts.slice(index+1, end).join('/');
    });
    state.gui = guiParts;
    return state;
  }

  /**
    Parses the url and extracts the user delimeted sections.
    @param {Array} urlParts - The url path split into parts.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object}
  */
  _parseUser(urlParts, state) {
    // Grab the indexes of the user delimeters as there can be multiple.
    let indexes = [];
    urlParts.forEach((item, index) => {
      if (item === State.PATH_DELIMETERS.get('user')) {
        indexes.push(index);
      }
    });
    // If we have no user parts then we don't need to parse them.
    if (indexes.length > 0) {
      switch (indexes.length) {
        case 1:
          // Extract out the user portion of the list and then remove the
          // user delimeter at the beginning.
          const userBlock = urlParts.splice(indexes[0]).slice(1);
          // The userBlock might have user components and store components.
          // The user component has at most two spots. If it has more, then
          // it may be a user store path.
          if (userBlock.length > 2) {
            // Check the 2 index spot to see if it's either an integer or a
            // series. If it is, then this is a user store path.
            if (!Number.isNaN(parseInt(userBlock[2], 10)) ||
                this.seriesList.includes(userBlock[2])) {
              state.store = userBlock.splice(0).join('/');
            }
          }
          // If there are still parts then it wasn't a long user store url
          // so only grab the user path.
          if (userBlock.length) {
            state.user = userBlock.splice(0, 2).join('/');
          }
          // Anything left is a root store path which will be handled elsewhere
          // So add it back to the parts list.
          urlParts = urlParts.concat(userBlock);
          break;
        case 2:
          // JavaScript array sort sorts alphabetically which causes issues
          // if you have multiple default sections ie) [0, 9, 17] gets sorted
          // as [0, 17, 9]. So we must pass a custom sorter to it so that it
          // sorts numerically.
          indexes.sort((a, b) => a-b);
          // The first user portion will be the primary user.
          // Extract out the user portion of the list and then remove the
          // user delimeter at the beginning.
          state.user = urlParts.splice(
            indexes[0], indexes[1]).slice(1).join('/');
          // The second user portion will be the store section.
          state.store = urlParts.splice(0).slice(1).join('/');
          break;
      }
    }
    return {state, parts: urlParts};
  }
};

this.jujugui.State = State;
