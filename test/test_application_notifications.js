'use strict';

describe('juju application notifications', function() {
  var Y, juju, models, views,
      applicationContainer,
      notificationsContainer,
      viewContainer,
      db,

      _setTimeout, _viewsHighlightRow;

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
    _setTimeout = window.setTimeout;
    window.setTimeout = function(callback) {
      callback();
    };

    // We skip this part because we have no row to highlight
    _viewsHighlightRow = views.highlightRow;
    views.highlightRow = function() {};

  });

  afterEach(function() {
    applicationContainer.remove(true);
    window.setTimeout = _setTimeout;
    views.highlightRow = _viewsHighlightRow;
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

  it('should show notification for "remove_units" and "resolved" exceptions' +
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
           },
           resolved: function(unit_name, relation_name, retry, callback) {
             callback({
               err: true
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

       // Fake relation
       db.relations.getById = function() {
         return {name: ''};
       };

       view.retryRelation({
         preventDefault: function() {},

         // This is a mock object of the relation button
         target: {
           ancestor: function() {
             return {get: function() {}};
           },
           set: function() {}
         }
       });

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '2', 'The system didnt show the alert');
     });

  it('should show notification for "add_relation" and "remove_relation"' +
      ' exceptions (environment view)', function() {
       var view = new views.environment({
         db: db,
         container: viewContainer}).render();

       view.service_click_actions._doAddRelationCallback.apply(view, [{
         err: true
       }]);

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');

       view._doRemoveRelationCallback.apply({
         scope: view,
         view: {
           removeSVGClass: function() {}
         },
         confirmButton: {
           set: function() {}
         }
       }, [{
         err: true
       }]);

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '2', 'The system didnt show the alert');
     });


  it('should show notification for "add_relation" and "destroy_service"' +
      ' exceptions (environment view)', function() {
       var view = new views.environment({
         db: db,
         destroy_service: {
           get: function() {}
         },
         env: {
           destroy_service: function(service, callback) {
             callback({err: true});
           }
         },
         container: viewContainer}).render();

       view.service_click_actions._doAddRelationCallback.apply(view, [{
         err: true
       }]);

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');

       view.service_click_actions.destroyService.apply(
           view.service_click_actions, [
         // Fake m object
         {},

         // Fake context object
         {},

         view,

         // Fake btn object
         {set: function() {}}
           ]);

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '2', 'The system didnt show the alert');
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

  it('should show notification for "remove_relation"' +
      ' exceptions (service relations view)', function() {

       var view = new views.service_relations({
         db: db,
         app: {
           getModelURL: function() {}
         },
         env: {
           remove_relation: function(id, newValues, callback) {
             callback({
               err: true
             });
           }
         },
         container: viewContainer});

       db.relations.getById = function() {
         return {
           get: function(key) {
             if ('endpoints' === key) {
               return [
                       [{}, {name: ''}]
               ];
             }
             return null;
           }
         };
       };

       view.render();

       view.confirmRemoved({
         preventDefault: function() {},

         // This is a mock object of the relation button
         target: {
           ancestor: function() {},
           get: function() {}
         }
       });
       view.remove_panel.footerNode.one('.btn-danger').simulate('click');
       view.remove_panel.destroy();

       assert.equal(
           applicationContainer.one('#notify-indicator').getHTML().trim(),
           '1', 'The system didnt show the alert');

     });

});
