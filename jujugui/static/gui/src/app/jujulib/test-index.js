/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib utility functions', function() {
  describe('_makeRequest', function() {
    var bakery;

    beforeEach(function() {
      bakery = {};
      bakery.sendGetRequest = sinon.stub();
      bakery.sendPostRequest = sinon.stub();
      bakery.sendPutRequest = sinon.stub();
      bakery.sendPatchRequest = sinon.stub();
      bakery.sendDeleteRequest = sinon.stub();
    });

    it('handles error strings', function() {
      var error = 'test error';
      bakery.sendGetRequest.callsArgWith(2, error);
      var callback = sinon.stub();
      window.jujulib._makeRequest(bakery, '', 'GET', {}, callback, false, '');
      assert.equal(callback.args[0][0], error);
    });

    it('handles XHR error objects', function() {
      var error = 'test error';
      var json = `{"error": "${error}"}`;
      var xhr = {target: {responseText: json}};
      bakery.sendGetRequest.callsArgWith(2, xhr);
      var callback = sinon.stub();
      window.jujulib._makeRequest(bakery, '', 'GET', {}, callback, false, '');
      assert.equal(callback.args[0][0], error);
    });
  });
});
