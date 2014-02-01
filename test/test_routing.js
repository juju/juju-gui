/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

describe('Namespaced Routing', function() {
  var Y, juju, app;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-gui'], function(Y) {
      juju = Y.namespace('juju');
      done();
    });
  });

  beforeEach(function() {
    app = new juju.App({conn: {close: function() {}}});
    app.showView(new Y.View());
  });

  afterEach(function() {
    app.destroy();
  });

  it('should support basic namespaced urls', function() {
    var router = juju.Router('charmbrowser');

    var match = router.parse('/');
    assert(match.charmbrowser === '/');
    assert(match.inspector === undefined);

    match = router.parse('cs:mysql');
    assert(match.charmbrowser === 'cs:mysql/');
    assert(match.inspector === undefined);

    match = router.parse(
        '/:inspector:/services/mysql/:charmbrowser:/charms/precise/mediawiki');
    assert(match.charmbrowser === '/charms/precise/mediawiki/');
    assert(match.inspector === '/services/mysql/');

    match.pairs().should.eql(
        [['charmbrowser', '/charms/precise/mediawiki/'],
          ['inspector', '/services/mysql/']]);

    match = router.parse(
        '/charms/precise/mediawiki/:inspector:/services/mysql/');
    assert(match.charmbrowser === '/charms/precise/mediawiki/');
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
    u = router.url({charmbrowser: '/', gamma: 'g', a: 'alpha', b: 'beta'});
    assert(u === '/:a:alpha/:b:beta/:gamma:g/');

    // Sorted keys with actual charmbrowser [defaultNamespace] component.
    u = router.url({
      charmbrowser: '/charms/precise/mysql',
      gamma: 'g', a: 'alpha', b: 'beta'});
    assert(u === '/charms/precise/mysql/:a:alpha/:b:beta/:gamma:g/');

    u = router.url({gamma: 'g', a: 'alpha', b: 'beta'});
    assert(u === '/:a:alpha/:b:beta/:gamma:g/');
  });

  it('should support hashes and query strings', function() {
    var router = juju.Router('test');
    var parts;
    parts = router.parse(
        '/foo/#bar=foo$baz-bax$foo-bar=baz?baz=something+else&battery=acid');
    assert.equal(parts.hash, 'bar=foo$baz-bax$foo-bar=baz');
    assert.equal(parts.search, 'baz=something+else&battery=acid');
    assert.equal(parts.test, '/foo/');
  });

  it('should support a default namespace', function() {
    var router = juju.Router('charmbrowser');
    var url, parts;
    router.defaultNamespace.should.equal('charmbrowser');

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
       var router = juju.Router('charmbrowser');
       var url, parts;
       url = router.combine('/foo/bar', '/:inspector:/');
       url.should.equal('/foo/bar/');
       url = router.combine('/foo/bar', '/:inspector:/foo/');
       url.should.equal('/foo/bar/:inspector:/foo/');

       // Hash and querystrings come from the second (incoming)
       // argument to combine, values from the original url
       // are discarded.
       url = router.combine('/foo/bar?world=gone+away',
                            '/:inspector:/foo/?world=beater#hello');
       url.should.equal('/foo/bar/:inspector:/foo/?world=beater#hello');
     });

  it('should be able to split qualified urls', function() {
    var router = juju.Router('playground');
    var parts;

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

  it('should allow combining routes using router level flagging', function() {
    var router = juju.Router('charmbrowser', {gui: true});
    var match = router.parse('/');
    assert(match.charmbrowser === '/');
    assert(match.inspector === undefined);

    match = router.parse('/:gui:/services/mysql/:gui:/services/mediawiki/');
    assert.deepEqual(match.gui, [
      '/services/mysql/',
      '/services/mediawiki/'
    ]);

    // We can use the match to produce a valid url.
    var u = router.url(match);
    assert.equal(u, '/:gui:/services/mysql/:gui:/services/mediawiki/');


    // Combine works as well (note the flag, like with parse this can be an
    // object).
    u = router.combine('/:gui:/services/mysql/', ':gui:/services/mediawiki/');
    assert.equal(u, '/:gui:/services/mysql/:gui:/services/mediawiki/');
  });

  it('should allow combining routes in a given namespace', function() {
    var router = juju.Router('charmbrowser');
    var match = router.parse('/');
    assert(match.charmbrowser === '/');
    assert(match.inspector === undefined);

    // Multiple routes (no combine)
    match = router.parse(
        '/:gui:/services/mysql/:gui:/services/mediawiki/');
    // A single match, last write wins.
    assert.equal(match.gui, '/services/mediawiki/');

    match = router.parse(
        '/:gui:/services/mysql/:gui:/services/mediawiki/',
        {gui: true});
    assert.deepEqual(match.gui, [
      '/services/mysql/',
      '/services/mediawiki/'
    ]);

    // We can use the match to produce a valid url.
    var u = router.url(match);
    assert.equal(u, '/:gui:/services/mysql/:gui:/services/mediawiki/');

    // Combine works as well (note the flag, like with parse this can be an
    // object).
    u = router.combine('/:gui:/services/mysql/', ':gui:/services/mediawiki/',
                       {gui: true});
    assert.equal(u, '/:gui:/services/mysql/:gui:/services/mediawiki/');

  });

  it('should properly parse the QS of a given url', function() {
    var router = juju.Router('charmbrowser');
    var qs = router.getQS(
        '/minimized/search/precise/jenkins-5/?text=jenkins#readme');
    assert.equal(qs, 'text=jenkins');
  });

  it('should split a url into components properly', function() {
    var router = juju.Router('charmbrowser');
    var components = router.split(
        '/minimized/search/precise/jenkins-5/?text=jenkins#readme');
    assert.equal(
        components.pathname,
        '/minimized/search/precise/jenkins-5/');
    assert.equal(components.hash, 'readme');
    assert.equal(components.search, 'text=jenkins');
  });

});

describe('Juju Gui Routing', function() {
  var Y, juju, app;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-gui'], function(Y) {
      juju = Y.namespace('juju');
      done();
    });

  });

  it('should monkey patch Y.Router with querystring parser', function() {
    var testString = 'category=databases&category=file_servers';
    Y.Router._parseQuery(testString).should.eql(
        {category: ['databases', 'file_servers']});
  });

});
