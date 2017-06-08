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
    let cookieResets = [];

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'app-cookies-extension', 'cookie', 'juju-tests-utils'
      ], function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      container = utils.makeContainer(this, 'container');
      node = document.createElement('div');
      node.setAttribute('id', 'cookie-container');
      container.appendChild(node);
      cookieHandler = new Y.juju.Cookies(node);
    });

    afterEach(function() {
      cookieResets.push('_cookies_accepted');
      localStorage.removeItem('disable-cookie');
      cookieResets.forEach(cookie => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
    });

    it('calling check makes the node visible', function() {
      assert.equal(node.children.length, 0);
      cookieHandler.check();
      assert.equal(node.children.length > 0, true);
    });

    it('closing the banner sets the cookie', function() {
      assert.isNull(cookieHandler._getCookie('_cookies_accepted'));
      cookieHandler.close();
      assert.equal(cookieHandler._getCookie('_cookies_accepted'), 'true');
    });

    it('the cookie prevents the node from getting visible', function() {
      cookieHandler._setCookie('_cookies_accepted', 'true');
      cookieHandler.check();
      assert.equal(node.children.length, 0);
    });

    it('the custom setting also does', function() {
      localStorage.setItem('disable-cookie', 'true');
      cookieHandler.check();
      assert.equal(node.children.length, 0);
    });

    it('can get a cookie', function() {
      document.cookie = 'cookie1=value;';
      document.cookie = 'cookie2=value2;';
      cookieResets.push('cookie1');
      cookieResets.push('cookie2');
      assert.equal(cookieHandler._getCookie('cookie2'), 'value2');
    });

    it('can get a cookie with whitespace', function() {
      document.cookie = ' cookie1 = value ;';
      document.cookie = ' cookie2 = value2 ';
      cookieResets.push('cookie1');
      cookieResets.push('cookie2');
      assert.equal(cookieHandler._getCookie('cookie1'), 'value');
    });

    it('can get a cookie without a value', function() {
      document.cookie = 'cookie1=;';
      document.cookie = 'cookie2=value2';
      cookieResets.push('cookie1');
      cookieResets.push('cookie2');
      assert.equal(cookieHandler._getCookie('cookie1'), '');
    });

    it('can not get a cookie that does not exist', function() {
      document.cookie = 'cookie1=';
      document.cookie = 'cookie2=value2';
      cookieResets.push('cookie1');
      cookieResets.push('cookie2');
      assert.strictEqual(cookieHandler._getCookie('cookie3'), null);
    });

    it('can set a cookie', function() {
      cookieHandler._setCookie('cookie1', 'value1');
      cookieResets.push('cookie1');
      assert.equal(document.cookie, 'cookie1=value1');
    });

    it('can set a cookie with an expiry', function() {
      cookieHandler._setCookie(
        'cookie1', 'value1', new Date('January 12, 2025'));
      cookieResets.push('cookie1');
      assert.equal(document.cookie, 'cookie1=value1');
    });

    it('can pass the right values to set a cookie with an expiry', function() {
      const setDocumentCookie = sinon.stub(cookieHandler, '_setDocumentCookie');
      cookieHandler._setCookie(
        'cookie1', 'value1', 'Sun Jan 12 2025 00:00:00 GMT+1100 (AEDT)');
      assert.equal(setDocumentCookie.callCount, 1);
      assert.equal(
        setDocumentCookie.args[0][0],
        'cookie1=value1; expiry=Sun Jan 12 2025 00:00:00 GMT+1100 (AEDT)');
      setDocumentCookie.restore();
    });
  });

})();
