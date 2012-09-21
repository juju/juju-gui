'use strict';

(function() {
  describe('juju service config view', function() {
    var ServiceConfigView, models, Y, container, service, db, conn,
        env, charm, ENTER;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-views', 'juju-models', 'base',
          'node', 'json-parse', 'juju-env', 'node-event-simulate',
          'juju-tests-utils', 'event-key',

          function(Y) {
            ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
            models = Y.namespace('juju.models');
            ServiceConfigView = Y.namespace('juju.views').service_config;
            conn = new(Y.namespace('juju-tests.utils')).SocketStub();
            env = new(Y.namespace('juju')).Environment({
                    conn: conn
            });
            env.connect();
            conn.open();
            done();
          });
    });

    after(function(done) {
      env.destroy();
      done();
    });

    beforeEach(function(done) {
      container = Y.Node.create('<div id="test-container" />');
      Y.one('#main').append(container);
      db = new models.Database();
      charm = new models.Charm({
                id: 'mysql',
                name: 'mysql',
                description: 'A DB',
                config: {
          option0: {
            description: 'The first option.',
            type: 'string'
          },
          option1: {
            description: 'The second option.',
            type: 'boolean'
          }
                }
      });

      db.charms.add([charm]);
      service = new models.Service({
        id: 'mysql',
        charm: 'mysql',
        unit_count: db.units.size(),
        loaded: true,
        config: {
                    option0: 'value0',
                    option1: 'value1'
        }
      });
      db.services.add([service]);
      done();
    });

    afterEach(function(done) {
      container.remove();
      container.destroy();
      service.destroy();
      db.destroy();
      conn.messages = [];
      done();
    });

    it('should display the configuration', function() {
      var view = new ServiceConfigView({
        container: container,
        model: service,
        db: db,
        env: env
      });
      view.render();

      var config = service.get('config');
      var container_html;
      for (var name in config) {
        var value = config[name];
        container_html = container.one('#service-config').getHTML();
        container_html.should.contain(name);
        container_html.should.contain(value);
      }
    });

    it('should let the user change a configuration value', function() {
      var view = new ServiceConfigView({
        container: container,
        model: service,
        db: db,
        env: env
      }).render();

      container.one('#input-option0').set('value', 'new value');
      // In tests the events are not wired up right so we will call this
      // event handler manually.
      view.saveConfig();
      var message = conn.last_message();
      message.op.should.equal('set_config');
      message.service_name.should.equal('mysql');
      message.config.option0.should.equal('new value');
      message.config.option1.should.equal('value1');
    });

    it('should reenable the "Update" button if RPC fails', function() {
      var assertButtonState = function(shouldBe) {
        var save_button = container.one('#save-service-config');
        save_button.get('disabled').should.equal(shouldBe);
      };

      var view = new ServiceConfigView({
        container: container,
        model: service,
        db: db,
        env: (function() {
          env.set_config = function(service, config, callback) {
            assertButtonState(true);
            callback({
              err: true
            });
          };
          return env;
        })()
      }).render();

      // Clicking on the "Update" button disables it until the RPC
      // callback returns, then it is re-enabled.
      assertButtonState(false);
      view.saveConfig();
      assertButtonState(false);
    });

    it('should display a message when a server error occurs', function() {
      var ev = {err: true},
          alert_ = container.one('#message-area>.alert');

      var view = new ServiceConfigView({
        container: container,
        model: service,
        db: db,
        env: (function() {
          env.set_config = function(service, config, callback) {
            callback(ev);
          };
          return env;
        })()
      }).render();

      // Before an erroneous event is processed, no alert exists.
      var _ = expect(alert_).to.not.exist;
      // Handle the error event.
      Y.namespace('juju.views.utils').buildServerCallbackHandler({
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
           db: db,
           env: env
         }).render();

         var error_message = Y.namespace('juju.views.utils')._serverErrorMessage,
         alert_ = container.one('#message-area>.alert');

         // Before an erroneous event is processed, no alert exists.
         var _ = expect(alert_).to.not.exist;
         // Display the error message.
         Y.namespace('juju.views.utils').buildServerCallbackHandler({
           container: container
         })({
           err: true
         });
         // The method should have created an alert box.
         alert_ = container.one('#message-area>.alert');
         alert_.getHTML().should.contain(error_message);
        });
  });
})();
