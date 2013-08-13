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

(function() {

  describe('browser_charm_view', function() {
    var container, CharmView, cleanIconHelper, models, node, utils, view,
        views, Y;


    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datatype-date',
          'datatype-date-format',
          'json-stringify',
          'juju-charm-models',
          'juju-charm-store',
          'juju-tests-utils',
          'node',
          'node-event-simulate',
          'subapp-browser-charmview',
          function(Y) {
            views = Y.namespace('juju.browser.views');
            models = Y.namespace('juju.models');
            utils = Y.namespace('juju-tests.utils');
            CharmView = views.BrowserCharmView;
            cleanIconHelper = utils.stubCharmIconPath();
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

    after(function() {
      cleanIconHelper();
    });

    it('renders for inspector mode correctly', function() {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.charm.files = [];
      view = new CharmView({
        charm: new models.BrowserCharm(data.charm),
        container: utils.makeContainer(),
        forInspector: true
      });

      view.render();
      assert.isNull(view.get('container').one('.heading'));
    });

    // Return the charm heading node included in the charm detail view.
    var makeHeading = function(is_subordinate) {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.charm.files = [];
      data.charm.is_subordinate = is_subordinate;
      view = new CharmView({
        charm: new models.BrowserCharm(data.charm),
        container: utils.makeContainer()
      });
      view.render();
      var heading = view.get('container').one('.heading');
      assert.isNotNull(heading);
      return heading;
    };

    it('avoids showing the subordinate message for non-subordinate charms',
       function() {
         var heading = makeHeading(false);
         assert.notInclude(heading.getContent(), 'Subordinate charm');
       });

    it('shows the subordinate message if the charm is a subordinate',
       function() {
         var heading = makeHeading(true);
         assert.include(heading.getContent(), 'Subordinate charm');
       });

    it('renders local charms for inspector mode correctly', function() {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.charm.files = [];
      data.charm.url = 'local:precise/apache2-10';
      var charm = new models.BrowserCharm(data.charm);
      charm.set('scheme', 'local');
      view = new CharmView({
        charm: charm,
        container: utils.makeContainer(),
        forInspector: true
      });

      view.render();
      assert.isNull(view.get('container').one('.heading'));
      assert.isNull(view.get('container').one('#bws-readme'));
      assert.isNull(view.get('container').one('#bws-configuration'));
      assert.isNull(view.get('container').one('#bws-code'));
      assert.isNull(view.get('container').one('#bws-features'));
    });

    it('has sharing links', function() {
      var fakeStore = new Y.juju.Charmworld2({});
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
        container: utils.makeContainer(),
        store: fakeStore
      });
      view.render();
      var links = container.all('#sharing a');
      assert.equal(links.size(), 3);
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
      var fakeStore = new Y.juju.Charmworld2({});
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
        activeTab: '#bws-readme',
        charm: new models.BrowserCharm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo'}
        }),
        container: utils.makeContainer(),
        store: fakeStore
      });

      view.render();

      Y.one('#bws-readme').get('text').should.eql('README content.');
    });

    // EVENTS
    it('should catch when the add control is clicked', function(done) {
      view = new CharmView({
        activeTab: '#bws-readme',
        charm: new models.BrowserCharm({
          files: [
            'hooks/install'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
        }),
        container: utils.makeContainer()
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
      var fakeStore = new Y.juju.Charmworld2({});
      fakeStore.iconpath = function() {
        return 'charm icon url';
      };
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install'
          ],
          id: 'precise/ceph-9',
          url: 'cs:precise/ceph-9',
          code_source: { location: 'lp:~foo' },
          options: {
            configName: 'test'
          }
        }),
        container: utils.makeContainer(),
        store: fakeStore
      });
      view.set('deploy', function(charm, serviceAttrs) {
        // The charm passed in is not a BrowserCharm but a charm-panel charm.
        var browserCharm = view.get('charm');
        assert.notDeepEqual(charm, browserCharm);
        var madeCharm = new models.Charm(browserCharm.getAttrs());
        assert.equal(charm.get('id'), madeCharm.get('url'));
        assert.equal(serviceAttrs.icon, 'charm icon url');
        done();
      });
      view._addCharmEnvironment({halt: function() {}});
    });

    it('should load a file when a hook is selected', function() {
      var fakeStore = new Y.juju.Charmworld2({});
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
        container: utils.makeContainer(),
        store: fakeStore
      });

      view.render();
      Y.one('#bws-code').all('select option').size().should.equal(3);

      // Select the hooks install and the content should update.
      Y.one('#bws-code').all('select option').item(2).set(
          'selected', 'selected');
      Y.one('#bws-code').one('select').simulate('change');

      var content = Y.one('#bws-code').one('div.filecontent');
      content.get('text').should.eql('install hook content.');
    });

    it('should be able to render markdown as html', function() {
      var fakeStore = new Y.juju.Charmworld2({});
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
        activeTab: '#bws-readme',
        charm: new models.BrowserCharm({
          files: [
            'readme.md'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
        }),
        container: utils.makeContainer(),
        store: fakeStore
      });

      view.render();
      Y.one('#bws-readme').get('innerHTML').should.eql(
          '<h1>README Header</h1>');
    });

    it('should display the config data in the config tab', function() {
      view = new CharmView({
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
        container: utils.makeContainer()
      });
      view.render();

      Y.one('#bws-configuration dd div').get('text').should.eql(
          'Default: 9160');
      Y.one('#bws-configuration dd p').get('text').should.eql(
          'Port for client communcation');
    });

    it('_buildQAData properly summerizes the scores', function() {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'readme.md'
          ],
          id: 'precise/ceph-9',
          is_approved: true,
          code_source: { location: 'lp:~foo' }
        })
      });
      var data = utils.loadFixture('data/qa.json', true);
      var processed = view._buildQAData(data);

      // We store a number of summary bits to help the template render the
      // scores correctly.
      processed.totalAvailable.should.eql(38);
      processed.totalScore.should.eql(13);
      processed.questions[0].score.should.eql(3);
      assert.ok(processed.charm.is_approved);

    });

    it('does not blow up when the scores from the api is null', function() {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'readme.md'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
        })
      });
      var data = utils.loadFixture('data/qa.json', true);
      // munge the data so that scores is null.
      data.scores = null;

      var processed = view._buildQAData(data);
      processed.totalAvailable.should.eql(38);
      processed.totalScore.should.eql(0);
    });

    it('does not display qa data when there is none.', function() {
      var data = utils.loadFixture('data/qa.json', true);
      var testContainer = utils.makeContainer();
      // munge the data so that scores is null.
      data.scores = null;
      var fakedata = Y.JSON.stringify(data);

      var fakeStore = new Y.juju.Charmworld2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [{
                responseText: fakedata
              }]
            }
          });
        }
      });

      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
        }),
        renderTo: testContainer,
        store: fakeStore
      });

      view.render();
      // Force the loading of the qa div.
      view._loadQAContent();

      // Because we have no score, we get the alternate content. This charm is
      // not approved/reviewed so we get the content explaining it will not
      // have quality data.
      var foundNode = view.get('container').one('.no-qa-unreviewed');
      assert.ok(foundNode);

      // Change the charm to be reviewed/approved and verify we hit the other
      // message while not showing quality scores.
      view.get('charm').set('is_approved', true);
      // Force the loading of the qa div.
      view._loadQAContent();
      foundNode = view.get('container').one('.no-qa-reviewed');
      assert.ok(foundNode);
      // Little cleanup.
      testContainer.remove(true);
    });

    it('should catch when the open log is clicked', function(done) {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.charm.files = [];
      view = new CharmView({
        charm: new models.BrowserCharm(data.charm),
        container: utils.makeContainer()
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
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.charm.files = [];
      view = new CharmView({
        charm: new models.BrowserCharm(data.charm),
        container: utils.makeContainer()
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
          view = new CharmView({
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
          view = new CharmView({
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
          view = new CharmView({
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
          view = new CharmView({
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
          view = new CharmView({
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
          view = new CharmView({
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
          view = new CharmView({
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
          view = new CharmView({
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
          view = new CharmView({
            charm: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'manyRequiresManyProvides'));
        });

    it('displays a provider warning due to failed tests', function() {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.charm.files = [];
      // Add a failing test to the charm data.
      data.charm.tested_providers = {
        'ec2': 'FAILURE',
        'local': 'SUCCESS',
        'openstack': 'FAILURE'
      };

      view = new CharmView({
        charm: new models.BrowserCharm(data.charm),
        container: utils.makeContainer()
      });

      view.render();
      // Basics that we have the right number of nodes.
      node.all('.providers .successes li').size().should.eql(1);
      node.all('.providers .failures li').size().should.eql(2);
    });

    it('shows and hides an indicator', function(done) {
      var hit = 0;

      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.charm.files = [];
      view = new CharmView({
        charm: new models.BrowserCharm(data.charm),
        container: utils.makeContainer()
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

    it('selects the proper tab when given one', function() {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.charm.files = [];

      view = new CharmView({
        activeTab: '#bws-configuration',
        charm: new models.BrowserCharm(data.charm),
        container: utils.makeContainer()
      });

      view.render();

      // We've selected the activeTab specified.
      var selected = view.get('container').one('.yui3-tab-selected a');
      assert.equal(selected.getAttribute('href'), '#bws-configuration');
    });

    it('renders out the related charms correctly', function(done) {
      var data = utils.loadFixture('data/browsercharm.json', true).charm;
      var testContainer = utils.makeContainer();
      // We don't want any files so we don't have to mock/load them.
      data.files = [];

      var fakeStore = new Y.juju.Charmworld2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [{
                responseText: utils.loadFixture('data/related.json')
              }]
            }
          });
        }
      });

      view = new CharmView({
        charm: new models.BrowserCharm(data),
        isFullscreen: true,
        renderTo: testContainer,
        store: fakeStore
      });
      view.render();

      // We've selected the activeTab specified.
      var tokens = view.get('container').all('.charm-token');
      assert.equal(tokens.size(), 5);

      // And clicking on one of those charms navigates correctly.
      view.on('viewNavigate', function(ev) {
        ev.halt();
        // Just make sure we've got an id. The order will vary some depending
        // on the browser due to many charms with the same score of 10 in the
        // sample data..
        assert(ev.change.charmID);
        assert.isTrue(view.loadedRelatedCharms);
        testContainer.remove(true);
        done();
      });
      view.get('container').one('.charm-token').simulate('click');
    });

    it('loads related charms when interface tab selected', function() {
      var data = utils.loadFixture('data/browsercharm.json', true).charm;
      var testContainer = utils.makeContainer();
      // We don't want any files so we don't have to mock/load them.
      data.files = [];

      var fakeStore = new Y.juju.Charmworld2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [{
                responseText: utils.loadFixture('data/related.json')
              }]
            }
          });
        }
      });

      view = new CharmView({
        activeTab: '#bws-related-charms',
        charm: new models.BrowserCharm(data),
        isFullscreen: true,
        renderTo: testContainer,
        store: fakeStore
      });
      view.render();

      assert.equal(
          testContainer.all('#bws-related-charms .charm-token').size(),
          9);
      assert.isTrue(view.loadedRelatedInterfaceCharms);
    });

    it('only loads the interface data once', function() {
      var data = utils.loadFixture('data/browsercharm.json', true).charm;
      var testContainer = utils.makeContainer();
      // We don't want any files so we don't have to mock/load them.
      data.files = [];

      var fakeStore = new Y.juju.Charmworld2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [{
                responseText: utils.loadFixture('data/related.json')
              }]
            }
          });
        }
      });

      view = new CharmView({
        activeTab: '#bws-related-charms',
        charm: new models.BrowserCharm(data),
        isFullscreen: true,
        renderTo: testContainer,
        store: fakeStore
      });

      var origLoadRelatedCharms = view._loadRelatedCharms;
      var state = {
        loadCount: 0,
        hitTabRender: false,
        hitRelatedRender: false
      };
      view._loadRelatedCharms = function(callback) {
        state.loadCount += 1;
        origLoadRelatedCharms.call(view, callback);
      };
      view._renderRelatedInterfaceCharms = function() {
        state.hitTabRender = true;
      };
      view._renderRelatedCharms = function() {
        state.hitRelatedRender = true;
      };
      view.render();

      assert.equal(state.loadCount, 1);
      assert(state.hitTabRender);
      assert(state.hitRelatedRender);
    });

    it('ignore invalid tab selections', function() {
      var data = utils.loadFixture('data/browsercharm.json', true).charm;
      var testContainer = utils.makeContainer();
      // We don't want any files so we don't have to mock/load them.
      data.files = [];

      var fakeStore = new Y.juju.Charmworld2({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          // Stubbing the server callback value
          params.callback.success({
            response: {
              results: [{
                responseText: utils.loadFixture('data/related.json')
              }]
            }
          });
        }
      });

      view = new CharmView({
        activeTab: '#bws-does-not-exist',
        charm: new models.BrowserCharm(data),
        isFullscreen: true,
        renderTo: testContainer,
        store: fakeStore
      });
      view.render();

      assert.equal(
          testContainer.one('.yui3-tab-selected a').getAttribute('href'),
          '#bws-summary');
    });

  });

})();
