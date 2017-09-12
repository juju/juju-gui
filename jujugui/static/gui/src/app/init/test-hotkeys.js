/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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


const Keysim = require('keysim');
const hotkeys = require('./hotkeys');
const utils = require('../../test/utils');

describe('hotkeys', function() {
  const keyboard = Keysim.Keyboard.US_ENGLISH;
  let container, context;

  beforeEach(() => {
    context = {
      _clearSettingsModal: sinon.stub(),
      _clearShortcutsModal: sinon.stub(),
      _displaySettingsModal: sinon.stub(),
      _displayShortcutsModal: sinon.stub()
    };
    hotkeys.activate(context);
    container = utils.makeAppContainer();
  });

  afterEach(() => {
    container.remove();
  });

  it('should listen for "?" events', function() {
    window.GUI_VERSION = {version: '1.2.3', commit: '123abc]'};
    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.SHIFT, 191);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    assert.equal(context._displayShortcutsModal.callCount, 1,
      'The shortcuts component did not render');
  });

  it('should listen for "!" events', function() {
    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.SHIFT, 49);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    assert.equal(context._displaySettingsModal.callCount, 1,
      'The settings component did not render');
  });

  it('should listen for Alt-S key events', function() {
    let searchInput = document.createElement('input');
    searchInput.setAttribute('id', 'charm-search-field');
    container.appendChild(searchInput);

    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.ALT, 83);
    keyboard.dispatchEventsForKeystroke(keystroke, container);

    // Did charm-search-field get the focus?
    assert.equal(searchInput, document.activeElement);
  });
});
