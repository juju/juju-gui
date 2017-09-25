/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const ReactDOM = require('react-dom');

const utils = require('./utils');

const keyBindings = {
  'A-s': {
    target: '#charm-search-field',
    focus: true,
    help: 'Select the charm Search',
    label: 'Alt + s'
  },
  '/': {
    target: '.header-search__input',
    focus: true,
    help: 'Select the charm Search'
  },
  'S-1': {
    callback: function() {
      this._clearShortcutsModal();
      if (document.getElementById('modal-gui-settings').
        children.length > 0) {
        this._clearSettingsModal();
      } else {
        this._displaySettingsModal();
      }
    },
    help: 'GUI Settings',
    label: 'Shift + !'
  },
  'S-/': {
    callback: function() {
      this._clearSettingsModal();
      if (document.getElementById('modal-shortcuts').
        children.length > 0) {
        this._clearShortcutsModal();
      } else {
        this._displayShortcutsModal();
      }
    },
    help: 'Display this help',
    label: 'Shift + ?'
  },
  'S-+': {
    fire: 'topo.zoom_in',
    help: 'Zoom In',
    label: 'Shift + "+"'
  },
  'S--': {
    fire: 'topo.zoom_out',
    help: 'Zoom Out',
    label: 'Shift + -'
  },
  'S-0': {
    fire: 'topo.panToCenter',
    help: 'Center the model overview',
    label: 'Shift + 0'
  },
  'esc': {
    fire: 'topo.clearState',
    callback: function() {
      this._clearSettingsModal();
      this._clearShortcutsModal();
    },
    help: 'Cancel current action',
    label: 'Esc'
  },

  'S-d': {
    callback: function(evt) {
      utils.exportEnvironmentFile(this.db);
    },
    help: 'Export the model',
    label: 'Shift + d'
  }
};

/**
  Activate the key listeners.
  @param {Object} context The context to execute the hotkey callbacks under.
  @return {Object} A reference to deactivate the listeners.
*/
const activate = context => {
  const key_map = {
    '1': 49, '/': 191, '?': 63, '+': 187, '-': 189,
    enter: 13, esc: 27, backspace: 8,
    tab: 9, pageup: 33, pagedown: 34};
  const code_map = {};
  Object.keys(key_map).forEach(k => code_map[key_map[k]] = k);
  const listener = evt => {
    // Normalize key-code
    // This gets triggered by different types of elements some YUI some
    // React. So try and use the native tagName property first, if that
    // fails then fall back to ReactDOM.findDOMNode().
    let tagName = evt.target.tagName;
    let contentEditable = evt.target.contentEditable;
    let currentKey;
    if (code_map[evt.keyCode]) {
      currentKey = code_map[evt.which];
    } else {
      currentKey = String.fromCharCode(evt.which).toLowerCase();
    }
    if (!tagName) {
      tagName = ReactDOM.findDOMNode(evt.target).tagName;
    }
    if (!contentEditable) {
      contentEditable = ReactDOM.findDOMNode(evt.target).contentEditable;
    }
    // Don't ignore esc in the search box.
    if (currentKey === 'esc' &&
        evt.target.className === 'header-search__input') {
      // Remove the focus from the search box.
      evt.target.blur();
      // Target filtering, we want to listen on window
      // but not honor hotkeys when focused on
      // text oriented input fields.
    } else if (['INPUT', 'TEXTAREA'].indexOf(tagName) !== -1 ||
               contentEditable === 'true') {
      return;
    }
    const symbolic = [];
    if (evt.ctrlKey) { symbolic.push('C');}
    if (evt.altKey) { symbolic.push('A');}
    if (evt.shiftKey) { symbolic.push('S');}
    symbolic.push(currentKey);
    const trigger = symbolic.join('-');
    const spec = keyBindings[trigger];
    if (spec) {
      if (spec.condition && !spec.condition.call(context)) {
        // Note that when a condition check fails,
        // the event still propagates.
        return;
      }
      const target = document.querySelector(spec.target);
      if (target) {
        if (spec.toggle) {
          if (target.classList.contains('hidden')) {
            target.classList.remove('hidden');
          } else {
            target.classList.add('hidden');
          }
        }
        if (spec.focus) { target.focus(); }
      }
      if (spec.callback) { spec.callback.call(context, evt, target); }
      // HACK w/o context/view restriction but right direction
      if (spec.fire) {
        document.dispatchEvent(new Event(spec.fire));
      }
      // If we handled the event nothing else has to.
      evt.stopPropagation();
    }
  };
  const boundListener = listener.bind(this);
  document.addEventListener('keydown', boundListener);
  return {
    deactivate: deactivate.bind(this, boundListener)
  };
};

/**
  Deactivate the key listeners.
  @param {Object} context The context to execute the hotkey callbacks under.
*/
const deactivate = listener => {
  document.removeEventListener('keydown', listener);
};

module.exports = {activate, keyBindings};
