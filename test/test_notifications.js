'use strict';

describe('notifications', function() {
    var Y, juju, models, views;

    before(function (done) {
        Y = YUI(GlobalConfig).use([
            'juju-models', 
            'juju-views', 
            'juju-env'], 
        function (Y) {
            juju = Y.namespace('juju');
            models = Y.namespace('juju.models');
            views = Y.namespace('juju.views');
            done();
        });
    });

    it('must be able to make notification and lists of notifications', 
      function() {
          var note1 = new models.Notification({title: 'test1',
                                              message: 'Hello'
                                              }),
          note2 = new models.Notification({title: 'test2',
                                           message: 'I said goodnight!'}),
          nl = new models.NotificationList();

          nl.add([note1, note2]);
          nl.size().should.equal(2);
          
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
          note1.get('seen').should.equal(false);
          note2.get('seen').should.equal(false);
       
          // the sort order on the list should be by 
          // timestamp
          nl.sort();
          nl.get('title').should.eql(['test2', 'test1']);
      });

    it('must be able to track unseen messsages and levels', function(){
          var note1 = new models.Notification({title: 'test1',
                                               message: 'Hello',
                                               seen: true
                                              }),
          note2 = new models.Notification({title: 'test2',
                                           level: 'error',
                                           message: 'I said goodnight!'}),
          nl = new models.NotificationList();

          nl.add([note1, note2]);
          nl.size().should.equal(2);
          nl.get_unseen_count().should.equal(1);
          nl.get_notice_levels().should.eql({error: 1, info: 1});
        
    });

    it('must be able to render its view with sample data', 
      function() {
          var note1 = new models.Notification({title: 'test1',
                                              message: 'Hello'
                                              }),
          note2 = new models.Notification({title: 'test2',
                                           message: 'I said goodnight!'}),
          nl = new models.NotificationList(),

          container = Y.Node.create('<div id="test">'),
          env = new juju.Environment({socket_url: 'ws://localhost:8081'}),
          view = new views.NotificationsView({container: container,
                                              model_list: nl,
                                              env: env
                                             });
          view.render();
          // Verify the expected elements appear in the view
          container.one('#notify-list').should.exist;
          container.destroy();
    });

    it('must be able to limit the size of notification events', function(){
          var note1 = new models.Notification({title: 'test1', message: 'Hello'}),
          note2 = new models.Notification({title: 'test2', message: 'I said goodnight!'}),
          note3 = new models.Notification({title: 'test3', message: 'Never remember'}),
          nl = new models.NotificationList({max_size: 2});
          nl.add([note1, note2]);
          nl.size().should.equal(2);
           
           // Adding a new notification should pop the oldest from the list (we exceed max_size)
           nl.add(note3);
           nl.size().should.equal(2);
           nl.get("title").should.eql(['test3', 'test2']);
    });
});