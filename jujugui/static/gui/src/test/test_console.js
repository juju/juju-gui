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

describe('application console', function() {
  var Y, consoleManager;
  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-views',
                               'juju-view-utils',
                               'juju-tests-utils'],
    function(Y) {
      consoleManager = Y.namespace('juju.views.utils')
                          .consoleManager();
      done();
    });
  });

  afterEach(function() {
    consoleManager.native();
  });

  it('should disable/restore the console', function() {
    var logCalled = false,
        message = null;


    consoleManager.console({
      log: function() {
        logCalled = true;
        message = arguments[0];
      }});

    consoleManager.native();
    console.log('TEST');
    assert.isFalse(logCalled);

    consoleManager.noop();
    console.log('TEST');
    assert.isTrue(logCalled);
    assert.equal('TEST', message);
  });



});

