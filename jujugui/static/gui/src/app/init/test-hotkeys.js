/* Copyright (C) 2017 Canonical Ltd. */
'use strict';


const keysim = require('keysim');
const hotkeys = require('./hotkeys');
const utils = require('./testing-utils');

describe('hotkeys', function() {
  let container, listener;
  const keyboard = keysim.Keyboard.US_ENGLISH;

  beforeEach(() => {
    listener = hotkeys.activate();
    container = utils.makeAppContainer();
  });

  afterEach(() => {
    listener.deactivate();
    container.remove();
    listener = null;
    container = null;
  });

  it('should listen for "?" events', function() {
    const modalListener = sinon.stub();
    document.addEventListener('displayShortcutsModal', modalListener);
    const keystroke = new keysim.Keystroke(keysim.Keystroke.SHIFT, 191);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    assert.equal(modalListener.calledOnce, true);
    document.removeEventListener('displayShortcutsModal', modalListener);
  });

  it('should listen for "!" events', function() {
    const modalListener = sinon.stub();
    document.addEventListener('displaySettingsModal', modalListener);
    const keystroke = new keysim.Keystroke(keysim.Keystroke.SHIFT, 49);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    assert.equal(modalListener.calledOnce, true);
    document.removeEventListener('displaySettingsModal', modalListener);
  });

  it('should listen for Alt-S key events', function() {
    let searchInput = document.createElement('input');
    searchInput.setAttribute('id', 'charm-search-field');
    container.appendChild(searchInput);

    const keystroke = new keysim.Keystroke(keysim.Keystroke.ALT, 83);
    keyboard.dispatchEventsForKeystroke(keystroke, container);

    // Did charm-search-field get the focus?
    assert.equal(searchInput, document.activeElement);
  });
});
