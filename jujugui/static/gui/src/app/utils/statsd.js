/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  A statsd client used to send application metrics.
*/
class StatsClient {

  /**
    Create the statsd client.

    @param {String} url The URL of the statsd endpoint where to send metrics.
    @param {String} prefix The stats prefix for all calls.
  */
  constructor(url, prefix='', flags={}) {
    this.url = url.replace(/\/?$/, '/');
    this._flags = flags || {};
    this._prefix = prefix;
  }

  /**
   Adds the active ab test flags to the stat name.

   @param {String} name The stats name.
   @returns {String} The name with active test flags added as statsd tags.
   */
  _addFlags(name) {
    const flags = Object.keys(this._flags).filter(
      key => this._flags[key] && key.indexOf('test') === 0);
    if (!flags.length) {
      return name;
    }
    flags.sort();
    const flagStr = flags.map(val => `${val}=true`).join(',');
    return `${name},${flagStr}`;
  }

  /**
    Increase the counter with the given name.

    @param {String} name The stats name.
    @param {Integer} count The increment amount.
  */
  increase(name, count=1) {
    name = this._addFlags(name);
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

module.exports = StatsClient;
