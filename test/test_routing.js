
'use strict';

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
    app = new juju.App();
  });

  it('should support basic namespaced urls', function() {
    var router = juju.Router('charmstore');

    var match = router.parse('/');
    assert(match.charmstore === '/');
    assert(match.inspector === undefined);

    match = router.parse('cs:mysql');
    assert(match.charmstore === 'cs:mysql');
    assert(match.inspector === undefined);

    match = router.parse(
        '/:inspector:/services/mysql/:charmstore:/charms/precise/mediawiki');
    assert(match.charmstore === '/charms/precise/mediawiki');
    assert(match.inspector === '/services/mysql');

    match.pairs().should.eql(
        [['charmstore', '/charms/precise/mediawiki'],
          ['inspector', '/services/mysql']]);

    match = router.parse(
        '/charms/precise/mediawiki/:inspector:/services/mysql/');
    assert(match.charmstore === '/charms/precise/mediawiki');
    assert(match.inspector === '/services/mysql');

    var u = router.url(match);
    assert(u === '/charms/precise/mediawiki/:inspector:/services/mysql/');

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


  it('should parse and route namedspaced urls');


  it('should trigger middleware only once per dispatch');

});
