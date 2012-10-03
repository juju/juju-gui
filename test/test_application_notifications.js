'use strict';

describe('juju application notifications', function() {
  var Y, juju, models, views,
      applicationContainer,
      notificationsContainer,
      viewContainer,
      db,
      _setTimeout = window.setTimeout;

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
    applicationContainer = Y.Node.create('<div id="test-container" />');
    applicationContainer.appendTo(Y.one(Y.one(document.body)));

    notificationsContainer = Y.Node.create('<div id="notifications" />');
    notificationsContainer.appendTo(applicationContainer);

    viewContainer = Y.Node.create('<div />');
    viewContainer.appendTo(applicationContainer);

    db = new models.Database();

    var notificationsView = new views.NotificationsView({
      container: notificationsContainer,
      app: {},
      env: {
        on: function() {},
        get: function(key) {
          if (key === 'connected') {
            return true;
          }
          return null;
        }
      },
      notifications: db.notifications
    });

    notificationsView.render();

    // The notifications.js delays the notification update.
    // We are going to avoid this timeout to make it possible to test
    // the notification callback synchronously.
    window.setTimeout = function(callback) {
      callback();
    };
  });

  afterEach(function() {
    applicationContainer.remove(true);
    window.setTimeout = _setTimeout;
  });

  it('should show notification for "add_unit" and "remove_units" exceptions' +
      ' (service view)', function() {
       var view = new views.service({
         container: viewContainer,
         app: {
           getModelURL: function() {
             return 'my url';
           }
         },
         db: db,
         env: {
           add_unit: function(serviceId, delta, callback) {
             callback({
               err: true
             });
           },
           remove_units: function(param, callback) {
             callback({
               err: true
             });
           }
         },
         model: {
           getAttrs: function() {},
           get: function(key) {
             if ('unit_count' === key) {
               return 2;
             }
             return null;
           }
         },
         querystring: {}
       }).render();

       db.units.get_units_for_service = function() {
         return [{
           id: 1
         }];
       };

       view._modifyUnits(3);
       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');

       view._modifyUnits(1);
       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '2', 'The system didnt show the alert');

     });

  it('should show notification for "remove_units" exceptions' +
      ' (unit view)', function() {
       var view = new views.unit({
         container: viewContainer,
         app: {
           getModelURL: function() {
             return 'my url';
           }
         },
         db: db,
         env: {
           remove_units: function(param, callback) {
             callback({
               err: true,
               unit_names: ['aaa']
             });
           }
         },
         unit: {},
         querystring: {}
       });

       // Used my unit.js inside the "render" function
       db.services.getById = function() {
         // Mock service
         return {
           get: function(key) {
             if (key === 'loaded') {
               return true;
             }
             return null;
           }
         };
       };

       view.render();

       view.confirmRemoved({
         preventDefault: function() {}
       });

       view.remove_panel.footerNode.one('.btn-danger').simulate('click');
       view.remove_panel.destroy();

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');
     });

  it('should show notification for "add_relation" exceptions' +
      ' (environment view)', function() {
       var view = new views.environment({
         db: db,
         container: viewContainer}).render();

       view.service_click_actions._doAddRelationCallback.apply(view, [{
         err: true
       }]);

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');
     });


  it('should show notification for "add_relation" exceptions' +
      ' (environment view)', function() {
       var view = new views.environment({
         db: db,
         container: viewContainer}).render();

       view.service_click_actions._doAddRelationCallback.apply(view, [{
         err: true
       }]);

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');
     });

  it('should show notification for "get_service" exceptions' +
      ' (service constraints view)', function() {

       var view = new views.service_constraints({
         db: db,
         model: {
           getAttrs: function() {},
           get: function(key) {
             if ('constraints' === key) {
               return {};
             }
             return null;
           }
         },
         env: {
           set_constraints: function(id, values, callback) {
             callback({
               err: true
             });
           }
         },
         container: viewContainer}).render();

       view.updateConstraints();

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');

     });

  it('should show notification for "get_service", "expose" and "unexpose"' +
      ' exceptions (service config view)', function() {

       var view = new views.service_config({
         db: db,
         app: {
           getModelURL: function() {}
         },
         model: {
           getAttrs: function() {},
           get: function(key) {
             if ('loaded' === key) {
               return true;
             }
             if ('config' === key) {
               return {};
             }
             return null;
           }
         },
         env: {
           set_config: function(id, newValues, callback) {
             callback({
               err: true
             });
           },
           expose: function(id, callback) {
             callback({
               err: true
             });
           },
           unexpose: function(id, callback) {
             callback({
               err: true
             });
           }
         },
         container: viewContainer});

       db.charms.getById = function() {
         return {
           getAttrs: function() {},
           get: function(key) {
             if ('config' === key) {
               return {};
             }
             return null;
           }
         };
       };

       view.render();

       view.saveConfig();

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');

       view.exposeService();

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '2', 'The system didnt show the alert');

       view.unexposeService();

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '3', 'The system didnt show the alert');
     });



});
