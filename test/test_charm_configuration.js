'use strict';

describe('charm configuration', function() {
  var Y, juju, app, db, models, views, container;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-env',
      'juju-tests-utils',
      'node-event-simulate',
      'node',

    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    container = Y.Node.create('<div id="test-container" />');
    Y.one('#main').append(container);
    db = new models.Database();
    app = { db: db};
  });
  afterEach(function() {
    container.remove(true);
    //db.destroy();
    //env.destroy();
  });

  it('must show loading message if the charm is not loaded', function() {
    var view = new views.CharmConfigurationView({container: container});
    view.render();
    container.one('div.alert').get('text').trim().should.equal(
        'Waiting on charm data...');
  });

  it('must have inputs for service and number of units', function() {
    var charm = new models.Charm({id: 'precise/mysql'}),
        view = new views.CharmConfigurationView(
          { container: container,
            model: charm});
    // If the charm has no config options it is still handled.
    assert.isTrue(!Y.Lang.isValue(charm.config));
    view.render();
    var labels = container.all('div.control-label');
    labels.get('text').should.eql(['Service name:', 'Number of units:']);
  });

  it('must have inputs for items in the charm schema', function() {
    var charm = new models.Charm({id: 'precise/mysql'});
    charm.setAttrs(
      { config:
        { options:
          { option0:
            { name: 'option0',
              type: 'string'},
            option1:
            { name: 'option1',
              type: 'boolean'},
            option2:
            { name: 'option2',
              type: 'int'}
          }
        }
      });
    var view = new views.CharmConfigurationView(
          { container: container,
            model: charm});
    view.render();
    var labels = container.all('div.control-label');
    labels.get('text').should.eql(
      ['Service name:', 'Number of units:', 'option0 (string)',
       'option1 (boolean)', 'option2 (int)']);
  });

  it('must deploy a charm with default value', function() {
    var deployed = false,
        received_charm_url,
        received_service_name,
        env = {deploy: function(charm_url, service_name) {
           deployed = true;
           received_charm_url = charm_url;
           received_service_name = service_name;
           }},
        charm = new models.Charm({id: 'precise/mysql'}),
        view = new views.CharmConfigurationView(
          { container: container,
            model: charm,
            app: app});
    app.env = env;
    view.render();
    container.one('#service-name').get('value').should.equal('mysql');
    container.one('#charm-deploy').simulate('click');
    received_service_name.should.equal('mysql');
    received_charm_url.should.equal('cs:precise/mysql');
  });

  it('must deploy a charm with the custom configuration', function() {
    var deployed = false,
        received_charm_url,
        received_service_name,
        received_config,
        received_num_units,
        env = {deploy: function(charm_url, service_name, config, num_units) {
           deployed = true;
           received_charm_url = charm_url;
           received_service_name = service_name;
           received_config = config;
           received_num_units = num_units;
           }},
        charm = new models.Charm({id: 'precise/mysql'});
    app.env = env;
    charm.setAttrs(
      { config:
        { options:
          { option0:
            { name: 'option0',
              type: 'string'}
          }
        }
      });
    var view = new views.CharmConfigurationView(
          { container: container,
            model: charm,
            app: app});
    view.render();
    container.one('#service-name').set('value', 'aaa');
    container.one('#number-units').set('value', '24');
    container.one('#input-option0').set('value', 'cows');
    container.one('#charm-deploy').simulate('click');
    received_service_name.should.equal('aaa');
    received_charm_url.should.equal('cs:precise/mysql');
    received_num_units.should.equal('24');
    received_config.should.eql({option0: 'cows'});
  });

});
