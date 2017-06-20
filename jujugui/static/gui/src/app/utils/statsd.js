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

/**
  A statsd client used to send application metrics.
*/

YUI.add('statsd', function(Y) {

  const module = Y.namespace('juju.statsd');

  /**
    A client for sending statsd metrics.
  */
  const StatsClient = class StatsClient {

    /**
      Create the statsd client.

      @param {String} url The URL of the statsd endpoint where to send metrics.
      @param {String} prefix The stats prefix for all calls.
    */
    constructor(url, prefix='') {
      this.url = url.replace(/\/?$/, '/');
      this._prefix = prefix;
    }

    /**
      Increase the counter with the given name.

      @param {String} name The stats name.
      @param {Integer} count The increment amount.
    */
    increase(name, count=1) {
      this._send(`${name}:${count}|c`);
    }

    /**
      Send the given data to the statsd endpoint.

      @param {String} data The non prefixed data to send.
    */
    _send(data) {
      if (this._prefix) {
        data = `${this._prefix}.${data}`;
      }
      const xhr = new XMLHttpRequest({});
      xhr.addEventListener('error', evt => {
        console.error(`cannot send statsd data "${data}":`, evt);
      });
      xhr.addEventListener('load', evt => {
        console.debug(`statsd data "${data}" correctly sent`);
      });
      xhr.open('POST', this.url);
      xhr.send(data);
    }

  };

  module.StatsClient = StatsClient;

}, '0.1.0', {requires: []});
