/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib bundleservice', function() {
  describe('getBundleChangesFromYAML', function() {
    let bundleService,
        sendPostRequest;

    beforeEach(() => {
      sendPostRequest = sinon.stub();
      bundleService = new window.jujulib.bundleservice(
        'http://you-are-el/', {sendPostRequest: sendPostRequest});
    });

    it('makes a post request for the bundle changes', () => {
      const callback = sinon.stub();
      bundleService.getBundleChangesFromYAML('yaml', callback);
      const args = sendPostRequest.args[0];
      assert.equal(args[0], 'http://you-are-el/bundlechanges/fromYAML');
      assert.deepEqual(args[1], {'Content-type': 'application/json'});
      assert.equal(args[2], '{"bundle":"yaml"}');
      assert.strictEqual(args[3], null);
      assert.strictEqual(args[4], null);
      assert.strictEqual(args[5], false);
      assert.strictEqual(args[6], null);
      assert.equal(typeof args[7], 'function');
      // Call the handler
      args[7]({
        currentTarget: {
          response: '{"changes": "changes"}'
        }
      });
      assert.deepEqual(callback.args[0], [null, 'changes']);
    });

    it('calls the callback with an error on bad response', () => {
      const callback = sinon.stub();
      bundleService.getBundleChangesFromYAML('yaml', callback);
      const args = sendPostRequest.args[0];
      assert.equal(args[0], 'http://you-are-el/bundlechanges/fromYAML');
      assert.deepEqual(args[1], {'Content-type': 'application/json'});
      assert.equal(args[2], '{"bundle":"yaml"}');
      assert.strictEqual(args[3], null);
      assert.strictEqual(args[4], null);
      assert.strictEqual(args[5], false);
      assert.strictEqual(args[6], null);
      assert.equal(typeof args[7], 'function');
      // Call the handler
      args[7]({
        currentTarget: {
          response: 'not json'
        }
      });
      assert.deepEqual(
        callback.args[0],
        ['Unable to parse response data for bundle yaml', undefined]);
    });

  });
});
