/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib terms service', function() {

  var makeXHRRequest = function(obj) {
    return {target: {responseText: JSON.stringify(obj)}};
  };

  it('exists', function() {
    var bakery = {};
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    assert.strictEqual(terms instanceof window.jujulib.terms, true);
    assert.strictEqual(
      terms.url, 'http://1.2.3.4/' + window.jujulib.termsAPIVersion);
  });

  it('is smart enough to handle missing trailing slash in URL', function() {
    var bakery = {};
    var terms = new window.jujulib.terms('http://1.2.3.4', bakery);
    assert.strictEqual(
      terms.url, 'http://1.2.3.4/' + window.jujulib.termsAPIVersion);
  });

  it('shows terms with revision', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.termsAPIVersion +
          '/terms/canonical?revision=42');
        var xhr = makeXHRRequest([{
          name: 'canonical',
          title: 'canonical terms',
          revision: 42,
          'created-on': '2016-06-09T22:07:24Z',
          content: 'Terms and conditions'
        }]);
        success(xhr);
      }
    };
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.showTerms('canonical', 42, function(error, terms) {
      assert.strictEqual(error, null);
      assert.deepEqual(terms, {
        name: 'canonical',
        title: 'canonical terms',
        revision: 42,
        createdAt: new Date(1465510044000),
        content: 'Terms and conditions'
      });
      done();
    });
  });

  it('shows most recent terms', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.termsAPIVersion +
          '/terms/canonical');
        var xhr = makeXHRRequest([{
          name: 'canonical',
          title: 'canonical recent terms',
          revision: 47,
          'created-on': '2016-06-09T22:07:24Z',
          content: 'Terms and conditions'
        }]);
        success(xhr);
      }
    };
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.showTerms('canonical', null, function(error, terms) {
      assert.strictEqual(error, null);
      assert.deepEqual(terms, {
        name: 'canonical',
        title: 'canonical recent terms',
        revision: 47,
        createdAt: new Date(1465510044000),
        content: 'Terms and conditions'
      });
      done();
    });
  });

  it('handles missing terms', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = makeXHRRequest([]);
        success(xhr);
      }
    };
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.showTerms('canonical', null, function(error, terms) {
      assert.strictEqual(error, null);
      assert.strictEqual(terms, null);
      done();
    });
  });

  it('handles errors fetching terms', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = makeXHRRequest({Message: 'bad wolf'});
        failure(xhr);
      }
    };
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.showTerms('canonical', null, function(error, terms) {
      assert.equal(error, 'bad wolf');
      assert.strictEqual(terms, null);
      done();
    });
  });

  it('handles adding an agreement', function(done) {
    var bakery = {
      sendPostRequest: function(path, params, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.termsAPIVersion +
          '/agreement');
        var xhr = makeXHRRequest({agreements: [{
          user: 'spinach',
          term: 'these-terms',
          revision: 42,
          'created-on': '2016-06-09T22:07:24Z'
        }]});
        success(xhr);
      }
    };
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.addAgreement(
      [{name: 'canonical', revision: 5}],
      function(error, terms) {
        assert.equal(error, null);
        assert.deepEqual(terms, [{
          user: 'spinach',
          term: 'these-terms',
          revision: 42,
          createdAt: new Date(1465510044000)
        }]);
        done();
      }
    );
  });

  it('can get agreements for a user', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.termsAPIVersion +
          '/agreements');
        var xhr = makeXHRRequest([{
          user: 'spinach',
          term: 'One fancy term',
          revision: 47,
          'created-on': '2016-06-09T22:07:24Z'
        }]);
        success(xhr);
      }
    };
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.getAgreements(function(error, terms) {
      assert.strictEqual(error, null);
      assert.deepEqual(terms, [{
        user: 'spinach',
        term: 'One fancy term',
        revision: 47,
        createdAt: new Date(1465510044000)
      }]);
      done();
    });
  });

  it('handles missing agreements', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = makeXHRRequest([]);
        success(xhr);
      }
    };
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.getAgreements(function(error, terms) {
      assert.strictEqual(error, null);
      assert.strictEqual(terms, null);
      done();
    });
  });

  it('handles errors fetching agreements', function(done) {
    var bakery = {
      sendGetRequest: function(path, success, failure) {
        var xhr = makeXHRRequest({Message: 'bad wolf'});
        failure(xhr);
      }
    };
    var terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.getAgreements(function(error, terms) {
      assert.equal(error, 'bad wolf');
      assert.strictEqual(terms, null);
      done();
    });
  });

});
