/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const utils = require('./utils');

describe('init utils', () => {
  describe('createSocketURL', () => {
    it('honors socket_protocol and uuid', () => {
      const expected = [
        'ws://',
        window.location.hostname,
        ':',
        window.location.port,
        '/juju/api/example.com/17070/1234-1234'
      ].join('');
      const url = utils.createSocketURL({
        apiAddress: 'http://api.example.com/',
        template: '/juju/api/$server/$port/$uuid',
        protocol: 'ws',
        uuid: '1234-1234',
        server: 'example.com',
        port: '17070'
      });
      assert.strictEqual(url, expected);
    });

    it('honors a fully qualified provided socket URL', () => {
      const url = utils.createSocketURL({
        apiAddress: 'http://api.example.com/',
        template: 'wss://my.$server:$port/model/$uuid/api',
        protocol: 'ws',
        uuid: '1234-1234',
        server: 'example.com',
        port: '17070'
      });
      assert.equal(url, 'wss://my.example.com:17070/model/1234-1234/api');
    });
  });
});
