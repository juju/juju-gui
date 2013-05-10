'use strict';

// A global variable required for testing feature flags.
var flags = {};

describe('Namespaced Routing', function() {
  var Y, juju, app;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-routing',
                               'juju-gui'],
    function(Y) {
      juju = Y.namespace('juju');
      done();
    });
  });

  beforeEach(function() {
    app = new juju.App({conn: {close: function() {}}});
    app.showView(new Y.View());
  });

  it('should support basic namespaced urls', function() {
    var router = juju.Router('charmstore');

    var match = router.parse('/');
    assert(match.charmstore === '/');
    assert(match.inspector === undefined);

    match = router.parse('cs:mysql');
    assert(match.charmstore === 'cs:mysql/');
    assert(match.inspector === undefined);

    match = router.parse(
        '/:inspector:/services/mysql/:charmstore:/charms/precise/mediawiki');
    assert(match.charmstore === '/charms/precise/mediawiki/');
    assert(match.inspector === '/services/mysql/');

    match.pairs().should.eql(
        [['charmstore', '/charms/precise/mediawiki/'],
          ['inspector', '/services/mysql/']]);

    match = router.parse(
        '/charms/precise/mediawiki/:inspector:/services/mysql/');
    assert(match.charmstore === '/charms/precise/mediawiki/');
    assert(match.inspector === '/services/mysql/');

    var u = router.url(match);
    assert(u === '/charms/precise/mediawiki/:inspector:/services/mysql/');

    // Root paths have to be explicitly excluded...
    u = router.url({foo: '/'}, {excludeRootPaths: true});
    assert.strictEqual(u, '/');
    u = router.url({foo: '/shazam', bar: '/'}, {excludeRootPaths: true});
    assert.strictEqual(u, '/:foo:/shazam/');

    // ...otherwise they are included by default.
    u = router.url({foo: '/'});
    assert.strictEqual(u, '/:foo:/');
    u = router.url({foo: '/shazam', bar: '/'});
    assert.strictEqual(u, '/:bar:/:foo:/shazam/');

    // Sorted keys.
    u = router.url({charmstore: '/', gamma: 'g', a: 'alpha', b: 'beta'});
    assert(u === '/:a:alpha/:b:beta/:gamma:g/');

    // Sorted keys with actual charmstore [defaultNamespace] component.
    u = router.url({
      charmstore: '/charms/precise/mysql',
      gamma: 'g', a: 'alpha', b: 'beta'});
    assert(u === '/charms/precise/mysql/:a:alpha/:b:beta/:gamma:g/');

    u = router.url({gamma: 'g', a: 'alpha', b: 'beta'});
    assert(u === '/:a:alpha/:b:beta/:gamma:g/');
  });

  it('should support a default namespace', function() {
    var router = juju.Router('charmstore');
    var url, parts;
    router.defaultNamespace.should.equal('charmstore');

    // Use a different namespace.
    router = juju.Router('foo');
    parts = router.parse('/bar');
    url = router.url(parts);
    url.should.equal('/bar/');

    // .. and with an additional ns.
    parts.extra = 'happens';
    url = router.url(parts);
    url.should.equal('/bar/:extra:happens/');
  });

  it('should be able to cleanly combine urls preserving untouched namespaces',
     function() {
       var router = juju.Router('charmstore');
       var url, parts;
       url = router.combine('/foo/bar', '/:inspector:/');
       url.should.equal('/foo/bar/');
       url = router.combine('/foo/bar', '/:inspector:/foo/');
       url.should.equal('/foo/bar/:inspector:/foo/');
     });

  it('should be able to split qualified urls', function() {
    var router = juju.Router('playground');
    var url, parts;

    parts = router.split('http://foo.bar:8888/foo/bar');
    parts.pathname.should.equal('/foo/bar');
    parts.origin.should.equal('http://foo.bar:8888');

    parts = router.split('http://foo.bar:8888/foo/bar/?a=b');
    parts.pathname.should.equal('/foo/bar/');
    parts.origin.should.equal('http://foo.bar:8888');
    parts.search.should.equal('a=b');

    parts = router.split('/foo/bar/?a=b');
    parts.pathname.should.equal('/foo/bar/');
    parts.search.should.equal('a=b');
  });

  it('should allow overriding namespaces', function() {
    var result;
    var oldGetLocation = Y.getLocation;
    app._queue = function(url) {
      result = url;
    };
    Y.getLocation = function() {
      return { pathname: '/:foo:/bar/' };
    };
    app._navigate('/:bar:/baz/', {});
    result.should.equal('/:bar:/baz/:foo:/bar/');
    app._navigate('/', { overrideAllNamespaces: true });
    result.should.equal('/');
    Y.getLocation = oldGetLocation;
  });

  it('should allow a feature flags namespace', function() {
    assert.deepEqual({}, flags);
    // Use the route callback directly.
    app.featureFlags({path: '/foo/bar=baz/'}, undefined, function() {});
    assert.deepEqual({foo: true, bar: 'baz'}, flags);
    app.featureFlags({path: '/foo/bar=baz=bar/'}, undefined, function() {});
    assert.deepEqual({foo: true, bar: 'baz=bar'}, flags);
    app.featureFlags({path: '/foo/'}, undefined, function() {});
    assert.deepEqual({foo: true}, flags);
  });

});
