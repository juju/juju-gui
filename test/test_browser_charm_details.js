'use strict';

(function() {

  describe('browser_charm_view', function() {
    var container, CharmView, models, node, view, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datatype-date',
          'datatype-date-format',
          'node-event-simulate',
          'juju-charm-models',
          'juju-charm-store',
          'juju-tests-utils',
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
      container = Y.namespace('juju-tests.utils').makeContainer('container');
      var testcontent = [
        '<div id=testcontent><div class="bws-view-data">',
        '</div></div>'
      ].join();

      Y.Node.create(testcontent).appendTo(container);

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
      container.remove(true);
    });

    it('should be able to locate a readme file', function() {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
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

    it('can generate source and revno links from its charm', function() {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo'}
        })
      });
      var url = view._getSourceLink();
      assert.equal('http://bazaar.launchpad.net/~foo/files', url);
      assert.equal(
          'http://bazaar.launchpad.net/~foo/revision/1',
          view._getRevnoLink(url, 1));
    });

    it('can generate useful display data for commits', function() {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          code_source: {
            location: 'lp:~foo'
          }
        })
      });
      var revisions = [
        {
          authors: [{
            email: 'jdoe@example.com',
            name: 'John Doe'
          }],
          date: '2013-05-02T10:05:32Z',
          message: 'The fnord had too much fleem.',
          revno: 1
        },
        {
          authors: [{
            email: 'jdoe@example.com',
            name: 'John Doe'
          }],
          date: '2013-05-02T10:05:45Z',
          message: 'Fnord needed more fleem.',
          revno: 2
        }
      ];
      var commits = view._formatCommitsForHtml(
          revisions, view._getSourceLink());
      assert.equal(
          'http://bazaar.launchpad.net/~foo/revision/1',
          commits.first.revnoLink);
      assert.equal(
          'http://bazaar.launchpad.net/~foo/revision/2',
          commits.remaining[0].revnoLink);
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
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo'}
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
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
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


    it('_addCharmEnvironment displays the config panel', function(done) {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
        }),
        container: Y.Node.create('<div class="charmview"/>')
      });
      view.set('deploy', function(charm) {
        // The charm passed in is not a BrowserCharm but a charm-panel charm.
        var browserCharm = view.get('charm');
        assert.notDeepEqual(charm, browserCharm);
        var madeCharm = new models.Charm(browserCharm.getAttrs());
        assert.equal(charm.get('id'), madeCharm.get('id'));
        done();
      });
      view._addCharmEnvironment({halt: function() {}});
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
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
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
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
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
          code_source: { location: 'lp:~foo' },
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
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
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
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
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
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
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

    it('_getInterfaceIntroFlag sets the flag for no requires, no provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
              },
              'requires': {
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'noRequiresNoProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for no requires, 1 provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
                'foo': {}
              },
              'requires': {
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'noRequiresOneProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for no requires, many provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
                'foo': {},
                'two': {}
              },
              'requires': {
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'noRequiresManyProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for 1 requires, no provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
              },
              'requires': {
                'foo': {}
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'oneRequiresNoProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for 1 requires, 1 provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
                'foo': {}
              },
              'requires': {
                'foo': {}
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'oneRequiresOneProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for 1 requires, many provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
                'foo': {},
                'two': {}
              },
              'requires': {
                'foo': {}
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'oneRequiresManyProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for many requires, no provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
              },
              'requires': {
                'foo': {},
                'two': {}
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'manyRequiresNoProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for many requires, 1 provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
                'foo': {}
              },
              'requires': {
                'foo': {},
                'two': {}
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'manyRequiresOneProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for many requires, many provides',
        function() {
          var charm = new models.BrowserCharm({
            files: [],
            id: 'precise/ceph-9',
            relations: {
              'provides': {
                'foo': {},
                'two': {}
              },
              'requires': {
                'foo': {},
                'two': {}
              }
            }
          });
          var view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'manyRequiresManyProvides'));
        });

    it('displays a provider warning due to failed tests', function() {
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
      node.all('.provider-warning').size().should.eql(1);
      node.all('.provider-warning img').size().should.eql(4);
    });

    it('shows and hides an indicator', function(done) {
      var hit = 0;

      var fakeStore = new Y.juju.Charmworld0({});
      var data = Y.JSON.parse(
          Y.io('data/browsercharm.json', {sync: true}).responseText);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];
      view = new CharmView({
        charm: new models.BrowserCharm(data),
        container: Y.Node.create('<div class="charmview"/>')
      });

      view.showIndicator = function() {
        hit += 1;
      };
      view.hideIndicator = function() {
        hit += 1;
        hit.should.equal(2);
        done();
      };
      view.render();
    });
  });

})();
