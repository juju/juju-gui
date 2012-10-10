'use strict';

describe('charm configuration', function() {
  var Y, juju, models, views;

  before(function() {
    Y = YUI(GlobalConfig).use([
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-env',
      'juju-tests-utils',
      'node-event-simulate'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
    });
  });

  beforeEach(function() {
  });

  it('must show loading message if the charm is not loaded', function() {
    var container = Y.Node.create(),
        charm = new models.Charm({id: 'precise/mysql'}),
        view = views.CharmConfigurationView(
        { container: container,
          model: charm});
    view.render();
    assert.include(container.getHTML(), 'Waiting on charm data');
  });
});
