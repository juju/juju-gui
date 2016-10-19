/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib urls', () => {
  const URL = window.jujulib.URL;

  const pathTests = [{
    url: new URL({name: 'django'}),
    path: 'django'
  }, {
    url: new URL({name: 'django', user: 'who'}),
    path: 'u/who/django'
  }, {
    url: new URL({name: 'django', user: 'dalek', series: 'xenial'}),
    path: 'u/dalek/django/xenial'
  }, {
    url: new URL({name: 'haproxy', schema: 'local', revision: 47}),
    path: 'haproxy/47'
  }, {
    url: new URL({name: 'haproxy', series: 'xenial'}),
    path: 'haproxy/xenial'
  }, {
    url: new URL({name: 'mediawiki-scalable', revision: 0}),
    path: 'mediawiki-scalable/0'
  }, {
    url: new URL({
      name: 'haproxy',
      user: 'dalek',
      series: 'trusty',
      revision: 42
    }),
    path: 'u/dalek/haproxy/trusty/42'
  }, {
    url: new URL({
      name: 'mediawiki-scalable',
      schema: 'cs',
      user: 'cyberman',
      series: 'bundle',
      revision: 0
    }),
    path: 'u/cyberman/mediawiki-scalable/bundle/0'
  }];
  const legacyPathTests = [{
    url: new URL({name: 'django'}),
    path: 'django'
  }, {
    url: new URL({name: 'django', user: 'who'}),
    path: '~who/django'
  }, {
    url: new URL({name: 'django', user: 'dalek', series: 'xenial'}),
    path: '~dalek/xenial/django'
  }, {
    url: new URL({name: 'haproxy', schema: 'local', revision: 47}),
    path: 'haproxy-47'
  }, {
    url: new URL({name: 'haproxy', series: 'xenial'}),
    path: 'xenial/haproxy'
  }, {
    url: new URL({name: 'mediawiki-scalable', revision: 0}),
    path: 'mediawiki-scalable-0'
  }, {
    url: new URL({
      name: 'haproxy',
      user: 'dalek',
      series: 'trusty',
      revision: 42
    }),
    path: '~dalek/trusty/haproxy-42'
  }, {
    url: new URL({
      name: 'mediawiki-scalable',
      schema: 'cs',
      user: 'cyberman',
      series: 'bundle',
      revision: 0
    }),
    path: '~cyberman/bundle/mediawiki-scalable-0'
  }];

  // Check that the given URL has the attributes included in parts.
  const assertURL = (url, parts, about) => {
    const prefix = about ? `${about}: ` : '';
    assert.strictEqual(url.name, parts.name, prefix+'name');
    assert.strictEqual(url.schema, parts.schema || 'cs', prefix+'schema');
    assert.strictEqual(url.user, parts.user || '', prefix+'user');
    assert.strictEqual(url.series, parts.series || '', prefix+'series');
    let revision = parts.revision;
    if (!revision && revision !== 0) {
      revision = null;
    }
    assert.strictEqual(url.revision, revision, prefix+'revision');
  };

  describe('initializer', () => {
    it('returns a URL from its parts', () => {
      const url = new URL({name: 'django'});
      assertURL(url, {name: 'django'});
    });

    it('returns a URL from its parts (all parts defined)', () => {
      const parts = {
        name: 'haproxy',
        schema: 'cs',
        user: 'dalek',
        series: 'xenial',
        revision: 42
      };
      const url = new URL(parts);
      assertURL(url, parts);
    });

    it('fails for validation problems', () => {
      const tests = [{
        parts: {},
        err: 'charm/bundle name required but not provided'
      }, {
        parts: {name: 42},
        err: 'charm/bundle name is not a string: "42"'
      }, {
        parts: {name: '2'},
        err: 'invalid charm/bundle name: "2"'
      }, {
        parts: {name: 'django', schema: 47},
        err: 'schema is not a string: "47"'
      }, {
        parts: {name: 'django', schema: 'exterminate'},
        err: 'unrecognized schema: "exterminate"'
      }, {
        parts: {name: 'django', user: {}},
        err: 'user is not a string: "[object Object]"'
      }, {
        parts: {name: 'django', user: '@'},
        err: 'invalid user: "@"'
      }, {
        parts: {name: 'django', series: 'bad-wolf'},
        err: 'invalid series: "bad-wolf"'
      }, {
        parts: {name: 'django', revision: 'bad-wolf'},
        err: 'invalid revision: "bad-wolf"'
      }, {
        parts: {name: 'django', revision: -1},
        err: 'revision is not a positive number: "-1"'
      }];
      tests.forEach(test => {
        assert.throws(() => new URL(test.parts), test.err);
      });
    });
  });

  describe('prototype', () => {
    it('returns the URL path', () => {
      pathTests.forEach(test => {
        assert.strictEqual(test.url.path(), test.path);
      });
    });

    it('returns the URL legacy path', () => {
      legacyPathTests.forEach(test => {
        assert.strictEqual(test.url.legacyPath(), test.path);
      });
    });

    it('returns the URL as a string', () => {
      pathTests.forEach(test => {
        assert.strictEqual(
          test.url.toString(), `${test.url.schema}:${test.path}`);
      });
    });

    it('returns the legacy URL as a string', () => {
      legacyPathTests.forEach(test => {
        assert.strictEqual(
          test.url.toLegacyString(), `${test.url.schema}:${test.path}`);
      });
    });

    it('copies a URL', () => {
      const url = new URL({
        name: 'haproxy',
        schema: 'cs',
        user: 'dalek',
        series: 'xenial',
        revision: 42
      });
      const urlCopy = url.copy();
      // Initially the two URLs are equal.
      assert.deepEqual(urlCopy, url, 'initial');
      urlCopy.name = 'apache';
      urlCopy.revision = 47;
      // After changing attributes on the copied URL, the two are not equal
      // anymore.
      assert.notDeepEqual(urlCopy, url, 'after change');
      // The original URL has not been changed.
      assert.strictEqual(url.name, 'haproxy', 'name');
      assert.strictEqual(url.revision, 42, 'revision');
    });

    it('checks whether a URL refers to a bundle', () => {
      const url = new URL({name: 'django', series: 'bundle'});
      assert.strictEqual(url.isBundle(), true, 'bundle');
      url.series = 'xenial';
      assert.strictEqual(url.isBundle(), false, 'xenial');
      url.series = '';
      assert.strictEqual(url.isBundle(), false, 'empty');
    });

    it('checks whether a URL refers to a local charm or bundle', () => {
      const url = new URL({name: 'django'});
      assert.strictEqual(url.isLocal(), false, 'empty');
      url.schema = 'cs';
      assert.strictEqual(url.isLocal(), false, 'cs');
      url.schema = 'local';
      assert.strictEqual(url.isLocal(), true, 'local');
    });
  });

  describe('fromString', () => {
    it('creates the URL from a string', () => {
      pathTests.forEach(test => {
        let str = test.url.toString();
        let url = URL.fromString(str);
        assertURL(url, test.url, str);
        if (!test.url.isLocal()) {
          // Non-local charms strings can be parsed even if they don't
          // explicitly include the schema.
          str = test.url.path();
          url = URL.fromString(str);
          assertURL(url, test.url, str);
          // Leading slashes are also handled in this case.
          str = '/' + str;
          url = URL.fromString(str);
          assertURL(url, test.url, str);
        }
      });
    });

    it('raises errors if the string is not a valid URL', () => {
      const tests = [{
        str: '',
        err: 'invalid URL: ""'
      }, {
        str: 42,
        err: 'invalid URL: "42"'
      }, {
        str: '2',
        err: 'invalid charm/bundle name: "2"'
      }, {
        str: 'bad:django',
        err: 'unrecognized schema: "bad"'
      }, {
        str: '/u/{}/django',
        err: 'invalid user: "{}"'
      }, {
        str: 'u/who',
        err: 'charm/bundle name required but not provided'
      }, {
        str: 'cs:u/who/#',
        err: 'invalid charm/bundle name: "#"'
      }, {
        str: 'local:django:bad',
        err: 'invalid charm/bundle name: "django:bad"'
      }, {
        str: 'haproxy^bad',
        err: 'invalid charm/bundle name: "haproxy^bad"'
      }, {
        str: 'u/my#user/wordpress',
        err: 'invalid user: "my#user"'
      }, {
        str: '/u/dalek/django/xenial/42/bad-wolf',
        err: 'URL includes too many parts: u/dalek/django/xenial/42/bad-wolf'
      }, {
        str: 'django/bundle/0/1',
        err: 'URL includes too many parts: django/bundle/0/1'
      }, {
        str: '/django bundle',
        err: 'URL contains spaces: "/django bundle"'
      }, {
        str: '/django/u/who',
        err: 'invalid series: "u"'
      }, {
        str: 'django/bad-wolf',
        err: 'invalid series: "bad-wolf"'
      }, {
        str: 'django/bundle/bad-wolf',
        err: 'invalid revision: "bad-wolf"'
      }, {
        str: 'haproxy/xenial/-1',
        err: 'revision is not a positive number: "-1"'
      }];
      tests.forEach(test => {
        assert.throws(() => URL.fromString(test.str), test.err);
      });
    });
  });

  describe('fromLegacyString', () => {
    it('creates the URL from a legacy string', () => {
      legacyPathTests.forEach(test => {
        // TODO frankban: implement URL.fromLegacyString.
        // let str = test.url.toLegacyString();
        // let url = URL.fromLegacyString(str);
        // assertURL(url, test.url, str);
        if (!test.url.isLocal()) {
          // Non-local charms strings can be parsed even if they don't
          // explicitly include the schema.
          // TODO frankban: implement URL.fromLegacyString.
          // str = test.url.legacyPath();
          // url = URL.fromLegacyString(str);
          // assertURL(url, test.url, str);
        }
      });
    });

    it('raises errors if the legacy string is not a valid URL', () => {
      const tests = [{
        str: '',
        err: 'invalid URL: ""'
      }, {
        str: 42,
        err: 'invalid URL: "42"'
      }, {
        str: '2',
        err: 'invalid charm/bundle name: "2"'
      }, {
        str: 'bad:django',
        err: 'unrecognized schema: "bad"'
      }, {
        str: '~{}/django',
        err: 'invalid user: "{}"'
      }, {
        str: '~who',
        err: 'charm/bundle name required but not provided'
      }, {
        str: 'cs:~who/#',
        err: 'invalid charm/bundle name: "#"'
      }, {
        str: 'local:django:bad',
        err: 'invalid charm/bundle name: "django:bad"'
      }, {
        str: 'haproxy^bad',
        err: 'invalid charm/bundle name: "haproxy^bad"'
      }, {
        str: '~my#user/wordpress',
        err: 'invalid user: "my#user"'
      }, {
        str: '~dalek/xenial/django-42/bad-wolf',
        err: 'URL includes too many parts: u/dalek/django/xenial/42/bad-wolf'
      }, {
        str: 'bundle/django-0/1',
        err: 'URL includes too many parts: django/bundle/0/1'
      }, {
        str: 'bundle django',
        err: 'URL contains spaces: "/django bundle"'
      }, {
        str: '/django/~who',
        err: 'invalid series: "u"'
      }, {
        str: 'django-2-bad-wolf',
        err: 'invalid series: "bad-wolf"'
      }, {
        str: 'xenial/haproxy--1',
        err: 'revision is not a positive number: "-1"'
      }];
      tests.forEach(test => {
        // TODO frankban: implement URL.fromLegacyString.
        // assert.throws(() => URL.fromLegacyString(test.str), test.err);
      });
    });
  });

});
