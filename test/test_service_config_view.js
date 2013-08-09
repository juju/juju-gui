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

(function() {
  describe('juju service config view', function() {
    var charm, conn, container, db, ENTER, env, makeView, models, service,
        ServiceConfigView, testUtils, utils, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'base',
          'event-key',
          'json-parse',
          'juju-env',
          'juju-models',
          'juju-tests-utils',
          'juju-view-service',
          'juju-views',
          'node',
          'node-event-simulate',

          function(Y) {
            views = Y.namespace('juju.views');
            ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
            models = Y.namespace('juju.models');
            ServiceConfigView = views.service_config;
            utils = Y.namespace('juju.views.utils');
            testUtils = Y.namespace('juju-tests.utils');
            makeView = function() {
              return new ServiceConfigView(
                  { container: container,
                    model: service,
                    db: db,
                    env: env,
                    getModelURL: function() {}}).render();
            };
            done();
          });
    });

    after(function(done) {
      if (env) {
        env.destroy();
      }
      done();
    });

    beforeEach(function(done) {
      conn = new testUtils.SocketStub(),
      env = Y.namespace('juju').newEnvironment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div id="test-container" />');
      Y.one('#main').append(container);
      db = new models.Database();
      charm = new models.BrowserCharm({
        id: 'precise/mysql-7',
        url: 'cs:precise/mysql-7',
        description: 'A DB',
        options: {
          option0: {
            description: 'The first option.',
            type: 'string'
          },
          option1: {
            description: 'The second option.',
            type: 'boolean'
          },
          option2: {
            description: 'The third option.',
            type: 'boolean'
          },
          intOption: {
            description: 'An int option with no default value.',
            type: 'int'
          },
          intOptionWithDefault: {
            description: 'An int option with no default value.',
            type: 'int',
            'default': 1
          },
          floatOption: {
            description: 'A float option with no default value.',
            type: 'float'
          }
        }
      });

      db.charms.add([charm]);
      service = new models.Service({
        id: 'mysql',
        charm: 'cs:precise/mysql-7',
        unit_count: db.units.size(),
        loaded: true,
        config: {
                    option0: 'value0',
                    option1: true,
                    option2: false,
                    intOption: 1,
                    floatOption: 1.1
        }
      });
      db.services.add([service]);
      done();
    });

    afterEach(function(done) {
      container.remove(true);
      service.destroy();
      db.destroy();
      conn.messages = [];
      done();
    });

    it('should display the configuration', function() {
      var view = makeView(),
          config = service.get('config'),
          serviceConfigDiv = container.one('#service-config');

      Y.Object.each(config, function(value, name) {
        var input = serviceConfigDiv.one('#input-' + name);

        if (value === true) {
          // testing TRUE values (checkbox)
          assert.isTrue(input.get('checked'));
        } else if (value === false) {
          // testing FALSE values (checkbox);
          assert.isFalse(input.get('checked'));
        } else {
          input.get('value').should.equal(String(value));
        }
      });
    });

    it('should let the user change a configuration value', function() {
      var view = makeView();
      container.one('#input-option0').set('value', 'new value');
      // In tests the events are not wired up right so we will call this
      // event handler manually.
      view.saveConfig();
      var message = conn.last_message();
      message.op.should.equal('set_config');
      message.service_name.should.equal('mysql');
      message.config.option0.should.equal('new value');
      message.config.option1.should.equal(true);
    });

    it('should reenable the "Update" button if RPC fails', function() {
      var assertButtonDisabled = function(shouldBe) {
        var save_button = container.one('#save-service-config');
        save_button.get('disabled').should.equal(shouldBe);
      };
      env.set_config = function(service, config, data, callback) {
        assertButtonDisabled(true);
        callback(ev);
      };

      var ev = {err: true},
          view = makeView();

      // Clicking on the "Update" button disables it until the RPC
      // callback returns, then it is re-enabled.
      assertButtonDisabled(false);
      view.saveConfig();
      assertButtonDisabled(false);
    });

    it('should display a message when a server error occurs', function() {
      var ev = {err: true},
          view = makeView(),
          alert_ = container.one('#message-area>.alert');
      env.set_config = function(service, config, data, callback) {
        callback(ev);
      };

      // Before an erroneous event is processed, no alert exists.
      var _ = expect(alert_).to.not.exist;
      // Handle the error event.
      utils.buildRpcHandler({
        container: container
      })(ev);
      // The event handler should have created an alert box.
      alert_ = container.one('#message-area>.alert');
      alert_.getHTML().should.contain('An error ocurred.');
    });

    it('should display an error when addErrorMessage is called',
       function() {
         var view = makeView(),
             error_message = utils.SERVER_ERROR_MESSAGE,
         alert_ = container.one('#message-area>.alert');

         // Before an erroneous event is processed, no alert exists.
         var _ = expect(alert_).to.not.exist;
         // Display the error message.
         utils.buildRpcHandler({
           container: container
         })({
           err: true
         });
         // The method should have created an alert box.
         alert_ = container.one('#message-area>.alert');
         alert_.getHTML().should.contain(error_message);
        });

    it('should display an error when a validation error occurs', function() {
      var assertError = function(key, value, message) {
        // Mock function
        // view.saveConfig() calls it as part of its internal
        // "success" callback
        env.set_config = function(service, config, data, callback) {
          callback(ev);
        };
        var ev = {err: false},
            view = makeView();

        container.one('#input-' + key).set('value', value);

        view.saveConfig();

        var errorSpan = container.one('#error-' + key);
        if (message) {
          assert.isNotNull(errorSpan);

        } else {
          assert.isNull(errorSpan);
        }
      };

      assertError('intOption', '', 'This field is required.');
      assertError('intOption', '  ', 'This field is required.');
      assertError('intOption', '1', null);
      assertError('intOption', '1.1', 'The value "1.1" is not an integer.');
      assertError('intOption', 'a', 'The value "a" is not an integer.');

      assertError('floatOption', '', 'This field is required.');
      assertError('floatOption', '  ', 'This field is required.');
      assertError('floatOption', '1', null);
      assertError('floatOption', '1.1', null);
      assertError('floatOption', 'a', 'The value "a" is not a float.');

      assertError('intOptionWithDefault', '   ', null);
      assertError('intOptionWithDefault', '', null);
      assertError('intOptionWithDefault', '1', null);
      assertError('intOptionWithDefault', 'a',
          'The value "a" is not an integer.');
    });
  });
})();
