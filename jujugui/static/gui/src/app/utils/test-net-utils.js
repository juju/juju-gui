/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2014 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('net utils', function() {

  beforeAll(function(done) {
    YUI().use('net-utils', () => { done(); });
  });

  describe('chooseAddress', function() {

    it('selects the first public address', function() {
      var addresses = ['127.0.0.1', '10.0.0.1', '1.2.3.4', '4.3.2.1'];
      var address = juju.chooseAddress(addresses);
      assert.strictEqual(address, '1.2.3.4');
    });

    it('returns null if no addresses are provided', function() {
      var address = juju.chooseAddress([]);
      assert.strictEqual(address, null);
    });

    it('returns the last address if no public ones are found', function() {
      var addresses = ['192.168.1.1', '10.0.0.1', '10.0.3.1'];
      var address = juju.chooseAddress(addresses);
      assert.strictEqual(address, '10.0.3.1');
    });

    it('handles addresses including ports', function() {
      var addresses = ['localhost:8080', '192.168.0.1:20', '1.2.3.4:56'];
      var address = juju.chooseAddress(addresses);
      assert.strictEqual(address, '1.2.3.4:56');
    });

  });

});
