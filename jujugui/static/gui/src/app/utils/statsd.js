/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

if (typeof this.jujugui === 'undefined') {
  this.jujugui = {};
}

/**
  A statsd client used to send application metrics.
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

this.jujugui.StatsClient = StatsClient;
