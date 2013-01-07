'use strict';

describe('juju application notifications - login', function() {
  var _setTimeout, _viewsHighlightRow, db, ERR_EV, juju, models, NO_OP,
      viewContainer, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
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
      done();
    });

    ERR_EV = {
      err: true
    };
    NO_OP = function() {};
  });

  beforeEach(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-env',
      'juju-tests-utils',
      'node-event-simulate'],
    function(Y) {
      viewContainer = Y.Node.create('<div />');
      viewContainer.appendTo(Y.one('body'));
      viewContainer.hide();

      db = new models.Database();

      // The notifications.js delays the notification update.
      // We are going to avoid this timeout to make it possible to test
      // the notification callback synchronously.
      _setTimeout = window.setTimeout;
      window.setTimeout = function(callback) {
        callback();
      };

      // We skip this part because we have no row to highlight
      _viewsHighlightRow = views.highlightRow;
      views.highlightRow = NO_OP;
      done();
    });
  });

  afterEach(function() {
    viewContainer.remove(true);
    window.setTimeout = _setTimeout;
    views.highlightRow = _viewsHighlightRow;
  });

  it('should notify errors in the notifications view', function() {
    viewContainer.set('id', 'notifications');
    var notificationsView = new views.NotificationsView({
      container: viewContainer,
      env: {
        on: NO_OP,
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
    var notification = new models.Notification({level: 'error'});
    db.notifications.add(notification);
    assert.equal('1', viewContainer.one('#notify-indicator').getHTML().trim());
  });

  it('should show notification for "add_unit" and "remove_units" exceptions' +
     ' (service view)', function() {
       var view = new views.service(
       { container: viewContainer,
         getModelURL: function() {
           return 'my url';
         },
         db: db,
         env: {
           add_unit: function(serviceId, delta, callback) {
             callback(ERR_EV);
           },
           remove_units: function(param, callback) {
             callback(ERR_EV);
           }
         },
         model: {
           getAttrs: NO_OP,
           get: function(key) {
             if ('unit_count' === key) {
               // We simulate a model with 2 units
               return 2;
             }
             return null;
           }
         },
         querystring: {}}).render();

       db.units.get_units_for_service = function() {
         return [{
           id: 1
         }];
       };

       // It triggers the "add unit" logic
       view._modifyUnits(3);
       assert.equal(1, db.notifications.size());

       // It triggers the "remove unit" logic
       view._modifyUnits(1);
       assert.equal(2, db.notifications.size());
     });

  it('should show notification for "remove_units" and "resolved" exceptions' +
      ' (unit view)', function()
     {
       var view = new views.unit(
       { container: viewContainer,
         getModelURL: function() {return 'my url';},
         db: db,
         env: {
           remove_units: function(param, callback) {
             callback(
             { err: true,
               unit_names: ['aaa']});
           },
           resolved: function(unit_name, relation_name, retry, callback) {
             callback(ERR_EV);
           }},
         unit: {},
         querystring: {}
       });

        // Used by "unit.js" inside the "render" function
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
          preventDefault: NO_OP
        });

        view.remove_panel.footerNode.one('.btn-danger').simulate('click');
        view.remove_panel.destroy();

        assert.equal(1, db.notifications.size());

        // Fake relation
        db.relations.getById = function() {
          return {name: ''};
        };

        view.retryRelation({
          preventDefault: NO_OP,

          // This is a mock object of the relation button
          target: {
            ancestor: function() {
              return {get: NO_OP};
            },
            set: NO_OP
          }
        });

        assert.equal(2, db.notifications.size());
      });

  it('should add a notification for "addRelation" exceptions (env view)',
      function() {
        var view = new views.environment({db: db, container: viewContainer});
        view.render();
        var module = view.topo.modules.MegaModule;
        // The callback wants to remove the pending relation from the db.
        db.relations.remove = NO_OP;
        // The _addRelationCallback args are: view, relation id, event.
        var args = [module, 'relation_id', ERR_EV];
        module.service_click_actions._addRelationCallback.apply(module, args);
        assert.equal(1, db.notifications.size());
      });

  it('should add a notification for "removeRelation" exceptions (env view)',
      function() {
        var view = new views.environment({db: db, container: viewContainer});
        view.render();
        var module = view.topo.modules.MegaModule;
        // The _removeRelationCallback args are: view, relation element,
        // relation id, confirm button, event.
        var args = [
          {get: function() {return {hide: NO_OP, destroy: NO_OP};},
           removeSVGClass: NO_OP
          }, {}, 'relation_id', {set: NO_OP}, ERR_EV
        ];
        module._removeRelationCallback.apply(module, args);
        assert.equal(1, db.notifications.size());
      });

  it('should add a notification for "destroyService" exceptions (env view)',
      function() {
        var view = new views.environment({db: db, container: viewContainer});
        view.render();
        var module = view.topo.modules.MegaModule;
        // The callback uses the 'getModelURL' attribute to retrieve the
        // service URL.
        module.set('getModelURL', NO_OP);
        // The _destroyCallback args are: service, view, confirm button, event.
        var args = [{}, module, {set: NO_OP}, ERR_EV];
        module.service_click_actions._destroyCallback.apply(module, args);
        assert.equal(1, db.notifications.size());
      });

  it('should show notification for "get_service" exceptions' +
      ' (service constraints view)', function() {

        var view = new views.service_constraints(
            { model:
             { getAttrs: NO_OP,
               get: function(key) {
                 if ('constraints' === key) {
                   return {};
                 }
                 return null;
               }},
              getModelURL: NO_OP,
              db: db,
              env:
                  { set_constraints: function(id, values, callback) {
                    callback(ERR_EV);
                  }},
              container: viewContainer}).render();

        view.updateConstraints();

        assert.equal(1, db.notifications.size());
      });

  it('should show notification for "get_service", "expose" and "unexpose"' +
      ' exceptions (service config view)', function() {

        var view = new views.service_config(
       { db: db,
         env: {
           set_config: function(id, newValues, callback) {
             callback(ERR_EV);
           },
           expose: function(id, callback) {
             callback(ERR_EV);
           },
           unexpose: function(id, callback) {
             callback({err: true, service_name: '1234'});
           }
         },
         getModelURL: NO_OP,
         model: {
           getAttrs: NO_OP,
           get: function(key) {
             if ('loaded' === key) {
               return true;
             }
             if ('config' === key) {
               return {};
             }
             return null;
           }},
         container: viewContainer});

        db.services.getById = NO_OP;
        db.charms.getById = function() {
          return {
            getAttrs: function() {
              return {};
            },
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
        assert.equal(1, db.notifications.size());

        view.exposeService();
        assert.equal(2, db.notifications.size());

        view.unexposeService();
        assert.equal(3, db.notifications.size());
      });

  it('should show notification for "remove_relation"' +
      ' exceptions (service relations view)', function() {

        var view = new views.service_relations(
       { db: db,
         env: {
           remove_relation: function(id, newValues, callback) {
             callback(ERR_EV);
           }
         },
         getModelURL: NO_OP,
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
          preventDefault: NO_OP,

          // This is a mock object of the relation button
          target: {
            ancestor: NO_OP,
            get: NO_OP
          }
        });
        view.remove_panel.footerNode.one('.btn-danger').simulate('click');
        view.remove_panel.destroy();

        assert.equal(1, db.notifications.size());
      });

  it('should show notification for "deploy" exceptions (charm view)',
      function() {
        var notified = false,
       db = {
         notifications: {
           add: function() {
             // This method should be called just once.
             assert.isFalse(notified);
             notified = true;
           }
         }
       },
       charm = {},
       container = {
         all: function() {
           return {each: NO_OP};
         },
         one: function() {
           return {get: NO_OP};
         }
       },
       env = {
         deploy: function(charmUrl, serviceName, config, callback) {
           callback(ERR_EV);
         }
       },
       mockView = {
         fire: NO_OP,
         _deployCallback: function() {
           // Executing the "views.charm.prototype._deployCallback"
           // function instead. The "views.charm.prototype._deployCallback"
           // is the one that will trigger the notification process.
           views.charm.prototype._deployCallback.apply(this, arguments);
         },
         get: function(key) {
           if ('charm' === key) {
             return charm;
           }
           if ('container' === key) {
             return container;
           }
           if ('db' === key) {
             return db;
           }
           if ('env' === key) {
             return env;
           }
           return null;
         }
       };

        views.charm.prototype.on_charm_deploy.apply(mockView, [ERR_EV]);
        assert.isTrue(notified);
      });

  it('should show errors for no unit, one unit and multiple ' +
      'units (service view)', function() {
        //_removeUnitCallback
        var mockView =
            { get: function(key) {
              return {
           getModelURL: NO_OP,
           db:
           { fire: NO_OP,
             notifications:
             { add: function(notification) {
               messages.push(notification.get('message'));
               titles.push(notification.get('title'));
             }}}}[key];
       }},
       messages = [],
       titles = [],
       baseView = new views.serviceBase({});

        baseView._removeUnitCallback.apply(mockView, [{
          err: true,
          unit_names: null
        }]);

        baseView._removeUnitCallback.apply(mockView, [{
          err: true,
          unit_names: []
        }]);

        baseView._removeUnitCallback.apply(mockView, [{
          err: true,
          unit_names: ['a']
        }]);

        baseView._removeUnitCallback.apply(mockView, [{
          err: true,
          unit_names: ['b', 'c']
        }]);

        function assertTrace(expected, trace) {
          assert.equal(expected.join(';'), trace.join(';'));
        }

        assertTrace(['Error removing unit', 'Error removing unit',
          'Error removing unit', 'Error removing units'], titles);
        assertTrace(['', '', 'Unit name: a', 'Unit names: b, c'], messages);
      });

});
