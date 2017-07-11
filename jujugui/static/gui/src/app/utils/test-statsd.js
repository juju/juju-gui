/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('StatsClient', () => {
  let mockXHR;

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
    const client = new window.jujugui.StatsClient(url);
    client.increase('foo');
    assertXHRSent(url, 'foo:1|c');
  });

  it('adds the trailing slash to the URL', () => {
    const client = new window.jujugui.StatsClient('https://example.com');
    client.increase('bar');
    assertXHRSent('https://example.com/', 'bar:1|c');
  });

  it('increases a counter by more than one', () => {
    const url = 'https://example.com/stats/';
    const client = new window.jujugui.StatsClient(url);
    client.increase('my-key', 42);
    assertXHRSent(url, 'my-key:42|c');
  });

  it('can include a prefix', () => {
    const url = 'https://example.com/stats/';
    const client = new window.jujugui.StatsClient(url, 'gui');
    client.increase('awesome');
    assertXHRSent(url, 'gui.awesome:1|c');
  });

  it('can add flags as statsd tags', () => {
    const url = 'https://example.com/stats/';
    const flags = {'test.bar': true, 'baz': true};
    const client = new window.jujugui.StatsClient(url, 'gui', flags);
    const name = client._addFlags('foo');
    assert.equal(name, 'foo,test.bar=true');
  });
});
