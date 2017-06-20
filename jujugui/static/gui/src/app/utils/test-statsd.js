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

var juju = {components: {}}; // eslint-disable-line no-unused-vars
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('StatsClient', () => {
  let mockXHR, statsd;

  beforeAll((done) => {
    YUI().use('statsd', Y => {
      statsd = Y.juju.statsd;
      done();
    });
  });

  beforeEach(() => {
    const proto = XMLHttpRequest.prototype;
    mockXHR = {
      addEventListener: sinon.stub(proto, 'addEventListener'),
      open: sinon.stub(proto, 'open'),
      send: sinon.stub(proto, 'send')
    };
  });

  afterEach(() => {
    Object.keys(mockXHR).forEach(key => {
      mockXHR[key].restore();
    });
  });

  // Ensure the XHR request has been sent to the URL with the provided value.
  const assertXHRSent = (url, value) => {
    // Both success and error event listeners are added.
    assert.equal(mockXHR.addEventListener.callCount, 2, 'addEventListener');
    let args = mockXHR.addEventListener.args;
    assert.strictEqual(args[0][0], 'error');
    assert.strictEqual(args[1][0], 'load');
    // The XHR is properly opened.
    assert.equal(mockXHR.open.callCount, 1, 'open');
    args = mockXHR.open.args[0];
    assert.equal(args.length, 2, 'open args');
    assert.strictEqual(args[0], 'POST');
    assert.strictEqual(args[1], url);
    // The data has been correctly sent.
    assert.equal(mockXHR.send.callCount, 1, 'send');
    args = mockXHR.send.args[0];
    assert.equal(args.length, 1, 'send args');
    assert.strictEqual(args[0], value);
  };

  it('increases a counter', () => {
    const url = 'https://example.com/stats/';
    const client = new statsd.StatsClient(url);
    client.increase('foo');
    assertXHRSent(url, 'foo:1|c');
  });

  it('adds the trailing slash to the URL', () => {
    const client = new statsd.StatsClient('https://example.com');
    client.increase('bar');
    assertXHRSent('https://example.com/', 'bar:1|c');
  });

  it('increases a counter more than one', () => {
    const url = 'https://example.com/stats/';
    const client = new statsd.StatsClient(url);
    client.increase('my-key', 42);
    assertXHRSent(url, 'my-key:42|c');
  });

  it('can include a prefix', () => {
    const url = 'https://example.com/stats/';
    const client = new statsd.StatsClient(url, 'gui');
    client.increase('awesome');
    assertXHRSent(url, 'gui.awesome:1|c');
  });
});
