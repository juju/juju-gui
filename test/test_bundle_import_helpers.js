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

  describe('bundle-import-helpers', function() {
    var Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('bundle-import-helpers', function(Y) {
        var ns = Y.namespace('juju');
        console.log(ns);
        done();
      });
    });

    //it('adds a notification if bundle import is successful', function(done) {
    //  var expected = {
    //    title: 'Bundle Deployment Requested',
    //    message: 'Bundle deployment request successful. The full deployment '
    //        'can take some time to complete',
    //    level: 'important'
    //  };
    //  utils.deployBundleCallback({
    //    add: function(notification) {
    //      assert.deepEqual(notification, expected);
    //      done();
    //    }}, {});
    //});

    //it('adds a notification if a deployment error occurs', function(done) {
    //  var expected = {
    //    title: 'Bundle Deployment Failed',
    //    message: 'Unable to deploy the bundle. The server returned the ' +
    //        'following error: bad wolf',
    //    level: 'error'
    //  };
    //  utils.deployBundleCallback({
    //    add: function(notification) {
    //      assert.deepEqual(notification, expected);
    //      done();
    //    }}, {err: 'bad wolf'});
    //});
  });

})();
