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
    this.node = test_node || Y.one('body');
  }

  Cookies.prototype = {

    /**
      Check that the user accepted cookie usage, and if not display a cookie
      usage warning.

      @method check
      @return {undefined} Side-effects only.
    */
    check: function() {
      var self = this;
      if (Y.Cookie.get('_cookies_accepted') !== 'true' &&
          !localStorage.getItem('disable-cookie')) {
        this.node.addClass('display-cookie-notice');
        Y.one('.link-cta').once('click', function(evt) {
          evt.preventDefault();
          self.close();
        });
      } else {
        this.node.removeClass('display-cookie-notice');
      }
    },

    /**
      Close the cookie usage warning and set a cookie to denote user agreement.

      @method close
      @return {undefined} Side-effects only.
    */
    close: function() {
      this.node.removeClass('display-cookie-notice');
      Y.Cookie.set('_cookies_accepted', 'true',
          {expires: new Date('January 12, 2025')});
    }

  };

  Y.namespace('juju').Cookies = Cookies;

}, '0.1.0', {
  requires: [
    'base',
    'cookie'
  ]
});
