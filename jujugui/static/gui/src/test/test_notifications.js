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

describe('notifications', function() {
  var Y, juju, models, views, nsRouter, logoNode, app;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-models',
      'juju-views',
      'juju-gui',
      'node-event-simulate',
      'juju-tests-utils',
      'ns-routing-app-extension',
      'environment-change-set'],

    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      logoNode = Y.Node.create('<div id="nav-brand-env"></div>');
      Y.one('body').append(logoNode);
      done();
    });
  });

  beforeEach(function() {
    nsRouter = Y.namespace('juju').Router('charmbrowser');
  });

  afterEach(function() {
    if (app) {
      app.destroy();
    }
  });

  after(function() {
    logoNode.destroy(true);
  });

  it('must be able to make notification and lists of notifications',
     function() {
       var note1 = new models.Notification({
             title: 'test1',
             message: 'Hello'
           }),
           note2 = new models.Notification({
             title: 'test2',
             message: 'I said goodnight!'
           }),
           notifications = new models.NotificationList();

       notifications.add([note1, note2]);
       notifications.size().should.equal(2);

        // timestamp should be generated once
       var ts = note1.get('timestamp');
       note1.get('timestamp').should.equal(ts);
        // force an update so we can test ordering
        // fast execution can result in same timestamp
       note2.set('timestamp', ts + 1);
       note2.get('timestamp').should.be.above(ts);

        // defaults as expected
       note1.get('level').should.equal('info');
       note2.get('level').should.equal('info');
        // the sort order on the list should be by
        // timestamp
       notifications.get('title').should.eql(['test2', 'test1']);
     });

  it('must be able to render its view with sample data', function() {
    /* jshint -W031 */
    new models.Notification({
      title: 'test1', message: 'Hello'});
    new models.Notification({
      title: 'test2', message: 'I said goodnight!'});
    /* jshint +W031 */
    var notifications = new models.NotificationList(),
        container = Y.Node.create('<div id="test">'),
        env = new juju.environments.GoEnvironment(),
        view = new views.NotificationsView({
          container: container,
          notifications: notifications,
          env: env,
          nsRouter: nsRouter});
    view.render();
    // Verify the expected elements appear in the view
    container.one('.dropdown').should.not.equal(undefined);
    container.destroy();
  });

  it('should be marked populated when an error is notified', function() {
    var notifications = new models.NotificationList();
    notifications.add({title: 'mytitle', level: 'error'});
    var container = Y.Node.create('<div id="test">');
    var env = new juju.environments.GoEnvironment();
    var view = new views.NotificationsView({
      container: container,
      notifications: notifications,
      env: env,
      nsRouter: nsRouter
    });
    view.render();
    var indicator = container.one('#notify-indicator');
    assert.equal(indicator.hasClass('populated'), true);
    container.destroy();
  });

  it('must be able to limit the size of notification events',
     function() {
       var note1 = new models.Notification({
             title: 'test1',
             message: 'Hello'
           }),
           note2 = new models.Notification({
             title: 'test2',
             message: 'I said goodnight!'
           }),
           note3 = new models.Notification({
             title: 'test3',
             message: 'Never remember'
           }),
           notifications = new models.NotificationList({
             max_size: 2
           });

       notifications.add([note1, note2]);
       notifications.size().should.equal(2);

       // Adding a new notification should pop the oldest from the list (we
       // exceed max_size)
       notifications.add(note3);
       notifications.size().should.equal(2);
       notifications.get('title').should.eql(['test3', 'test2']);
     });

  it('must be able to get notifications for a given model', function() {
    var m = new models.Service({id: 'mediawiki'}),
        note1 = new models.Notification({
          title: 'test1',
          message: 'Hello',
          modelId: m
        }),
        note2 = new models.Notification({
          title: 'test2',
          message: 'I said goodnight!'
        }),
        notifications = new models.NotificationList();

    notifications.add([note1, note2]);
    notifications.size().should.equal(2);
    notifications.getNotificationsForModel(m).should.eql(
       [note1]);
  });

  it('must be able to evict irrelevant notices', function() {
    var container = Y.Node.create(
        '<div id="test" class="container"></div>'),
        conn = new(Y.namespace('juju-tests.utils')).SocketStub(),
        ecs = new juju.EnvironmentChangeSet(),
        env = new juju.environments.GoEnvironment({conn: conn, ecs: ecs});
    app = new Y.juju.App({
      env: env,
      container: container,
      viewContainer: container
    });
    app.navigate = function() { return; };
    app.showView(new Y.View());
    env.connect();
    this._cleanups.push(env.close.bind(env));

    var notifications = app.db.notifications,
        view = new views.NotificationsView({
          container: container,
          notifications: notifications,
          env: app.env,
          nsRouter: nsRouter}).render();

    notifications.add([{
      title: 'title1',
      message: 'message1',
      level: 'info'
    }, {
      title: 'title2',
      message: 'message2',
      level: 'error'
    }]);

    notifications.size().should.equal(2);
    // we have one unit in error
    view.getShowable().length.should.equal(1);
    // Add another notification to the database.
    notifications.add({
      title: 'title3',
      message: 'message3',
      level: 'info'
    });

    notifications.size().should.equal(3);
    view.getShowable().length.should.equal(1);
  });
});


describe('changing notifications to words', function() {
  var juju;

  before(function(done) {
    YUI(GlobalConfig).use(
        ['juju-notification-controller'],
        function(Y) {
          juju = Y.namespace('juju');
          done();
        });
  });

  it('should correctly translate notification operations into English',
     function() {
       assert.equal(juju._changeNotificationOpToWords('add'), 'created');
       assert.equal(juju._changeNotificationOpToWords('remove'), 'removed');
       assert.equal(juju._changeNotificationOpToWords('not-an-op'), 'changed');
     });
});

describe('relation notifications', function() {
  var juju;

  before(function(done) {
    YUI(GlobalConfig).use(
        ['juju-notification-controller'],
        function(Y) {
          juju = Y.namespace('juju');
          done();
        });
  });

  it('should produce reasonable titles', function() {
    assert.equal(
        juju._relationNotifications.title(undefined, 'add'),
        'Relation created');
    assert.equal(
        juju._relationNotifications.title(undefined, 'remove'),
        'Relation removed');
  });

  it('should generate messages about two-party relations', function() {
    var changeData =
        { endpoints:
              [['endpoint0', {name: 'relation0'}],
                ['endpoint1', {name: 'relation1'}]]};
    assert.equal(
        juju._relationNotifications.message(undefined, 'add', changeData),
        'Relation between endpoint0 (relation type "relation0") and ' +
        'endpoint1 (relation type "relation1") was created');
  });

  it('should generate messages about one-party relations', function() {
    var changeData =
        { endpoints:
              [['endpoint1', {name: 'relation1'}]]};
    assert.equal(
        juju._relationNotifications.message(undefined, 'add', changeData),
        'Relation with endpoint1 (relation type "relation1") was created');
  });
});

describe('notification visual feedback', function() {
  var env, models, notifications, notificationsView, notifierBox, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use('juju-models', 'juju-views', 'juju-notifications',
        function(Y) {
          var juju = Y.namespace('juju');
          env = new juju.environments.GoEnvironment();
          models = Y.namespace('juju.models');
          views = Y.namespace('juju.views');
          done();
        });
  });

  // Instantiate the notifications model list and view.
  // Also create the notifier box and attach it as first element of the body.
  beforeEach(function() {
    notifications = new models.NotificationList();
    notificationsView = new views.NotificationsView({
      env: env,
      notifications: notifications,
      nsRouter: {
        url: function() { return; }
      }
    });
    var wrapper = Y.Node.create('<div class="notifications-nav"></div>');
    notifierBox = Y.Node.create('<div class="notifier-box"></div>');
    notifierBox.setStyle('display', 'none');
    wrapper.append(notifierBox);
    Y.one('body').prepend(wrapper);
  });

  // Destroy the notifier box created in beforeEach.
  afterEach(function() {
    notifierBox.remove();
    notifierBox.destroy(true);
  });

  after(function() {
    notifications.destroy(true);
    notificationsView.destroy(true);
  });

  // Assert the notifier box contains the expectedNumber of notifiers.
  var assertNumNotifiers = function(expectedNumber) {
    assert.equal(notifierBox.get('children').size(), expectedNumber);
  };

  it('should appear when a new error is notified', function() {
    notifications.add({title: 'mytitle', level: 'error'});
    assertNumNotifiers(1);
  });

  it('should only appear when the DOM contains the notifier box', function() {
    notifierBox.remove();
    notifications.add({title: 'mytitle', level: 'error'});
    assertNumNotifiers(0);
  });

  it('should not appear when the notification is not an error', function() {
    notifications.add({title: 'mytitle', level: 'info'});
    assertNumNotifiers(0);
  });

  it('should not appear when the notification comes form delta', function() {
    notifications.add({title: 'mytitle', level: 'error', isDelta: true});
    assertNumNotifiers(0);
  });

});
