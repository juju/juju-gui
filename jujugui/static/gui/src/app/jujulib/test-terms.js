/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib terms service', function() {
  let cleanups = [];

  const makeXHRRequest = function(obj) {
    return {target: {responseText: JSON.stringify(obj)}};
  };

  afterEach(function() {
    cleanups.forEach(cleanup => {
      cleanup();
    });
  });

  it('exists', function() {
    const bakery = {};
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    assert.strictEqual(terms instanceof window.jujulib.terms, true);
    assert.strictEqual(
      terms.url, 'http://1.2.3.4/' + window.jujulib.termsAPIVersion);
  });

  it('is smart enough to handle missing trailing slash in URL', function() {
    const bakery = {};
    const terms = new window.jujulib.terms('http://1.2.3.4', bakery);
    assert.strictEqual(
      terms.url, 'http://1.2.3.4/' + window.jujulib.termsAPIVersion);
  });

  it('shows terms with revision', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          window.jujulib.termsAPIVersion +
          '/terms/canonical?revision=42');
        const xhr = makeXHRRequest([{
          name: 'canonical',
          owner: 'spinach',
          title: 'canonical terms',
          revision: 42,
          'created-on': '2016-06-09T22:07:24Z',
          content: 'Terms and conditions'
        }]);
        callback(null, xhr);
      }
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.showTerms('canonical', 42, function(error, terms) {
      assert.strictEqual(error, null);
      assert.deepEqual(terms, {
        name: 'canonical',
        owner: 'spinach',
        title: 'canonical terms',
        revision: 42,
        createdAt: new Date(1465510044000),
        content: 'Terms and conditions'
      });
      done();
    });
  });

  it('shows most recent terms', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          window.jujulib.termsAPIVersion +
          '/terms/canonical');
        const xhr = makeXHRRequest([{
          name: 'canonical',
          owner: 'spinach',
          title: 'canonical recent terms',
          revision: 47,
          'created-on': '2016-06-09T22:07:24Z',
          content: 'Terms and conditions'
        }]);
        callback(null, xhr);
      }
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.showTerms('canonical', null, function(error, terms) {
      assert.strictEqual(error, null);
      assert.deepEqual(terms, {
        name: 'canonical',
        owner: 'spinach',
        title: 'canonical recent terms',
        revision: 47,
        createdAt: new Date(1465510044000),
        content: 'Terms and conditions'
      });
      done();
    });
  });

  it('handles missing terms', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest([]);
        callback(null, xhr);
      }
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.showTerms('canonical', null, function(error, terms) {
      assert.strictEqual(error, null);
      assert.strictEqual(terms, null);
      done();
    });
  });

  it('handles errors fetching terms', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({error: 'bad wolf'});
        callback(null, xhr);
      }
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.showTerms('canonical', null, function(error, terms) {
      assert.equal(error, 'bad wolf');
      assert.strictEqual(terms, null);
      done();
    });
  });

  it('handles adding an agreement', function(done) {
    const bakery = {
      post: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          window.jujulib.termsAPIVersion +
          '/agreement');
        const xhr = makeXHRRequest({agreements: [{
          user: 'spinach',
          term: 'these-terms',
          revision: 42,
          'created-on': '2016-06-09T22:07:24Z'
        }]});
        callback(null, xhr);
      }
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.addAgreement(
      [{name: 'canonical', revision: 5}],
      function(error, terms) {
        assert.equal(error, null);
        assert.deepEqual(terms, [{
          owner: null,
          user: 'spinach',
          term: 'these-terms',
          revision: 42,
          createdAt: new Date(1465510044000),
          name: undefined,
          owner: undefined,
          content: undefined
        }]);
        done();
      }
    );
  });

  it('passes the agreements request the correct args', function() {
    const bakery = {
      post: sinon.stub()
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.addAgreement([{name: 'canonical', owner: 'spinach', revision: 5}]);
    assert.equal(bakery.post.callCount, 1);
    assert.equal(
      bakery.post.args[0][2],
      '[{"termname":"canonical","termrevision":5,"termowner":"spinach"}]');
  });

  it('can get agreements for a user', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          window.jujulib.termsAPIVersion +
          '/agreements');
        const xhr = makeXHRRequest([{
          user: 'spinach',
          term: 'One fancy term',
          revision: 47,
          'created-on': '2016-06-09T22:07:24Z'
        }]);
        callback(null, xhr);
      }
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.getAgreements(function(error, terms) {
      assert.strictEqual(error, null);
      assert.deepEqual(terms, [{
        owner: undefined,
        user: 'spinach',
        term: 'One fancy term',
        revision: 47,
        createdAt: new Date(1465510044000),
        name: undefined,
        owner: undefined,
        content: undefined
      }]);
      done();
    });
  });

  it('handles missing agreements', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        var xhr = makeXHRRequest([]);
        callback(null, xhr);
      }
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.getAgreements(function(error, terms) {
      assert.strictEqual(error, null);
      assert.strictEqual(terms, null);
      done();
    });
  });

  it('handles errors fetching agreements', function(done) {
    const bakery = {
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({Message: 'bad wolf'});
        callback(null, xhr);
      }
    };
    const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
    terms.getAgreements(function(error, terms) {
      assert.equal(error, 'bad wolf');
      assert.strictEqual(terms, null);
      done();
    });
  });

  describe('getAgreementsByTerms', () => {
    it('makes a proper request with a single term supplied', done => {
      const bakery = {
        get: (url, headers, callback) => {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.termsAPIVersion +
            '/agreement?Terms=hatch/test-term1');
          callback(null, makeXHRRequest([{
            'created-on': '2016-06-09T22:07:24Z',
            content: 'I am term1\n',
            id: 'hatch/test-term1',
            name: 'test-term1',
            owner: 'hatch',
            published: true,
            revision: 2
          }]));
        }
      };
      const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
      terms.getAgreementsByTerms(['hatch/test-term1'], (error, terms) => {
        assert.strictEqual(error, null);
        assert.deepEqual(terms, [{
          content: 'I am term1\n',
          createdAt: new Date(1465510044000),
          name: 'test-term1',
          owner: 'hatch',
          revision: 2,
          term: undefined,
          user: undefined
        }]);
        done();
      });
    });

    it('makes a proper request with multiple terms supplied', done => {
      const bakery = {
        get: (url, headers, callback) => {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.termsAPIVersion +
            '/agreement?Terms=hatch/test-term1&Terms=hatch/test-term2');
          callback(null, makeXHRRequest([{
            'created-on': '2016-06-09T22:07:24Z',
            content: 'I am term1\n',
            name: 'test-term1',
            owner: 'hatch',
            published: true,
            revision: 2
          }]));
        }
      };
      const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
      terms.getAgreementsByTerms([
        'hatch/test-term1', 'hatch/test-term2'
      ], (error, terms) => {
        assert.strictEqual(error, null);
        assert.deepEqual(terms, [{
          content: 'I am term1\n',
          createdAt: new Date(1465510044000),
          name: 'test-term1',
          owner: 'hatch',
          revision: 2,
          term: undefined,
          user: undefined
        }]);
        done();
      });
    });

    it('handles failures fetching agreements', done => {
      const bakery = {
        get: (url, headers, callback) => {
          callback(null, makeXHRRequest({Message: 'it broke'}));
        }
      };
      const terms = new window.jujulib.terms('http://1.2.3.4/', bakery);
      terms.getAgreementsByTerms(['user/termname'], (error, terms) => {
        assert.equal(error, 'it broke');
        assert.strictEqual(terms, null);
        done();
      });
    });
  });

});
