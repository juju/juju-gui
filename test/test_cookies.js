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

  describe('cookies', function() {
    var checker, cookie, cp_node, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'cookie', 'juju-cookies', 'node', 'node-event-simulate'
      ], function(Y) {
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      checker = new juju.Cookies();
    });

    afterEach(function() {
      Y.Cookie.remove('_cookies_accepted');
      cp_node = Y.one('.cookie-policy');
      if (cp_node) {
        cp_node.remove();
      }
    });

    it('check creates node', function() {
      assert.isNull(Y.one('.cookie-policy'));
      checker.check();
      Y.one('.cookie-policy').setStyle('visibility', 'hidden');
      assert.isObject(Y.one('.cookie-policy'));
    });

    it('closing banner sets cookie', function() {
      assert.isNull(Y.one('.cookie-policy'));
      checker.check();
      cp_node = Y.one('.cookie-policy .link-cta');
      cp_node.setStyle('visibility', 'hidden');
      cp_node.simulate('click');
      cookie = Y.Cookie.get('_cookies_accepted');
      assert.equal(cookie, 'true');
    });

    it('cookie prevents node creation', function() {
      Y.Cookie.set('_cookies_accepted', 'true');
      assert.isNull(Y.one('.cookie-policy'));
      checker.check();
      assert.isNull(Y.one('.cookie-policy'));
    });

  });

})();
