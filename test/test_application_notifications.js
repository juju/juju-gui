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
      'juju-tests-utils'],
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

  it('should show notification for "add_unit" exceptions', function() {
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
        }
      },
      model: {
        getAttrs: function() {},
        get: function(key) {
          if ('unit_count' === key) {
            return 1;
          }
          return null;
        }
      },
      querystring: {}
    }).render();

    view._modifyUnits(2);
    assert.equal(applicationContainer.one('#notify-indicator').getHTML().trim(),
        '1', 'The system didnt show the alert');
  });

});
