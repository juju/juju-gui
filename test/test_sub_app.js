'use strict';

describe.only('Sub Applications', function() {
  var Y, juju, subapp;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-routing',
                               'juju-gui'],
    function(Y) {
      juju = Y.namespace('juju');
      done();
    });

  });

  beforeEach(function() {
    subapp = new Y.juju.SubApp({
      routes: [
        { path: '/', callbacks: 'showRootView' },
        { path: '/charm/:id', callbacks: 'showCharmDetailView' }
      ],
      urlNamespace: 'charmStore'
    });

  });

  it('should fire a subNavigate event on navigate', function(done) {
    var path = 'path';
    subapp.on('subNavigate', function(e) {
      assert.equal('sub-app:subNavigate', e.type, 'Event names don\'t match');
      assert.equal(path, e.url);
      done();
    });
    subapp.navigate(path, {});
  });

  it('should return routes with a namespace', function() {
    var subAppRoutes = subapp.getSubAppRoutes();

    assert(Y.Array.some(subAppRoutes, function(route) {
      if (route.namespace === undefined) {
        return true;
      }
    }) === false);

  });

});
