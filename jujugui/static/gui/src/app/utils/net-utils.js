/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

/**
  Provides network utility helpers.

  @module juju
*/
YUI.add('net-utils', function(Y) {

  var isPrivate = /(^127\.0\.0\.1)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)|localhost/; // eslint-disable-line max-len

  /**
    Select and return the first public ipv4 address from the given list.
    If no public addresses are found, the last address in the provided list is
    returned. If no addresses are provided, null is returned.
    Addresses can optionally include the port, like "1.2.3.4:8080".

    @function chooseAddress
    @param {Array} addresses The list of IP addresses.
    @returns {String} The selected address from the given list.
  */
  juju.chooseAddress = function(addresses) {
    var addr = null;
    addresses.some(function(address) {
      addr = address;
      return !isPrivate.test(address);
    });
    return addr;
  };

}, '', {
  requires: []
});
