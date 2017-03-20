/*
 This file is part of the Juju GUI, which lets users view and manage Juju
 environments within a graphical interface (https://launchpad.net/juju-gui).
 Copyright (C) 2017 Canonical Ltd.

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

YUI.add('user', function() {

  const User = class User {

    constructor(cfg) {
      this.macaroons = {};
      this.storage = cfg.storage || sessionStorage;
    }

    get name() {}

    get identity() {
      return this.macaroons['identity'];
    }

    set identity(token) {
      return this.macaroons['identity']
    }

    get charmstore() {
      return this.macaroons['charmstore'];
    }

    set charmstore(token) {
      return this.macaroons['charmstore']
    }

    get controller() {
      return this.macaroons['controller'];
    }

    set controller(token) {
      return this.macaroons['controller']
    }
  };

}, '0.1.0', { requires: []});
