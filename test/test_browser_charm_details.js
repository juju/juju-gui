'use strict';

(function() {

  describe.only('browser_charm_view', function() {
    var CharmView, models, node, view, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'node-event-simulate',
          'juju-charm-models',
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
      var docBody = Y.one(document.body);
      Y.Node.create('<div id="testcontent">' +
          '</div>').appendTo(docBody);

      // Mock out a dummy location for the Store used in view instances.
      window.juju_config = {
        charmworldURL: 'http://localhost'
      };
      node = Y.one('#testcontent');
    });

    afterEach(function() {
      view.destroy();
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


    // EVENTS
    it('should catch when the add control is clicked', function(done) {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install'
          ],
          id: 'precise/ceph-9'
        })
      });

      // Hook up to the callback for the click event.
      view._addCharmEnvironment = function(ev) {
        ev.preventDefault();
        Y.one('#readme h3').get('text').should.eql('No Readme Found');
        done();
      };

      view.render(node);
      view.get('container').should.eql(node);
      node.one('.charm input.add').simulate('click');
    });

    it('should catch when the open log is clicked', function(done) {
      view = new CharmView({
        charm: new models.BrowserCharm({
          files: [
            'hooks/install'
          ],
          id: 'precise/ceph-9'
        })
      });

      // Hook up to the callback for the click event.
      view._toggleLog = function(ev) {
        ev.preventDefault();
        Y.one('#readme h3').get('text').should.eql('No Readme Found');
        done();
      };

      view.render(node);
      view.get('container').should.eql(node);
      node.one('.changelog .toggle').simulate('click');
    });
  });

})();

