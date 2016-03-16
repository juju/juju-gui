/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib environment manager', function() {
  var env;

  var _makeXHRRequest = function(obj) {
    return {target: {responseText: JSON.stringify(obj)}};
  };

  afterEach(function () {
    env = null;
  });

  it('exists', function() {
    var bakery = {};
    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    assert.isTrue(env instanceof window.jujulib.environment);
  });

  it('lists environments', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = _makeXHRRequest({environments: ["foo"]});
        success(xhr);
      }
    };
    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.listEnvironments(function(error, data) {
      if (error) {
        assert.fail('error found when there should not be one.');
      }
      assert.deepEqual(data, ['foo']);
      done();
    });
  });

  it('handles errors listing environments', function(done) {
    var err = 'bad wolf';
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = _makeXHRRequest({Message: err});
        failure(xhr);
      }
    };
    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.listEnvironments(function(error, data) {
      if (error) {
        assert.equal(error, err);
      } else {
        assert.fail('callback should have failed.');
      }
      done();
    });
  });

  it('lists servers', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = _makeXHRRequest({"state-servers": ["foo"]});
        success(xhr);
      }
    };
    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.listServers(function(error, data) {
      if (error) {
        assert.fail('error found when there should not be one.');
      }
      assert.deepEqual(data, ['foo']);
      done();
    });
  });

  it('handles errors listing servers', function(done) {
    var err = 'bad wolf';
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = _makeXHRRequest({Message: err});
        failure(xhr);
      }
    };
    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.listServers(function(error, data) {
      if (error) {
        assert.equal(error, err);
      } else {
        assert.fail('callback should have failed.');
      }
      done();
    });
  });

  it('gets environment data', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(path, 'http://example.com/v1/env/rose/fnord')
        var xhr = _makeXHRRequest({uuid: "foo"});
        success(xhr);
      }
    };
    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.getEnvironment('rose', 'fnord', function(error, data) {
      if (error) {
        assert.fail('error found when there should not be one.');
      }
      assert.deepEqual(data, {uuid: 'foo'});
      done();
    });
  });

  it('handles errors getting environment data', function(done) {
    var err = 'bad wolf';
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(path, 'http://example.com/v1/env/rose/fnord')
        var xhr = _makeXHRRequest({Message: err});
        failure(xhr);
      }
    };
    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.getEnvironment('rose', 'fnord', function(error, data) {
      if (error) {
        assert.equal(error, err);
      } else {
        assert.fail('callback should have failed');
      }
      done();
    });
  });

  it('can create a new environment', function(done) {
    var bakery = {
      sendPostRequest: function(path, data, success, failure) {
        assert.equal(path, 'http://example.com/v1/env/rose');
        assert.deepEqual(
          JSON.parse(data), {
            'state-server': 'foo',
            password: 'password',
            name: 'fnord',
            templates: ['rose/template']
          });
        var xhr = _makeXHRRequest({});
        success(xhr);
      }
    };

    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.newEnvironment('rose', 'fnord', 'rose/template', 'foo', 'password',
      function(error, data) {
        if (error) {
          assert.fail('error found when there should not be one.');
        }
        done();
      }
    );
  });

  it('handles errors creating a new environment', function(done) {
    var err = 'bad wolf';
    var bakery = {
      sendPostRequest: function(path, data, success, failure) {
        assert.equal(path, 'http://example.com/v1/env/rose');
        var xhr = _makeXHRRequest({Message: err});
        failure(xhr);
      },
    };

    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.newEnvironment('rose', 'fnord', 'rose/template', 'foo', 'password',
      function(error, data) {
        if (error) {
          assert.equal(error, err)
        } else {
          assert.fail('callback should have failed');
        }
        done();
      }
    );
  });

  it('identifies the current user', function(done) {
    var currentUser = {user: 'test'};
    var bakery = {
      sendGetRequest: function(path, success, failure, redirect) {
        assert.equal(path, 'http://example.com/v1/whoami');
        // Make sure that we have disabled redirect on 401
        assert.strictEqual(redirect, false);
        var xhr = _makeXHRRequest(currentUser);
        success(xhr);
      },
    };

    env = new window.jujulib.environment('http://example.com', 'v1', bakery);
    env.whoami(
      function(error, data) {
        if (error) {
          assert.fail('callback should be successful');
        } else {
          assert.deepEqual(data, currentUser);
        }
        done();
      }
    );
  });
});
