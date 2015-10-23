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
    var container, cookieHandler, node, utils, Y;

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
      container = utils.makeContainer(this, 'container');
      container.setHTML('<div class="cookie-policy" style="display:none;">' +
          '<a class="link-cta"></a></div>');
      node = container.one('.cookie-policy');
      cookieHandler = new Y.juju.Cookies(node);
    });

    afterEach(function() {
      Y.Cookie.remove('_cookies_accepted');
      localStorage.removeItem('disable-cookie');
    });

    it('calling check makes the node visible', function() {
      assert.equal(node.getStyle('display'), 'none');
      cookieHandler.check();
      assert.equal(node.getStyle('display'), 'block');
    });

    it('closing the banner sets the cookie', function() {
      assert.isNull(Y.Cookie.get('_cookies_accepted'));
      cookieHandler.check();
      node.one('.link-cta').simulate('click');
      assert.equal(Y.Cookie.get('_cookies_accepted'), 'true');
    });

    it('the cookie prevents the node from getting visible', function() {
      Y.Cookie.set('_cookies_accepted', 'true');
      cookieHandler.check();
      assert.equal(node.getStyle('display'), 'none');
    });

    it('the custom setting also does', function() {
      localStorage.setItem('disable-cookie', 'true');
      cookieHandler.check();
      assert.equal(node.getStyle('display'), 'none');
    });

  });

})();
