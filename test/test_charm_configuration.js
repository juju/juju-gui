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
    app = { db: db };
  });
  afterEach(function() {
    container.remove(true);
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
    charm.loaded = true;
    // If the charm has no config options it is still handled.
    assert.isTrue(!Y.Lang.isValue(charm.config));
    view.render();
    var labels = container.all('div.control-label');
    labels.get('text').should.eql(['Service name', 'Number of units']);
  });

  it('must have inputs for items in the charm schema', function() {
    var charm = new models.Charm({id: 'precise/mysql'}),
        view = new views.CharmConfigurationView(
        { container: container,
          model: charm});
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
    charm.loaded = true;
    view.render();
    container.all('div.control-label').get('text').should.eql(
        ['Service name', 'Number of units', 'option0 (string)',
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
    charm.loaded = true;
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
        charm = new models.Charm({id: 'precise/mysql'}),
        view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          app: app});
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
    charm.loaded = true;
    view.render();
    container.one('#service-name').set('value', 'aaa');
    container.one('#number-units').set('value', '24');
    container.one('#input-option0').set('value', 'cows');
    container.one('#charm-deploy').simulate('click');
    received_service_name.should.equal('aaa');
    received_charm_url.should.equal('cs:precise/mysql');
    received_num_units.should.equal(24);
    received_config.should.eql({option0: 'cows'});
  });

  it('must not deploy a charm with same name as an existing service',
     function() {
       var deployed = false,
       env = {deploy: function(charm_url, service_name, config, num_units) {
         deployed = true;
       }},
       charm = new models.Charm({id: 'precise/mysql'}),
       view = new views.CharmConfigurationView(
       { container: container,
         model: charm,
         app: app});
       db.services.add([{id: 'wordpress'}]);
       app.env = env;
       charm.loaded = true;
       view.render();
       container.one('#service-name').set('value', 'wordpress');
       container.one('#charm-deploy').simulate('click');
       deployed.should.equal(false);
       var notification = db.notifications.toArray()[0];
       notification.get('title').should.equal(
       'Attempting to deploy service wordpress');
       notification.get('message').should.equal(
       'A service with that name already exists.');
     });

  it('must show the description in a tooltip', function() {
    var charm = new models.Charm({id: 'precise/mysql'}),
        view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          tooltipDelay: 0 });
    charm.setAttrs(
        { config:
              { options:
                    { option0:
                         { name: 'option0',
                           type: 'string',
                           description: 'Option Zero'},
                      option1:
                         { name: 'option1',
                           type: 'boolean',
                           description: 'Option One'},
                      option2:
                         { name: 'option2',
                           type: 'int',
                           description: 'Option Two'}
                    }
              }
        });
    charm.loaded = true;
    view.render();
    var tooltip = view.tooltip,
        controls = container.all('.control-group');
    tooltip.get('srcNode').get('text').should.equal('');

    // There are five control groups, the three corresponding to the options
    // shown above and two preceding, service name and number of units.
    // Simulate mouse moves into the different control groups and see the tool
    // tip text change.
    view.waitingToShow.should.equal(false);
    controls.item(0).simulate('mousemove');
    tooltip.get('srcNode').get('text').should.equal(
        'Name of the service to be deployed.  Must be unique.');
    view.waitingToShow.should.equal(true);
    // Reset the 'waitingToShow' since mouseleave cannot be simulated.
    view.waitingToShow = false;
    controls.item(1).simulate('mousemove');
    tooltip.get('srcNode').get('text').should.equal(
        'Number of units to deploy for this service.');
    view.waitingToShow.should.equal(true);
    view.waitingToShow = false;
    controls.item(2).simulate('mousemove');
    tooltip.get('srcNode').get('text').should.equal('Option Zero');
  });

});
