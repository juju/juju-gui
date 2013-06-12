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

(function() {

  describe('app-cookies-extension', function() {
    var container, cookie, cookieHandler, display, utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'app-cookies-extension', 'cookie', 'juju-tests-utils',
        'node-event-simulate'
      ], function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      container = utils.makeContainer('container');
      cookieHandler = new Cookies(container);
    });

    afterEach(function() {
      Y.Cookie.remove('_cookies_accepted');
      container.remove(true);
    });

    it('calling check makes the node visible', function() {
      // The node is set to 'display: none' at first.
      cookieHandler.check();
      display = Y.one('.cookie-policy').getStyle('display');
      assert.equal(display, 'block');
    });

    it('closing the banner sets the cookie', function() {
      cookieHandler.check();
      Y.one('.cookie-policy .link-cta').simulate('click');
      cookie = Y.Cookie.get('_cookies_accepted');
      assert.equal(cookie, 'true');
    });

    it('the cookie prevents the node from getting visible', function() {
      // The node is set to 'display: none' at first.
      Y.Cookie.set('_cookies_accepted', 'true');
      cookieHandler.check();
      display = Y.one('.cookie-policy').getStyle('display');
      assert.equal(display, 'none');
    });

  });

})();
