'use strict';

(function() {
  describe('juju service config view', function() {
    var ServiceConfigView, models, Y, container, service, db, conn,
        env, charm, ENTER, utils, app, testUtils;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', 'juju-models', 'base',
          'node', 'json-parse', 'juju-env', 'node-event-simulate',
          'juju-tests-utils', 'event-key',

          function(Y) {
            ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
            models = Y.namespace('juju.models');
            ServiceConfigView = Y.namespace('juju.views').service_config;
            utils = Y.namespace('juju.views.utils');
            testUtils = Y.namespace('juju-tests.utils');
            done();
          });
    });

    after(function(done) {
      env.destroy();
      done();
    });

    beforeEach(function(done) {
      conn = new testUtils.SocketStub(),
      env = new (Y.namespace('juju')).Environment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div id="test-container" />');
      Y.one('#main').append(container);
      db = new models.Database();
      charm = new models.Charm(
          { id: 'cs:precise/mysql',
            description: 'A DB',
            config:
                { options:
                      { option0:
                            { description: 'The first option.',
                              type: 'string'},
                        option1: { description: 'The second option.',
                          type: 'boolean'},
                        option2:
                            { description: 'The third option.',
                              type: 'boolean'},
                        intOption:
                            { description:
                              'An int option with no default value.',
                              type: 'int'},
                        intOptionWithDefault:
                            { description:
                              'An int option with no default value.',
                              type: 'int',
                              'default': 1},
                        floatOption:
                            { description:
                              'A float option with no default value.',
                              type: 'float'}}}});

      db.charms.add([charm]);
      app = { env: env, db: db,
              getModelURL: function(model, intent) {
                return model.get('name'); }};
      service = new models.Service({
        id: 'mysql',
        charm: 'cs:precise/mysql',
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
      var view = new ServiceConfigView({
        container: container,
        model: service,
        app: app
      });
      view.render();

      var config = service.get('config'),
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
      var view = new ServiceConfigView({
        container: container,
        model: service,
        app: app
      }).render();

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
      env.set_config = function(service, config, callback) {
        assertButtonDisabled(true);
        callback(ev);
      };

      var ev = {err: true},
          view = new ServiceConfigView({
            container: container,
            model: service,
            app: (function() {
              app.getModelURL = function() {};
              return app;
            })()
          }).render();

      // Clicking on the "Update" button disables it until the RPC
      // callback returns, then it is re-enabled.
      assertButtonDisabled(false);
      view.saveConfig();
      assertButtonDisabled(false);
    });

    it('should display a message when a server error occurs', function() {
      var ev = {err: true},
          alert_ = container.one('#message-area>.alert');
      env.set_config = function(service, config, callback) {
        callback(ev);
      };

      var view = new ServiceConfigView({
        container: container,
        model: service,
        app: app
      }).render();

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
          var view = new ServiceConfigView({
           container: container,
           model: service,
           app: app
         }).render();

         var error_message = utils.SERVER_ERROR_MESSAGE,
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
        app.load_service = function() {};
        env.set_config = function(service, config, callback) {
          callback(ev);
        };
        var ev = {err: false},
            view = new ServiceConfigView({
              app: app,
              container: container,
              model: service
            }).render();

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
