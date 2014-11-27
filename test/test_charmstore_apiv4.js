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

describe('Charmstore API v4', function() {
  var APIv4, charmstore, utils, Y;

  before(function(done) {
    var modules = ['charmstore-api', 'juju-tests-utils'];
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      APIv4 = Y.juju.charmstore.APIv4;
      utils = Y['juju-tests'].utils;
      done();
    });
  });

  beforeEach(function() {
    charmstore = new APIv4({
      env: {
        getLocalCharmFileUrl: utils.makeStubFunction('localcharmpath')
      },
      charmstoreURL: 'local/'
    });
  });

  afterEach(function() {
    charmstore = null;
  });

  it('can be instantiated with the proper config values', function() {
    assert.equal(charmstore.charmstoreURL, 'local/');
  });

  describe('getIconpath', function() {

    it('returns local default bundle icon location for bundles', function() {
      var path = charmstore.getIconPath('bundle:elasticsearch', true);
      assert.equal(path, '/juju-ui/assets/images/non-sprites/bundle.svg');
    });

    it('returns a qualified charmstoreURL icon location', function() {
      var path = charmstore.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
          path,
          'local/v4/~paulgear/precise/quassel-core-2/icon.svg');
    });
  });

});
