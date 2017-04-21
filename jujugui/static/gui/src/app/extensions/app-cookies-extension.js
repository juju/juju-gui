/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

YUI.add('app-cookies-extension', function(Y) {

  /**
    A cookies warning handler, enabled when using analytics.

     @class Cookies
     @extension App
     @param {Object} test_node DOM node only passed in in tests.
   */
  function Cookies(test_node) {
    this.node = test_node || document.body;
  }

  Cookies.prototype = {

    /**
      Get the value for a cookie.

      @method _getCookie
      @param cookie {String} The name of the cookie.
      @return {String} The value of the cookie.
    */
    _getCookie: function(cookie) {
      let value = null;
      document.cookie.split(';').some(pair => {
        const parts = pair.split('=');
        if (parts[0].trim() === cookie) {
          value = parts.length == 2 && parts[1].trim() || '';
          return true;
        }
      });
      return value;
    },

    /**
      Set a cookie. This is here so that we can test that the right values were
      passed.

      @method _setCookie
      @param cookie {String} A cookie to set.
    */
    _setDocumentCookie: function(cookie) {
      document.cookie = cookie;
    },

    /**
      Set the value for a cookie.

      @method _setCookie
      @param cookie {String} The name of the cookie.
      @param value {String} The value of the cookie.
      @param expiry {String} The expiry for the cookie.
    */
    _setCookie: function(cookie, value, expiry) {
      let pairs = [`${cookie}=${value}`];
      if (expiry) {
        pairs.push(`expiry=${expiry}`);
      }
      this._setDocumentCookie(pairs.join('; '));
    },

    /**
      Check that the user accepted cookie usage, and if not display a cookie
      usage warning.

      @method check
      @return {undefined} Side-effects only.
    */
    check: function() {
      if (this._getCookie('_cookies_accepted') !== 'true' &&
          !localStorage.getItem('disable-cookie')) {
        this.node.classList.add('display-cookie-notice');
        document.querySelector('.link-cta').addEventListener('click',
          evt => {
            evt.preventDefault();
            this.close();
          });
      } else {
        this.node.classList.remove('display-cookie-notice');
      }
    },

    /**
      Close the cookie usage warning and set a cookie to denote user agreement.

      @method close
      @return {undefined} Side-effects only.
    */
    close: function() {
      this.node.classList.remove('display-cookie-notice');
      this._setCookie(
        '_cookies_accepted', 'true', new Date('January 12, 2025'));
    }

  };

  Y.namespace('juju').Cookies = Cookies;

}, '0.1.0', {
  requires: [
  ]
});
