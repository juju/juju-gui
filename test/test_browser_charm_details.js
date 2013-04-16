'use strict';

(function() {

  describe('browser_charm_view', function() {
    var CharmView, models, node, view, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datatype-date',
          'datatype-date-format',
          'node-event-simulate',
          'juju-charm-models',
          'juju-charm-store',
          'node',
          'subapp-browser-charmview',
          function(Y) {
            views = Y.namespace('juju.browser.views');
            models = Y.namespace('juju.models');
            CharmView = views.BrowserCharmView;
            done();
          });
    });

    beforeEach(function() {
      var docBody = Y.one(document.body),
          testcontent = [
            '<div id=testcontent><div class="bws-view-data">',
            '</div></div>'
          ].join();

      Y.Node.create(testcontent).appendTo(docBody);

      // Mock out a dummy location for the Store used in view instances.
      window.juju_config = {
        charmworldURL: 'http://localhost'
      };
      node = Y.one('#testcontent');
    });

    afterEach(function() {
      if (view) {
        view.destroy();
      }
      node.remove(true);
      delete window.juju_config;
    });

    // Ensure the search results are rendered inside the container.
    it('should be able to locate a readme file', function() {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9'
        })
      });
      view._locateReadme().should.eql('readme.rst');

      // Matches for caps as well
      view.get('charm').set('files', [
        'hooks/install',
        'README.md'
      ]);
      view._locateReadme().should.eql('README.md');
    });


    it('should be able to display the readme content', function() {
      var fakeStore = new Y.juju.Charmworld0({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [{
                responseText: 'README content.'
              }]
            }
          });
        }
      });

      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9'
        }),
        container: Y.Node.create('<div class="charmview"/>'),
        store: fakeStore
      });

      view.render();
      Y.one('#bws-readme').get('text').should.eql('README content.');
    });

    // EVENTS
    it('should catch when the add control is clicked', function(done) {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install'
          ],
          id: 'precise/ceph-9'
        }),
        container: Y.Node.create('<div class="charmview"/>')
      });

      // Hook up to the callback for the click event.
      view._addCharmEnvironment = function(ev) {
        ev.halt();
        Y.one('#bws-readme h3').get('text').should.eql('Charm has no README');
        done();
      };

      view.render();
      node.one('.charm .add').simulate('click');
    });

    it('should load a file when a hook is selected', function() {
      var fakeStore = new Y.juju.Charmworld0({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [{
                responseText: 'install hook content.'
              }]
            }
          });
        }
      });

      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9'
        }),
        container: Y.Node.create('<div class="charmview"/>'),
        store: fakeStore
      });

      view.render();
      Y.one('#bws-hooks').all('select option').size().should.equal(3);

      // Select the hooks install and the content should update.
      Y.one('#bws-hooks').all('select option').item(2).set(
          'selected', 'selected');
      Y.one('#bws-hooks').one('select').simulate('change');

      var content = Y.one('#bws-hooks').one('div.filecontent');
      content.get('text').should.eql('install hook content.');
    });

    it('should be able to render markdown as html', function() {
      var fakeStore = new Y.juju.Charmworld0({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [{
                responseText: [
                  'README Header',
                  '============='
                ].join('\n')
              }]
            }
          });
        }
      });

      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'readme.md'
          ],
          id: 'precise/ceph-9'
        }),
        container: Y.Node.create('<div class="charmview"/>'),
        store: fakeStore
      });

      view.render();
      Y.one('#bws-readme').get('innerHTML').should.eql(
          '<h1>README Header</h1>');
    });

    it('should display the config data in the config tab', function() {
      var view = new CharmView({
        charm: new models.BrowserCharm({
          files: [],
          id: 'precise/ceph-9',
          options: {
            'client-port': {
              'default': 9160,
              'description': 'Port for client communcation',
              'type': 'int'
            }
          }
        }),
        container: Y.Node.create('<div class="charmview"/>')
      });
      view.render();

      Y.one('#bws-configuration dd div').get('text').should.eql(
          'Default: 9160');
      Y.one('#bws-configuration dd p').get('text').should.eql(
          'Port for client communcation');
    });

    it('_buildQAData properly summerizes the scores', function() {
      var view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'readme.md'
          ],
          id: 'precise/ceph-9'
        })
      });
      var data = Y.JSON.parse(Y.io('data/qa.json', {sync: true}).responseText);

      var processed = view._buildQAData(data);

      // We store a number of summary bits to help the template render the
      // scores correctly.
      processed.totalAvailable.should.eql(38);
      processed.totalScore.should.eql(13);
      processed.questions[0].score.should.eql(3);
    });

    it('qa content is loaded when the tab is clicked on', function(done) {
      var view = new CharmView({
        charm: new models.BrowserCharm({
          files: [],
          id: 'precise/ceph-9'
        }),
        container: Y.Node.create('<div class="charmview"/>')
      });
      view.render();

      view._loadQAContent = function() {
        // This test is just verifying that we don't timeout. The event fired,
        // was caught here, and we completed the test run. No assertion to be
        // found here.
        done();
      };

      var qa_tab = Y.one('.tabs li a.bws-qa');
      qa_tab.simulate('click');
    });

    it('does not blow up when the scores from the api is null', function() {
      var view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'readme.md'
          ],
          id: 'precise/ceph-9'
        })
      });
      var data = Y.JSON.parse(Y.io('data/qa.json', {sync: true}).responseText);
      // munge the data so that scores is null.
      data.scores = null;

      var processed = view._buildQAData(data);
      processed.totalAvailable.should.eql(38);
      processed.totalScore.should.eql(0);
    });

    it('should catch when the open log is clicked', function(done) {
      var data = Y.JSON.parse(
          Y.io('data/browsercharm.json', {sync: true}).responseText);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];
      var view = new CharmView({
        charm: new models.BrowserCharm(data),
        container: Y.Node.create('<div class="charmview"/>')
      });

      // Hook up to the callback for the click event.
      view._toggleLog = function(ev) {
        ev.halt();
        done();
      };

      view.render();
      node.one('.changelog .expand').simulate('click');
    });

    it('changelog is reformatted and displayed', function() {
      var fakeStore = new Y.juju.Charmworld0({});
      var data = Y.JSON.parse(
          Y.io('data/browsercharm.json', {sync: true}).responseText);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];
      view = new CharmView({
        charm: new models.BrowserCharm(data),
        container: Y.Node.create('<div class="charmview"/>')
      });

      view.render();
      // Basics that we have the right number of nodes.
      node.all('.remaining li').size().should.eql(9);
      node.all('.first p').size().should.eql(1);

      // The reminaing starts out hidden.
      assert(node.one('.changelog .remaining').hasClass('hidden'));
    });
  });

})();
