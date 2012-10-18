'use strict';

describe('charm configuration', function() {
  var Y, juju, db, models, views, makeView, container;

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
    container = Y.Node.create('<div id="juju-search-charm-panel" />');
    Y.one('#main').append(container);
    db = new models.Database();
    makeView = function(charm, env, db_given) {
      return new views.CharmConfigurationView(
          { container: container,
            db: db,
            env: env,
            model: charm,
            tooltipDelay: 0 }).render();
    };
  });

  afterEach(function() {
    container.remove(true);
  });

  it('must show loading message if the charm is not loaded', function() {
    var view = makeView();
    container.one('div.alert').get('text').trim().should.equal(
        'Waiting on charm data...');
  });

  it('must have inputs for service and number of units', function() {
    var charm = new models.Charm({id: 'precise/mysql'}),
        view = makeView(charm);
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
         'option1', 'option2 (int)']);
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
        view = makeView(charm, env);
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
        env = {deploy: function(charm_url, service_name, config, config_raw,
                                num_units) {
            deployed = true;
            received_charm_url = charm_url;
            received_service_name = service_name;
            received_config = config;
            received_num_units = num_units;
          }},
        charm = new models.Charm({id: 'precise/mysql'}),
        view = makeView(charm, env);
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
       env =
       { deploy:
         function(charm_url, service_name, config, config_raw, num_units) {
           deployed = true;
         }},
       charm = new models.Charm({id: 'precise/mysql'}),
       view = makeView(charm, env);
       db.services.add([{id: 'wordpress'}]);
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
        controls = container.all('.control-group input');
    tooltip.get('srcNode').get('text').should.equal('');

    // There are five control groups, the three corresponding to the options
    // shown above and two preceding, service name and number of units.
    // Simulate mouse moves into the different control groups and see the tool
    // tip text change.
    controls.item(0).focus();
    tooltip.get('srcNode').get('text').should.equal(
        'Name of the service to be deployed.  Must be unique.');
    tooltip.get('visible').should.equal(true);
    controls.item(0).blur();
    tooltip.get('visible').should.equal(false);
    controls.item(1).focus();
    tooltip.get('srcNode').get('text').should.equal(
        'Number of units to deploy for this service.');
    tooltip.get('visible').should.equal(true);
    controls.item(1).blur();
    controls.item(2).focus();
    tooltip.get('srcNode').get('text').should.equal('Option Zero');
    tooltip.get('visible').should.equal(true);
  });

  it('must not show a configuration file upload button if the charm ' +
      'has no settings', function() {
       var charm = new models.Charm({id: 'precise/mysql'}),
       view = new views.CharmConfigurationView(
       { container: container,
         model: charm,
         tooltipDelay: 0 });
       view.render();
       var _ = expect(container.one('.config-file-upload')).to.not.exist;
       _ = expect(container.one('.remove-config-file')).to.not.exist;
      });

  it('must show a configuration file upload button if the charm ' +
      'has settings', function() {
        var charm = new models.Charm({id: 'precise/mysql'});
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
         tooltipDelay: 0 }
       );
       charm.loaded = true;
       view.render();
       var _ = expect(container.one('.config-file-upload')).to.exist;
       // The remove button is conditional and should exist but be hidden.
       var remove_button = container.one('.remove-config-file');
       remove_button.hasClass('hidden').should.equal(true);
     });

  it('must hide configuration panel when a file is uploaded', function() {
    var charm = new models.Charm({id: 'precise/mysql'});
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
          tooltipDelay: 0 });
    charm.loaded = true;
    view.render();
    view.onFileLoaded({target: {result: 'yaml yaml yaml'}});
    view.configFileContent.should.equal('yaml yaml yaml');
    container.one('.charm-settings').getStyle('display').should.equal('none');
    container.one('.remove-config-file').hasClass('hidden').should.equal(false);
  });

  it('must remove configuration data when the button is pressed', function() {
    var charm = new models.Charm({id: 'precise/mysql'});
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
          tooltipDelay: 0 });
    charm.loaded = true;
    view.render();
    view.fileInput = container.one('.config-file-upload');
    view.configFileContent = 'how now brown cow';
    container.one('.remove-config-file').simulate('click');
    var _ = expect(view.configFileContent).to.not.exist;
    container.one('.remove-config-file').hasClass('hidden').should.equal(true);
    container.one('.config-file-upload').get('files').size().should.equal(0);
  });

  it('must be able to deploy with configuration from a file', function() {
    var received_config,
        received_config_raw,
        charm = new models.Charm({id: 'precise/mysql'}),
        db = {services: {getById: function(name) {return null;}}},
        env =
        { deploy:
              function(charm_url, service_name, config, config_raw, num_units) {
                received_config = config;
                received_config_raw = config_raw;
              }},
        view = makeView(charm, env, db);
    charm.setAttrs(
        { config:
              { options:
                    { tuninglevel:
                         { name: 'tuning-level',
                           type: 'string'}
                    }
              }
        });
    charm.loaded = true;
    view.render();
    var config_raw = 'tuning-level: \n expert';
    view.configFileContent = config_raw;
    container.one('#charm-deploy').simulate('click');
    var _ = expect(received_config).to.not.exist;
    received_config_raw.should.equal(config_raw);
  });


});
