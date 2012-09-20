'use strict';

describe('notifications', function () {
    var Y, juju, models, views;

    before(function (done) {
        Y = YUI(GlobalConfig).use([
            'juju-models',
            'juju-views',
            'juju-gui',
            'juju-env',
            'juju-tests-utils'],

        function (Y) {
            juju = Y.namespace('juju');
            models = Y.namespace('juju.models');
            views = Y.namespace('juju.views');
            done();
        });
    });

    it('must be able to make notification and lists of notifications',
       function () {
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

    it('must be able to render its view with sample data',
       function () {
           var note1 = new models.Notification({
                   title: 'test1', message: 'Hello'}),
           note2 = new models.Notification({
                   title: 'test2', message: 'I said goodnight!'}),
           notifications = new models.NotificationList(),

           container = Y.Node.create('<div id="test">'),
           env = new juju.Environment(),
           view = new views.NotificationsView({
                   container: container, 
                   notifications: notifications, 
                   env: env});
           view.render();
           // Verify the expected elements appear in the view
           container.one('#notify-list').should.exist;
           container.destroy();
       });

    it('must be able to limit the size of notification events', 
       function () {
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

           // Adding a new notification should pop the oldest from the list (we exceed max_size)
           notifications.add(note3);
           notifications.size().should.equal(2);
           notifications.get('title').should.eql(['test3', 'test2']);
       });
             
    it('must be able to get notifications for a given model',
       function() {
           var m = new models.Service({id: "mediawiki"}),
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

    it('must be able to include and show object links', function () {
           var container = Y.Node.create('<div id="test">'),
           env = new juju.Environment(),
           app = new Y.juju.App({env: env, container: container}),
           db = app.db,
           mw = db.services.create({id: 'mediawiki', 
                                    name: 'mediawiki'}),
           notifications = db.notifications,
           view = new views.NotificationsOverview({
                      container: container,
                      notifications: notifications,
                      app: app,
                      env: env}).render();
           // we use overview here for testing as it defaults 
           // to showing all notices

           // we can use app's routing table to derive a link
           notifications.create({title: 'Service Down',
                                 message: 'Your service has an error',
                                 link: app.getModelURL(mw)
                                });
           view.render();
           var link = container.one('.notice').one('a');
           link.getAttribute('href').should.equal(
               '/service/mediawiki/');
           link.getHTML().should.contain('View Details');


           // create a new notice passing the link_title
           notifications.create({title: 'Service Down',
                                 message: 'Your service has an error',
                                 link: app.getModelURL(mw),
                                 link_title: 'Resolve this'
                                });
           view.render();
           link = container.one('.notice').one('a');
           link.getAttribute('href').should.equal(
               '/service/mediawiki/');
           link.getHTML().should.contain('Resolve this');
       });

    it('must be able to evict irrelevant notices', function () {
           var container = Y.Node.create(
               '<div id="test" class="container"></div>'),
           app = new Y.juju.App({
                                    container: container,
                                    viewContainer: container
                                });
           var environment_delta = {
               'result': [
                   ['service', 'add', {
                        'charm': 'cs:precise/wordpress-6', 
                        'id': 'wordpress', 
                        'exposed': false
                    }], ['service', 'add', {
                             'charm': 'cs:precise/mediawiki-3',
                             'id': 'mediawiki',
                             'exposed': false
                         }], ['service', 'add', {
                                  'charm': 'cs:precise/mysql-6',
                                  'id': 'mysql'
                              }], ['relation', 'add', {
                                       'interface': 'reversenginx',
                                       'scope': 'global',
                                       'endpoints': [
                                           ['wordpress', {
                                                'role': 'peer',
                                                'name': 'loadbalancer'
                                            }]
                                       ],
                                       'id': 'relation-0000000000'
                                   }], 
                   ['relation', 'add', {
                        'interface': 'mysql',
                        'scope': 'global',
                        'endpoints': [
                            ['mysql', {
                                 'role': 'server',
                                 'name': 'db'
                             }],
                            ['wordpress', 
                             {'role': 'client', 'name': 'db'}]],
                        'id': 'relation-0000000001'
                    }], ['machine', 'add', {
                             'agent-state': 'running',
                             'instance-state': 'running',
                             'id': 0,
                             'instance-id': 'local',
                             'dns-name': 'localhost'
                         }], ['unit', 'add', {
                                  'machine': 0,
                                  'agent-state': 'started',
                                  'public-address': '192.168.122.113',
                                  'id': 'wordpress/0'
                              }], ['unit', 'add', {
                                       'machine': 0,
                                       'agent-state': 'error',
                                       'public-address': '192.168.122.222',
                                       'id': 'mysql/0'
                                   }]],
               'op': 'delta'
           };

           var notifications = app.db.notifications,
           view = new views.NotificationsView({
                      container: container,
                      notifications: notifications,
                      app: app,
                      env: app.env}).render();


           app.env.dispatch_result(environment_delta);


           notifications.size().should.equal(7);
           // we have one unit in error
           view.get_showable().length.should.equal(1);

           // now fire another delta event marking that node as
           // started
           console.groupCollapsed("Dispatch evicting model");
           app.env.dispatch_result({result: [['unit', 'change', {
                                                  'machine': 0,
                                                  'agent-state': 'started',
                                                  'public-address': '192.168.122.222',
                                                  'id': 'mysql/0'
                                              }]], op: 'delta'});
           console.groupEnd();
           notifications.size().should.equal(8);
           // This should have evicted the prior notice from seen
           view.get_showable().length.should.equal(0);


       });


});
