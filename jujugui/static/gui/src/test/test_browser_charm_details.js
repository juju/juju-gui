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

  describe('Browser charm view', function() {
    var container, CharmView, cleanIconHelper, factory, models, node, utils,
        view, views, Y, testContainer;


    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datatype-date',
          'datatype-date-format',
          'charmstore-api',
          'json-stringify',
          'juju-charm-models',
          'juju-tests-utils',
          'juju-tests-factory',
          'node',
          'node-event-simulate',
          'subapp-browser-charmview',
          function(Y) {
            views = Y.namespace('juju.browser.views');
            models = Y.namespace('juju.models');
            utils = Y.namespace('juju-tests.utils');
            factory = Y.namespace('juju-tests.factory');
            CharmView = views.BrowserCharmView;
            cleanIconHelper = utils.stubCharmIconPath();
            done();
          });
    });

    beforeEach(function() {
      window.flags = {};
      container = utils.makeContainer(this, 'container');
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
      window.flags = {};
      if (view) {
        view.destroy();
      }
      if (testContainer) {
        testContainer.remove(true);
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
      data.files = [];
      view = new CharmView({
        entity: new models.Charm(data),
        container: utils.makeContainer(this),
        forInspector: true
      });

      view.render();
      assert.isNull(view.get('container').one('.heading'));
      // There is no 'related charms' tab to display.
      assert.equal(view.get('container').all('.related-charms').size(), 0);
    });

    // Return the charm heading node included in the charm detail view.
    var makeHeading = function(context, is_subordinate) {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];
      data.is_subordinate = is_subordinate;
      utils.makeContainer(context);
      view = new CharmView({
        entity: new models.Charm(data),
        container: utils.makeContainer(context)
      });
      view.render();
      var heading = view.get('container').one('.header');
      assert.isNotNull(heading);
      return heading;
    };

    it('avoids showing the subordinate message for non-subordinate charms',
       function() {
         var heading = makeHeading(this, false);
         assert.notInclude(heading.getContent(), 'Subordinate charm');
       });

    it('shows the subordinate message if the charm is a subordinate',
       function() {
         var heading = makeHeading(this, true);
         assert.include(heading.getContent(), 'Subordinate charm');
       });

    it('renders local charms for inspector mode correctly', function() {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];
      data.url = 'local:precise/apache2-10';
      var charm = new models.Charm(data);
      charm.set('scheme', 'local');
      view = new CharmView({
        entity: charm,
        container: utils.makeContainer(this),
        forInspector: true
      });

      view.render();
      assert.isNull(view.get('container').one('.heading'));
      assert.isNull(view.get('container').one('#readme'));
      assert.isNull(view.get('container').one('#configuration'));
      assert.isNull(view.get('container').one('#code'));
      assert.isNull(view.get('container').one('#features'));
    });

    it('has sharing links', function() {
      view = new CharmView({
        entity: new models.Charm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/wordpress',
          code_source: { location: 'lp:~foo'}
        }),
        container: utils.makeContainer(this),
        charmstore: factory.makeFakeCharmstore()
      });
      view.render();
      var links = container.all('#sharing a');
      assert.equal(links.size(), 3);
    });

    it('should be able to locate a readme file', function() {
      view = new CharmView({
        entity: new models.Charm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
        })
      });
      view._locateReadme().should.eql('readme.rst');

      // Matches for caps as well.
      view.get('entity').set('files', [
        'hooks/install',
        'README.md'
      ]);
      view._locateReadme().should.eql('README.md');
    });

    it('can generate source, bug, and revno links from its charm', function() {
      view = new CharmView({
        entity: new models.Charm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          name: 'ceph',
          code_source: { location: 'lp:~foo'}
        })
      });
      var url = view._getSourceLink(
          view.get('entity').get('code_source').location);
      assert.equal('http://bazaar.launchpad.net/~foo/files', url);
      assert.equal(
          'http://bazaar.launchpad.net/~foo/revision/1',
          view._getRevnoLink(url, 1));
      assert.equal(
          'https://bugs.launchpad.net/charms/+source/ceph',
          view._getBugLink(view.get('entity').get('name')));
    });

    it('excludes source svg files from the source tab', function() {
      view = new CharmView({
        entity: new models.Charm({
          files: [
            'hooks/install',
            'icon.svg',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo'}
        }),
        container: utils.makeContainer(this)
      });
      view.render();
      var options = Y.one('#code').all('select option');
      assert.equal(options.size(), 3);
      assert.deepEqual(
          options.get('text'),
          ['Select --', 'readme.rst', 'hooks/install']);
    });

    it('can generate useful display data for commits', function() {
      view = new CharmView({
        entity: new models.Charm({
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
      var url = view._getSourceLink(
          view.get('entity').get('code_source').location);
      var commits = view._formatCommitsForHtml(revisions, url);
      assert.equal(
          'http://bazaar.launchpad.net/~foo/revision/1',
          commits.first.revnoLink);
      assert.equal(
          'http://bazaar.launchpad.net/~foo/revision/2',
          commits.remaining[0].revnoLink);
    });

    it('should be able to display the readme content', function() {
      view = new CharmView({
        activeTab: '#readme',
        entity: new models.Charm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo'}
        }),
        container: utils.makeContainer(this),
        charmstore: {
          getFile: function(url, filename, success, failure) {
            success({
              target: {
                responseText: 'README content.'
              }
            });
          }
        }
      });

      view.render();

      Y.one('#readme').get('text').should.eql('README content.');
    });

    // EVENTS
    it('should catch when the add control is clicked', function(done) {
      view = new CharmView({
        activeTab: '#readme',
        entity: new models.Charm({
          files: [
            'hooks/install'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
        }),
        container: utils.makeContainer(this)
      });

      // Hook up to the callback for the click event.
      view._addCharmEnvironment = function(ev) {
        ev.halt();
        Y.one('#readme h3').get('text').should.eql('Charm has no README');
        done();
      };

      view.render();
      node.one('.charm .add').simulate('click');
    });


    it('_addCharmEnvironment displays the config panel', function(done) {
      var fakeStore = new Y.juju.charmstore.APIv4({
        charmstoreURL: 'localhost/'
      });
      view = new CharmView({
        entity: new models.Charm({
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
        container: utils.makeContainer(this),
        charmstore: fakeStore
      });

      var fireStub = utils.makeStubMethod(view, 'fire');
      this._cleanups.push(fireStub.reset);

      view.set('deployService', function(charm, serviceAttrs) {
        var serviceCharm = view.get('entity');
        assert.deepEqual(charm, serviceCharm);
        assert.equal(charm.get('id'), 'cs:precise/ceph-9');
        assert.equal(serviceAttrs.icon, 'localhost/v4/precise/ceph-9/icon.svg');
        assert.equal(fireStub.calledOnce(), true);
        var fireArgs = fireStub.lastArguments();
        assert.equal(fireArgs[0], 'changeState');
        assert.deepEqual(fireArgs[1], {
          sectionA: {
            component: 'charmbrowser',
            metadata: {
              id: null }}});
        done();
      });

      view._addCharmEnvironment({halt: function() {}});
    });

    it('should load a file when a hook is selected', function() {
      view = new CharmView({
        entity: new models.Charm({
          files: [
            'hooks/install',
            'readme.rst'
          ],
          id: 'precise/ceph-9',
          code_source: { location: 'lp:~foo' }
        }),
        container: utils.makeContainer(this),
        charmstore: {
          getFile: function(url, filename, success, failure) {
            success({
              target: {
                responseText: '<install hook content>'
              }
            });
          }
        }
      });

      view.render();
      Y.one('#code').all('select option').size().should.equal(3);

      // Select the hooks install and the content should update.
      Y.one('#code').all('select option').item(2).set(
          'selected', 'selected');
      Y.one('#code').one('select').simulate('change');

      var content = Y.one('#code').one('div.filecontent');
      // Content is escaped, so we read it out as text, not tags.
      content.get('text').should.eql('<install hook content>');
    });

    it('should be able to render markdown as html', function() {
      view = new CharmView({
        activeTab: '#readme',
        entity: new models.Charm({
          files: [
            'readme.md'
          ],
          id: 'precise/wordpress-9',
          code_source: { location: 'lp:~foo' }
        }),
        container: utils.makeContainer(this),
        charmstore: {
          getFile: function(url, filename, success, failure) {
            success({
              target: {
                responseText: 'README Header\n============='
              }
            });
          }
        }
      });

      view.render();
      Y.one('#readme').get('innerHTML').should.eql(
          '<h1>README Header</h1>');
    });

    it('should display the config data in the config tab', function() {
      view = new CharmView({
        entity: new models.Charm({
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
        container: utils.makeContainer(this)
      });
      view.render();

      Y.one('#configuration dd div').get('text').should.eql(
          'Default: 9160');
      Y.one('#configuration dd p').get('text').should.eql(
          'Port for client communcation');
    });

    it('should catch when the open log is clicked', function(done) {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];
      view = new CharmView({
        entity: new models.Charm(data),
        container: utils.makeContainer(this)
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
      data.files = [];
      view = new CharmView({
        entity: new models.Charm(data),
        container: utils.makeContainer(this)
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
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'noRequiresNoProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for no requires, 1 provides',
        function() {
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'noRequiresOneProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for no requires, many provides',
        function() {
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'noRequiresManyProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for 1 requires, no provides',
        function() {
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'oneRequiresNoProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for 1 requires, 1 provides',
        function() {
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'oneRequiresOneProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for 1 requires, many provides',
        function() {
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'oneRequiresManyProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for many requires, no provides',
        function() {
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'manyRequiresNoProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for many requires, 1 provides',
        function() {
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'manyRequiresOneProvides'));
        });

    it('_getInterfaceIntroFlag sets the flag for many requires, many provides',
        function() {
          var charm = new models.Charm({
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
            entity: charm
          });
          var interfaceIntro = view._getInterfaceIntroFlag(
              charm.get('requires'), charm.get('provides'));
          assert(Y.Object.hasKey(interfaceIntro, 'manyRequiresManyProvides'));
        });

    it('shows and hides an indicator', function(done) {
      var hit = 0;

      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];
      view = new CharmView({
        entity: new models.Charm(data),
        container: utils.makeContainer(this)
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
      data.files = [];

      view = new CharmView({
        activeTab: '#configuration',
        entity: new models.Charm(data),
        container: utils.makeContainer(this)
      });

      view.render();

      // We've selected the activeTab specified.
      var selected = view.get('container').one('nav .active');
      assert.equal(selected.getAttribute('href'), '#configuration');
    });

    it('sets the proper change request when closed', function(done) {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];

      view = new CharmView({
        activeTab: '#configuration',
        entity: new models.Charm(data),
        container: utils.makeContainer(this)
      });

      view.on('changeState', function(ev) {
        assert.equal(ev.details[0].sectionA.metadata.id, null,
                     'The charm id is not set to null.');
        assert.equal(ev.details[0].sectionA.metadata.hash, null,
                     'The charm details hash is not set to null.');
        done();
      });

      view.render();
      view.get('container').one('.charm .back').simulate('click');
    });

    it('renders related charms when interface tab selected', function() {
      var data = utils.loadFixture('data/browsercharm.json', true);
      testContainer = utils.makeContainer(this);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];

      view = new CharmView({
        activeTab: '#related-charms',
        entity: new models.Charm(data),
        renderTo: testContainer
      });
      view.render();

      assert.equal(
          testContainer.all('#related-charms .token').size(),
          18);
      assert.equal(view.get('entity').get('id'), 'cs:precise/apache2-27');
      assert.isTrue(view.loadedRelatedInterfaceCharms);
    });

    it('ignore invalid tab selections', function() {
      var data = utils.loadFixture('data/browsercharm.json', true);
      testContainer = utils.makeContainer(this);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];

      var fakeStore = factory.makeFakeCharmstore();

      view = new CharmView({
        activeTab: '#bws-does-not-exist',
        entity: new models.Charm(data),
        renderTo: testContainer,
        charmstore: fakeStore
      });
      view.render();

      assert.equal(
          testContainer.one('nav .active').getAttribute('href'),
          '#summary');
    });

    it('should open header links in a new tab', function() {
      var data = utils.loadFixture('data/browsercharm.json', true);
      // We don't want any files so we don't have to mock/load them.
      data.files = [];
      view = new CharmView({
        entity: new models.Charm(data),
        container: utils.makeContainer(this)
      });
      view.render();
      var links = view.get('container').all('.header .details li a');
      // Check that we've found the links, otherwise the assert in .each will
      // succeed when there are no links.
      assert.equal(links.size() > 0, true);
      links.each(function(link) {
        assert.equal(link.getAttribute('target'), '_blank');
      });
    });

  });

})();
