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

const ROOT_RESERVED = [
  'about', 'bigdata', 'docs', 'juju', 'login', 'logout', 'new', 'store'];
const PROFILE_RESERVED = ['charms', 'issues', 'revenue', 'settings'];
const PATH_DELIMETERS = new Map([['search', 'q'], ['user', 'u'], ['gui', 'i']]);
const GUI_PATH_DELIMETERS = [
  'account', 'applications', 'deploy', 'inspector', 'isv', 'machines'];

/** Class representing the State of the Juju GUI */
const State = class State {
  /**
    Create a new instance of the GUI state.
    @param {Object} cfg - The configuration options for a new State instance.
  */
  constructor(cfg) {
    /**
      The baseURL to use when generating URLs. This value is required and
      should be the full base path that the GUI is served from.
      @property baseURL
      @type {String}
    */
    let baseURL = cfg.baseURL;
    if (!baseURL) {
      throw new Error('baseURL must be provided.');
    }
    // If the baseURL doesn't have a trailing slash then add one.
    const baseURLLength = baseURL.length;
    if (baseURL[baseURLLength-1] !== '/') {
      baseURL += '/';
    }
    this.baseURL = baseURL;

    if (!cfg.seriesList || !Array.isArray(cfg.seriesList)) {
      throw new Error('Series list must be an Array.');
    }
    // Push bundle into the seriesList if it doesn't already exist as it sits
    // in the series spot in the URL.
    if (!cfg.seriesList.includes('bundle')) {
      cfg.seriesList.push('bundle');
    }
    /**
      The list of possible distro 'series' for the store paths. ex)
      trusty, precise, xenial. The GUI has a utils method `getSeriesList` that
      is the central storage location for the series information. This Object
      should be converted to an array and passed to this state when being
      instantiated.
      @type {Array}
    */
    this.seriesList = cfg.seriesList;
    /**
      Internal storage value for the application location. Only used when
      location is set externally.
      @private
      @type {Object}
    */
    this._location = cfg.location || null;
    /**
      Internal storage value for the browser history object to use. Only used
      when browserHistory is set externally.
      @private
      @type {Object}
    */
    this._browserHistory = cfg.browserHistory || null;
    /**
      Internal storage for the app state history.
      @private
      @type {Array}
    */
    this._appStateHistory = [];
    /**
      Internal storage for the dispatchers.
      @private
      @type {Array}
    */
    this._dispatchers = {};

    window.onpopstate = this.dispatch.bind(this, [], true, true);
  }

  /**
    Takes the complete URL and runs it through various process methods and
    returns an object with the processed url parts and query string.
    @param {String} url - The URL to process.
    @return {Object} The processed url.
  */
  _processURL(url) {
    const stripLRSlashes = path => path.replace(/^\/*/, '').replace(/\/*$/, '');
    // Strip the baseURL before parsing the sections.
    const cleanURL = stripLRSlashes(url.replace(this.baseURL, ''));
    const splitURL = cleanURL.split('?');
    const processed = {};
    if (splitURL[1]) {
      processed.query = {};
      splitURL[1].split('&')
           .forEach(section => {
             const parts = section.split('=');
             processed.query[parts[0]] = parts[1];
           });
    }
    // The url parts without the query split on the / delimeter.
    const cleanParts = stripLRSlashes(splitURL[0]);
    if (cleanParts.length > 0) {
      processed.parts = cleanParts.split('/');
    }
    return processed;
  }

  /**
    The current window location. If set has been called on this property then
    it will return the externally set option. Typically this option will be used
    for testing.
    @type {Object}
  */
  get location() {
    return this._location || window.location;
  }

  set location(location) {
    this._location = location;
  }

  /**
    The browser history object to use. If set has been called on this property
    then it will return the externally set option. Typically this option will
    be used for testing.
    @type {Object}
  */
  get browserHistory() {
    return this._browserHistory || window.history;
  }

  set browserHistory(history) {
    this._browserHistory = history;
  }

  /**
    The getter representing the current app state.
    @type {Object}
  */
  get current() {
    return this._appStateHistory[this._appStateHistory.length-1] || {};
  }

  /**
    The getter representing the previous app state.
    @type {Object}
  */
  get previous() {
    return this._appStateHistory[this._appStateHistory.length-2] || {};
  }

  /**
    The getter representing the application history.
    @type {Array}
  */
  get history() {
    return this._appStateHistory;
  }

  /**
    Stores the dispatchers that are to be called when the appropriate state
    changes in the application. When state matches one of the supplied sections
    it will execute all of the `callback` dispatchers registered here. If the
    section is then set with a `null` value, the cleanupCallback will be
    called instead.
    @param {Array} dispatchers - An array of dispatchers in the format:
      [['section', callback, cleanupCallback], ...]
  */
  register(dispatchers) {
    const stored = this._dispatchers;
    dispatchers.forEach(dispatcher => {
      const record = [dispatcher[1], dispatcher[2]];
      if (!stored[dispatcher[0]]) {
        stored[dispatcher[0]] = [record];
        return;
      }
      stored[dispatcher[0]].push(record);
    });
  }

  /**
    Used to bootstrap the application from state. This calls the dispatch
    method with the necessary values as we only want to dispatch from the
    URL once on initial application load.

    @return {Object} See dispatch() for return arguments.
  */
  bootstrap() {
    return this.dispatch([], true, false, true);
  }

  /**
    Checks the current location and parses it, building the state, then
    executing the registered dispatchers.
    @param {Array} nullKeys - A list of keys which we must run the 'cleanup'
      dispaches on before dispatching the current state.
    @param {Boolean} updateState - Whether this dispatch should update the
      internal app state. This is typically only done when dispatch is called
      manually. Internal calls to dispatch are done via changeState which
      updates the state itself so it's not needed to do it here.
    @param {Boolean} backDispatch - Whether this dispatch was from the user
      hitting the back button. If it was we have to manually figure out the
      null keys so we know which cleanup dispatchers to run.
    @param {Boolean} stateFromURL - Whether the dispatch should get its state
      from the URL or from the latest app state.
    @return {Object} {error <String|Null>, state <Object>}
      - error: a string or any errors that may be returned, or null.
      - state: the application state, or as much state as it was
               able to generate
  */
  dispatch(nullKeys = [], updateState = true,
    backDispatch = false,  stateFromURL = false) {
    let error, state;
    // We only want to dispatch the state from the URL on application load or
    // when explicitly requested by the developer.
    const currentState = this.current;
    if (!stateFromURL && currentState) {
      state = currentState;
    } else {
      if (!currentState) {
        console.log('no current state to dispatch, generating state from URL');
      }
      ({error, state} = this.generateState(this.location.href));
      if (error !== null) {
        error = `unable to generate state: ${error}`;
        return {error, state};
      }
    }

    /**
      Extract out the state path for the dispatcher key.
      @param {Object} state - The app state.
    */
    function extract(state) {
      let allKeys = [];
      function concat(state, keys = []) {
        Object.keys(state).forEach(key => {
          keys.push(key);
          if (typeof state[key] === 'object' && state[key] !== null) {
            concat(state[key], keys);
          } else {
            allKeys.push(keys.join('.'));
          }
          keys.pop();
        });
      }
      concat(state);
      return allKeys;
    }
    if (updateState) {
      this._appStateHistory.push(state);
    }
    const stateKeys = extract(state);
    if (backDispatch) {
      // When we go back we need to get the list of sections that have changed
      // between the old a new state. We need to null out those sections so that
      // they are removed from the state. This is done by filtering the old keys
      // and removing those that exist in the new keys.
      nullKeys = extract(this.previous).filter(
        key => stateKeys.indexOf(key) === -1);
    }
    // First run all of the 'null state' dispatchers to clear out the old
    // state representations.
    const dispatched = [];
    nullKeys.forEach(key => this._dispatch(state, key, dispatched, true));
    // Then execute the 'all' dispatchers.
    this._dispatch(state, '*');
    // Loop through the state keys to execute their dispatchers.
    stateKeys.forEach(key => {
      const dispatcherCalled = this._dispatch(state, key, dispatched);
      // If a dispatcher was called then store it so that it doesn't get called
      // again this dispatch.
      if (dispatcherCalled) {
        dispatched.push(dispatcherCalled);
      }
    });
    return {error: null, state};
  }

  /**
    Takes the existing app state and then calls the registered dispatchers.
    @param {Object} state - The state to dispatch.
    @param {String} key - The key to manage the dispatchers.
    @param {Array} dispatched - The list of dispatcher keys that have already
      been called.
    @param {Boolean} cleanup - Whether it should execute the cleanup method or
      not. Defaults to false.
  */
  _dispatch(state, key, dispatched = [], cleanup = false) {
    /**
      Continues to reduce the key to find a dispatcher. Example, if key
      value is 'gui.inspector.id' but there is only a handler for
      'gui.inspector' it will first try 'gui.inspector.id' then drop the 'id'
      until it finds something, or fails
      @param {String} key - The key for the registered dispatchers.
      @param {Object} dispatchers - The collection of registered dispatchers.
      @return {Object|Boolean} Either the matching dispatchers and key or false.
    */
    function findDispatchers(key, dispatchers) {
      const found = dispatchers[key];
      if (!found) {
        const newKey = key.split('.').slice(0, -1).join('.');
        if (newKey !== '') {
          return findDispatchers(newKey, dispatchers);
        } else {
          return false;
        }
      }
      return {
        dispatchers: found,
        key: key
      };
    }
    // Recurse up the dispatcher tree to find matching dispatchers.
    const matchingDispatchers = findDispatchers(key, this._dispatchers);
    // If this dispatcher has already been called for this state then don't call
    // it again. e.g. 'gui.inspector' should only be called once for
    // 'gui.inspector.id' and 'gui.inspector.unit'.
    if (dispatched.indexOf(matchingDispatchers.key) > -1) {
      return;
    }
    const dispatchers = matchingDispatchers.dispatchers;
    if (!dispatchers) {
      console.warn('No dispatcher found for key:', key);
      return;
    }
    const iterator = dispatchers[Symbol.iterator]();
    const next = () => {
      const data = iterator.next();
      if (!data.done) {
        const index = cleanup ? 1 : 0;
        // The 0 index is the 'create' dispatcher, the 1 index is the
        // 'cleanup' dispatcher.
        const dispatcher = data.value[index];
        if (typeof dispatcher === 'function') {
          dispatcher(state, next);
        }
      }
    };
    next();
    return matchingDispatchers.key;
  }

  /**
    Changes the internal state of the app, updating the location and
    dispatching the app.
    @param {Object} changes - The new state delta to apply to the
      existing state.
  */
  changeState(changes) {
    /**
      Merge two objects together or clone one. Only works with simple values.
      Source values overwrite target values.
      @param {Object} target - The root object.
      @param {Object} source - The object to clone or merge into the target.
      @return {Object} The merged or cloned object.
    */
    let nullKeys = [];
    function merge(target, source, keys = []) {
      if (typeof source === 'object' && source !== null) {
        Object.keys(source).forEach(key => {
          keys.push(key);
          const value = source[key];
          if (typeof value === 'object' && value !== null) {
            target[key] = merge(target[key] || {}, value, keys);
          } else {
            // If the value is null then we don't want it in state.
            if (value !== null) {
              target[key] = value;
            } else {
              // Keep track of the paths for the values that are null.
              nullKeys.push(keys.join('.'));
              if (target[key] !== undefined) {
                delete target[key];
              }
            }
          }
          keys.pop();
        });
        keys = [];
      } else {
        target = source;
      }
      return target;
    }

    /**
      Returns if an object is empty or not by counting the
      enumerable properties.
      @param {Object} obj - The object to check if empty.
      @return {Boolean} If the object is empty or not.
    */
    function isEmptyObject(obj) {
      return !!Object.keys(obj).length;
    }

    /**
      Prunes the null and undefined objects from the state.
      @param {Object} obj - The object to prune.
      @param {Object} The pruned object.
    */
    function pruneEmpty(obj) {
      function prune(current) {
        Object.keys(current).forEach(key => {
          const value = current[key];
          if (value === null ||
              value === undefined ||
              (typeof value === 'object' && !isEmptyObject(prune(value)))) {
            delete current[key];
          }
        });
        return current;
      };
      return prune(obj);
    }

    const mergedState = merge(
      // Clone the current state so we don't end up clobbering old states.
      merge({}, this.current), changes);
    const purgedState = pruneEmpty(merge({}, mergedState));

    this._appStateHistory.push(purgedState);
    this._pushState();

    // Emiting a google tag manager event registering the state change.
    if (window.dataLayer) {
      window.dataLayer.push({
        'event': 'GAEvent',
        'eventCategory': 'Navigation',
        'eventAction': 'State change',
        'eventLabel': this.location.href,
        'eventValue': undefined
      });
    }

    let {error} = this.dispatch(nullKeys, false);
    if (error !== null) {
      console.error(error);
    }
  }

  /**
    Pushes the current state to the browser history using pushState.
  */
  _pushState() {
    this.browserHistory.pushState({}, 'Juju GUI', this.generatePath());
  }

  /**
    Splits the URL up and generates a state object.
    @param {String} url - The URL to turn into state.
    @return {Object} The generated state object. In the format:
      {
        error: <String>,
        state: <Object
      }
  */
  generateState(url) {
    // If we have a single part and it's an empty string then we are at '/' and
    // there is nothing to parse so we can return early or it's an invalid path.
    const invalidParts =
      parts => !parts || (parts.length === 1 && parts[0] === '');
    const invalidRootPath = 'invalid root path.';
    const invalidStorePath = 'invalid store path.';
    let error = null;
    let state = {};
    const splitURL = this._processURL(url);
    let parts = splitURL.parts;
    const query = splitURL.query;
    state = this._parseSpecial(query, state);
    // If we have an invalid parts or invalid query then we can return early.
    if (invalidParts(parts) && !query) {
      return {error, state};
    }
    state = this._parseRoot(parts, state);
    // If we have root paths in the URL then we can ignore everything else.
    if (state.root) {
      // If there is anything after this then it's an invalid URL.
      // Unless it's the store. This is a hack for 2.3.0 release and
      // should be removed when the store url routing is sorted.
      // This fixes an issue that even though `/store/u/:user/:model` isn't
      // a valid url navigating through the search box works, navigating
      // backwards from an entity doesn't work.
      if (parts.length > 1 && parts[0] !== 'store') {
        error = invalidRootPath;
      }
      return {error, state};
    }
    // The order of the PATH_DELIMETERS is important so we can assume the
    // order for easy parsing of the path.
    if (!invalidParts(parts) && parts[0] === PATH_DELIMETERS.get('search')) {
      state = this._parseSearch(parts.splice(1), query, state);
      // If we have a search path in the URL then we can ignore everything else.
      return {error, state};
    }
    // We should be done parsing the parts and query now so if there are
    // no more valid parts we can dump out early.
    if (invalidParts(parts)) {
      return {error, state};
    }
    // Working backwards to split up the URL.
    const guiIndex = parts.indexOf(PATH_DELIMETERS.get('gui'));
    if (guiIndex > -1) {
      // XXX This return value isn't using object destructuring because babili
      // minifier incorrectly munges the return values and it breaks. In the
      // future it can be reverted and tested against a newer version than
      // 0.0.9
      const parsed = this._parseGUI(parts.splice(guiIndex), state);
      error = parsed.error;
      state = parsed.state;
      if (error !== null) {
        error = `cannot parse the GUI path: ${error}`;
        return {error, state};
      }
    }
    // Extract out the user sections.
    if (parts.includes(PATH_DELIMETERS.get('user'))) {
      // XXX This return value isn't using object destructuring because babili
      // minifier incorrectly munges the return values and it breaks. In the
      // future it can be reverted and tested against a newer version than
      // 0.0.9
      const parsed = this._parseUser(parts, state);
      state = parsed.state;
      parts = parsed.parts;
      error = parsed.error;
      if (error !== null) {
        error = `cannot parse the User path: ${error}`;
        return {error, state};
      }
    }
    const partsLength = parts.length;
    // By this point there should only be the 'store only' content left.
    if (!state.store && partsLength) {
      // If there are more than 3 parts then this is an invalid url.
      if (partsLength > 3) {
        error = invalidStorePath;
      } else {
        state.store = parts.join('/');
      }
      // If we have more content here but there is already a store populated.
      // then this is an invalid url.
    } else if (state.store && partsLength) {
      error = invalidStorePath;
      state.store = parts.join('/');
    }
    return {error, state};
  }

  /**
    Takes the existing app state and generates the path.
    @return {String} The path representing the current application state.
  */
  generatePath() {
    let path = [];
    const root = this.current.root;
    if (root) {
      path.push(root);
    }
    const search = this.current.search;
    if (search) {
      path.push(PATH_DELIMETERS.get('search'));
      // Append the text if it is truthy, i.e. not a blank string etc.
      if (search.text) {
        path.push(search.text);
      }
      const querystrings = [];
      const keys = Object.keys(search);
      // Everything that is not the 'text' param should be appened as a query
      // string.
      if (keys.length > 0) {
        // Generate the key/value pairs.
        keys.forEach(key => {
          // The text parameter is handled as part of the path.
          if (key !== 'text') {
            querystrings.push(`${key}=${search[key]}`);
          }
        });
        if (querystrings.length > 0) {
          path.push(`?${querystrings.join('&')}`);
        }
      }
    }
    const user = this.current.user || this.current.profile;
    if (user) {
      path = path.concat([PATH_DELIMETERS.get('user'), user]);
    }
    const model = this.current.model;
    if (model) {
      path = path.concat([PATH_DELIMETERS.get('user'), model.path]);
    }
    const store = this.current.store;
    if (store) {
      path.push(store);
    }
    const gui = this.current.gui;
    if (gui) {
      path.push(PATH_DELIMETERS.get('gui'));
      Object.keys(gui).forEach(key => {
        const value = gui[key];
        path.push(key);
        if (value !== '') {
          if (key === 'inspector') {
            const id = value.id;
            if (id) {
              path.push(id);
            }
            const activeComponent = value.activeComponent;
            if (activeComponent) {
              path.push(activeComponent);
            }
            const activeValue = value[activeComponent];
            if (activeValue && typeof activeValue !== 'boolean') {
              path.push(activeValue);
            }
            const localType = value.localType;
            if (localType) {
              path.push('local');
              path.push(localType);
            }
          } else {
            path.push(value);
          }
        }
      });
    }
    return `${this.baseURL}${path.join('/')}`;
  }

  /**
    Inspects the query path to see if there are parts in the special section.
    @param {Object} query - The query path split into parts.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object} The updated state to contain the root value, if any.
  */
  _parseSpecial(query, state) {
    if (query && query['deploy-target']) {
      if (!state.special) {
        state.special = {};
      }
      state.special.deployTarget = query['deploy-target'];
      // Push the state so that any special query string is removed now,
      // therefore avoiding multiple dispatches of the same special callback.
      this._pushState();
    }
    return state;
  }

  /**
    Inspects the URL path to see if it is for the root.
    @param {Array} urlParts - The URL path split into parts.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object} The updated state to contain the root value, if any.
  */
  _parseRoot(urlParts, state) {
    ROOT_RESERVED.some(key => {
      if (urlParts && urlParts[0] === key) {
        state.root = key;
        return true;
      }
    });
    return state;
  }

  /**
    Parses the search portion of the URL without the
    PATH_DELIMETERS.get('search') key value.
    @param {Array} urlParts - The URL path split into parts.
    @param {Object} query - The query portion of the path.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object} The updated state to contain the search value, if any.
  */
  _parseSearch(urlParts, query, state) {
    if (urlParts.length > 0) {
      state.search = {
        text: urlParts.join('/')
      };
    }
    if (query) {
      const queryKeys = Object.keys(query);
      if (queryKeys.length) {
        if (!state.search) {
          state.search = {};
        }
        queryKeys.forEach(key => {
          const value = query[key];
          state.search[key] = value.includes(',') ? value.split(',') : value;
        });
      }
    }
    return state;
  }

  /**
    Parses the GUI portion of the URL without the
    PATH_DELIMETERS.get('gui') key value.
    @param {Array} urlParts - The URL path split into parts.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object} The updated state to contain the search value, if any.
  */
  _parseGUI(urlParts, state) {
    let error = null;
    let indexes = [];
    GUI_PATH_DELIMETERS.forEach(section => {
      const index = urlParts.indexOf(section);
      if (index > -1) {
        indexes.push(index);
      }
    });
    // If there were no sections found then this is an invalid URL.
    if (!indexes.length) {
      error = 'invalid GUI path.';
      return {error, state};
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
    const inspectorParts = guiParts.inspector;
    if (inspectorParts) {
      guiParts.inspector = this._parseInspector(inspectorParts);
    }
    state.gui = guiParts;
    return {error, state};
  }

  /**
    Parses the inspector state string and returns the parsed object.
    @param {String} inspectorState - The state of the inspector.
    @return {Object} The parsed state.
  */
  _parseInspector(inspectorState) {
    const parts = inspectorState.split('/');
    let state = {};
    if (parts[0] === 'local') {
      state.localType = parts[1];
    } else {
      state.id = parts[0];
      if (parts[1]) {
        state.activeComponent = parts[1];
        state[parts[1]] = parts[2] || true;
      }
    }
    return state;
  }

  /**
    Parses the URL and extracts the user delimeted sections.
    @param {Array} urlParts - The URL path split into parts.
    @param {Object} state - The application state object as being parsed
      from the URL.
    @return {Object} Contains the state, parts, error if any.
  */
  _parseUser(urlParts, state) {
    // Grab the indexes of the user delimeters as there can be multiple.
    let indexes = [];
    let error = null;
    urlParts.forEach((item, index) => {
      if (item === PATH_DELIMETERS.get('user')) {
        indexes.push(index);
      }
    });
    // If we have no user parts then we don't need to parse them.
    if (indexes.length === 0) {
      return { state, parts: urlParts, error };
    }
    // If we don't have a user delimeter at 0 then this is an invalid URL.
    if (indexes[0] !== 0) {
      return { state, parts: urlParts, error: 'invalid user path.'};
    }
    /**
      Takes the section of the URL parts which needs to be added to either the
      user or profile section and depending on its contents adds it to the
      appropriate section. This modifies the state object in place but also
      returns the state for completeness.
      @param {Array} block - The section of the URL parts which contains the
        data necessary to add to the state depending on its contents.
      @param {Object} state - The current instance of the state object.
      @returns {Object} The modified state object.
    */
    function addToUserOrProfile(block, state) {
      // If the second part of the path has one of the reserved words
      // from the profile then store it in the profile section
      if (block.length === 1 ||
          block[1] && PROFILE_RESERVED.includes(block[1])) {
        state.profile = block.join('/');
      } else {
        state.user = block.join('/');
      }
      return state;
    }

    switch (indexes.length) {
      case 1:
        // Extract out the user portion of the list and then remove the
        // user delimeter at the beginning.
        const userBlock = urlParts.splice(indexes[0]).slice(1);
        // If there are no sections after the delimeter is removed then this
        // is an invalid url.
        if (userBlock.length === 0) {
          return {state, parts: urlParts, error: 'invalid user path.'};
        }
        // The userBlock might have user components and store components.
        // The user component has at most two spots. If it has more, then
        // it may be a user store path.
        if (userBlock.length > 2) {
          // Check if this is a user store path.
          if (!Number.isNaN(parseInt(userBlock[2], 10)) ||
            this.seriesList.includes(userBlock[2])) {
            // Add the user prefix back in if it's a user store path.
            state.store = 'u/' + userBlock.splice(0).join('/');
          }
        }
        // If there are still parts then it wasn't a long user store URL
        // so only grab the user path.
        if (userBlock.length) {
          let block = userBlock.splice(0, 2);
          state = addToUserOrProfile(block, state);
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
        let block = urlParts.splice(indexes[0], indexes[1]).slice(1);
        // If there are more than two parts in the first block when we have
        // two user blocks then the url is invalid.
        if (block.length > 2) {
          return {state, parts: urlParts, error: 'invalid user path.'};
        }
        state = addToUserOrProfile(block, state);
        // The second user portion will be the store section.
        const storeBlock = urlParts.splice(0).slice(1);
        // If there are less than two or more than four sections after
        // the delimeter is removed then this is an invalid url.
        if (storeBlock.length < 2 || storeBlock.length > 4) {
          return {state, parts: urlParts, error: 'invalid user store path.'};
        }
        // Add the user prefix back in if it's a user store path.
        state.store = 'u/' + storeBlock.join('/');
        break;
    }

    return {state, parts: urlParts, error};
  }
};

this.jujugui.State = State;
