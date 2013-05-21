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

describe('charm configuration', function() {
  var Y, juju, db, models, views, makeView, container,
      charmConfig =
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
                              description: 'Option Two'} }
                }
          };

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-models',
        'juju-charm-models',
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
    container = Y.namespace('juju-tests.utils')
                 .makeContainer('juju-search-charm-panel');
    db = new models.Database();
    makeView = function(charm, env) {
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
    var charm = new models.Charm({id: 'precise/mysql-7'}),
        view = makeView(charm);
    charm.loaded = true;
    // If the charm has no config options it is still handled.
    assert.isTrue(!Y.Lang.isValue(charm.config));
    view.render();
    var labels = container.all('div.control-label');
    labels.get('text').should.eql(['Service name', 'Number of units']);
  });

  it('must have inputs for items in the charm schema', function() {
    var charm = new models.Charm({id: 'precise/mysql-7'});
    var db = new models.Database();
    var view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          db: db});
    charm.setAttrs(charmConfig);
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
        charm = new models.Charm({id: 'cs:precise/mysql-7'}),
        view = makeView(charm, env);
    charm.loaded = true;
    view.render();
    container.one('#service-name').get('value').should.equal('mysql');
    container.one('#charm-deploy').simulate('click');
    received_service_name.should.equal('mysql');
    received_charm_url.should.equal('cs:precise/mysql-7');
  });

  it('must use the correct input type', function() {
    var charm = new models.Charm({id: 'precise/mysql-7'});
    var db = new models.Database();
    var view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          db: db});
    var modCharmConfig = Y.clone(charmConfig);
    modCharmConfig.config.options.option3 = {
      name: 'option3',
      type: 'float',
      description: 'Option Three'
    };
    charm.setAttrs(modCharmConfig);
    var options = charmConfig.config.options;
    // Set default values appropriate for each input type.
    options.option0['default'] = 'a single-line string';
    options.option1['default'] = 'checked';
    options.option2['default'] = 100;
    options.option2['default'] = 10.9;
    charm.setAttrs(modCharmConfig);
    charm.loaded = true;
    view.render();
    container.all('div.control-label').get('text').should.eql(
        ['Service name', 'Number of units', 'option0 (string)',
         'option1', 'option2 (int)', 'option3 (float)']);

    assert.equal('textarea', container.one('#input-option0').get('type'));
    assert.equal('checkbox', container.one('#input-option1').get('type'));
    assert.equal('text', container.one('#input-option2').get('type'));
    assert.equal('text', container.one('#input-option3').get('type'));
  });

  it('textareas must have resizing plugin', function() {
    var charm = new models.Charm({id: 'precise/mysql-7'});
    var db = new models.Database();
    var view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          db: db});
    var options = charmConfig.config.options;
    // Set default values appropriate for each input type.
    options.option0['default'] = 'a single-line string';
    options.option1['default'] = 'checked';
    options.option2['default'] = 100;
    charm.setAttrs(charmConfig);
    charm.loaded = true;
    view.render();
    // Textareas must have the ResizingTextarea plugin.
    assert.isDefined(container.one('#input-option0').resizingTextarea);
    // But not the other input types.
    assert.isUndefined(container.one('#input-option1').resizingTextarea);
    assert.isUndefined(container.one('#input-option2').resizingTextarea);
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
        charm = new models.Charm({id: 'cs:precise/mysql-7'}),
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
    received_charm_url.should.equal('cs:precise/mysql-7');
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
       charm = new models.Charm({id: 'precise/mysql-7'}),
       view = makeView(charm, env);
       db.services.add([{id: 'wordpress'}]);
       charm.loaded = true;
       view.render();
       container.one('#service-name').set('value', 'wordpress');
       container.one('#charm-deploy').simulate('click');
       deployed.should.equal(false);
       var notification = db.notifications.item(0);
       notification.get('title').should.equal(
       'Attempting to deploy service wordpress');
       notification.get('message').should.equal(
       'A service with that name already exists.');
     });

  it('must show the description in a tooltip', function() {
    var charm = new models.Charm({id: 'precise/mysql-7'});
    var db = new models.Database();
    var view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          db: db,
          tooltipDelay: 0 });

    charm.setAttrs(charmConfig);
    charm.loaded = true;
    view.render();
    var tooltip = view.tooltip,
        inputCtls = container.all('.control-group input.config-field'),
        textareaCtls = container.all('.control-group textarea.config-field');
    tooltip.get('srcNode').get('text').should.equal('');

    // The input controls are service-name, number-units, the upload widget,
    // and the boolean and int.
    assert.equal(inputCtls.size(), 4);
    // The textarea has the real one and a clone used for resizing.
    assert.equal(textareaCtls.size(), 2);
    inputCtls.item(0).focus();
    tooltip.get('srcNode').get('text').should.equal(
        'Name of the service to be deployed.  Must be unique.');
    tooltip.get('visible').should.equal(true);
    inputCtls.item(0).blur();
    tooltip.get('visible').should.equal(false);
    inputCtls.item(1).focus();
    tooltip.get('srcNode').get('text').should.equal(
        'Number of units to deploy for this service.');
    tooltip.get('visible').should.equal(true);
    inputCtls.item(1).blur();
    inputCtls.item(2).focus();
    tooltip.get('srcNode').get('text').should.equal('Option One');
    tooltip.get('visible').should.equal(true);
    // Now ensure it works in a textarea too.
    inputCtls.item(2).blur();
    textareaCtls.item(0).focus();
    tooltip.get('srcNode').get('text').should.equal('Option Zero');
    tooltip.get('visible').should.equal(true);
  });

  it('must keep the tooltip aligned with its field vertically', function() {
    // The tooltip's Y coordinate should be such that it is centered vertically
    // on its associated field.
    var fieldHeight = 7;
    var tooltipHeight = 17;
    var fieldY = 1000;
    var view = new views.CharmConfigurationView();
    var y = view._calculateTooltipY(fieldY, fieldHeight, tooltipHeight);
    assert.equal(y, 995);
  });

  it('must keep the tooltip to the left of its field', function() {
    // The tooltip's X coordinate should be such that it is to the left of its
    // associated field.
    var tooltipWidth = 100;
    var fieldX = 1000;
    var view = new views.CharmConfigurationView();
    var x = view._calculateTooltipX(fieldX, tooltipWidth);
    assert.equal(x, 885);
  });

  it('must hide the tooltip when its field scrolls away', function() {
    var charm = new models.Charm({id: 'precise/mysql-7'});
    var db = new models.Database();
    var view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          db: db,
          tooltipDelay: 0 });
    charm.setAttrs(charmConfig);
    charm.loaded = true;
    view.render();
    var tooltip = view.tooltip,
        controls = container.all('.control-group input'),
        panel = container.one('.charm-panel');
    // The panel needs to be scrollable and smaller than what it contains.  We
    // do this by setting a height to the panel and then setting the height to
    // one of the controls to something much bigger.
    panel.setStyles({height: '400px', overflowY: 'auto'});
    controls.item(1).set('height', '4000px');
    controls.item(0).focus();
    tooltip.get('visible').should.equal(true);
    panel.set('scrollTop', panel.get('scrollTop') + 100);
    // The simulate module does not support firing scroll events so we call
    // the associated method directly.
    view._moveTooltip();
    tooltip.get('visible').should.equal(false);
  });

  it('must not show a configuration file upload button if the charm ' +
      'has no settings', function() {
       var charm = new models.Charm({id: 'precise/mysql-7'});
       var db = new models.Database();
       var view = new views.CharmConfigurationView(
       { container: container,
         model: charm,
         db: db,
         tooltipDelay: 0 });
       view.render();
       var _ = expect(container.one('.config-file-upload')).to.not.exist;
       _ = expect(container.one('.remove-config-file')).to.not.exist;
     });

  it('must show a configuration file upload button if the charm ' +
      'has settings', function() {
        var charm = new models.Charm({id: 'precise/mysql-7'});
        charm.setAttrs(
           { config:
             { options:
               { option0:
                 { name: 'option0',
                   type: 'string'}
               }
             }
           });
       var db = new models.Database();
       var view = new views.CharmConfigurationView(
       { container: container,
         model: charm,
         db: db,
         tooltipDelay: 0 }
       );
       charm.loaded = true;
       view.render();
       var _ = expect(container.one('.config-file-upload')).to.exist;
       // The config file name should be ''.
       container.one('.config-file-name').getContent().should.equal('');
     });

  it('must hide configuration panel when a file is uploaded', function() {
    var charm = new models.Charm({id: 'precise/mysql-7'});
    charm.setAttrs(
        { config:
              { options:
                    { option0:
                         { name: 'option0',
                           type: 'string'}
                    }
              }
        });
    var db = new models.Database();
    var view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          db: db,
          tooltipDelay: 0 }),
        fileContents = 'yaml yaml yaml';
    charm.loaded = true;
    view.render();
    view.onFileLoaded({target: {result: fileContents}});
    view.configFileContent.should.equal(fileContents);
    container.one('.charm-settings').getStyle('display').should.equal('none');
  });

  it('must remove configuration data when the button is pressed', function() {
    var charm = new models.Charm({id: 'precise/mysql-7'});
    charm.setAttrs(
        { config:
              { options:
                    { option0:
                         { name: 'option0',
                           type: 'string'}
                    }
              }
        });
    var db = new models.Database();
    var view = new views.CharmConfigurationView(
        { container: container,
          model: charm,
          db: db,
          tooltipDelay: 0 });
    charm.loaded = true;
    view.render();
    view.fileInput = container.one('.config-file-upload-widget');
    view.configFileContent = 'how now brown cow';
    container.one('.config-file-name').setContent('a.yaml');
    container.one('.config-file-upload-overlay').simulate('click');
    var _ = expect(view.configFileContent).to.not.exist;
    container.one('.config-file-name').getContent().should.equal('');
    container.one('.config-file-upload-widget').get('files').size()
         .should.equal(0);
  });

  it('must be able to deploy with configuration from a file', function() {
    var received_config,
        received_config_raw,
        charm = new models.Charm({id: 'precise/mysql-7'}),
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
