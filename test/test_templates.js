'use strict';

(function() {

  describe('Template: service-footer-destroy-service.partial', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, partial;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        var partials = Y.Handlebars.partials;
        partial = partials['service-footer-destroy-service'];
        done();
      });
    });

    it('does not display a "Destroy" button for the Juju GUI', function() {
      // Disallow foot-shooting.
      var html = partial({serviceIsJujuGUI: true});
      assert.equal(html.indexOf('Destroy'), -1);
    });

    it('does display a "Destroy" button for other services', function() {
      var html = partial({serviceIsJujuGUI: false});
      assert.notEqual(html.indexOf('Destroy'), -1);
    });

  });
})();

(function() {

  describe('Template: service-footer-common-controls.partial', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, partial;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        var partials = Y.Handlebars.partials;
        partial = partials['service-footer-common-controls'];
        done();
      });
    });

    it('generates nothing for the Juju GUI service', function() {
      // This partial generates the unit count and expose/unexpose UI, neither
      // of which we want for the Juju GUI service.
      var html = partial({serviceIsJujuGUI: true});
      assert.equal(Y.Lang.trim(html), '');
    });

    it('generates something for non-Juju-GUI services', function() {
      // We want /something/ for non-Juju-GUI services.  Additional tests
      // specifying what, exactly would be an improvment.
      var html = partial({serviceIsJujuGUI: false});
      assert.notEqual(Y.Lang.trim(html), '');
    });

  });
})();

(function() {

  describe('Template: service-config.handlebars', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var warningMessage = 'Warning: Changing the settings';
    var Y, conn, env, template;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        var templates = Y.namespace('juju.views').Templates;
        template = templates['service-config'];
        done();
      });
    });

    it('includes a warning about reconfiguring the Juju GUI', function() {
      // Reconfiguring the Juju GUI service could break it, causing the user to
      // lose access to the app they are in the process of using.
      var html = template({serviceIsJujuGUI: true});
      assert.notEqual(html.indexOf(warningMessage), -1);
    });

    it('does not warn about about reconfiguring other services', function() {
      var html = template({serviceIsJujuGUI: false});
      assert.equal(html.indexOf(warningMessage), -1);
    });

  });
})();

(function() {

  describe('Template: service.handlebars', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var warningMessage = 'Warning: Changing the settings';
    var divider = '<img class="divider"';
    var Y, conn, env, template;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        var templates = Y.namespace('juju.views').Templates;
        template = templates.service;
        done();
      });
    });

    it('does not show the destroy or expose UI for Juju GUI', function() {
      var html = template({serviceIsJujuGUI: true, units: []});
      assert.equal(html.indexOf('Destroy'), -1);
      assert.equal(html.indexOf('Expose'), -1);
    });

    it('shows the destroy or expose UI for non-Juju-GUI services', function() {
      var html = template({serviceIsJujuGUI: false, units: []});
      assert.notEqual(html.indexOf('Destroy'), -1);
      assert.notEqual(html.indexOf('Expose'), -1);
    });

    it('does not render a seperator in the footer for Juju GUI', function() {
      // Since the only thing displayed is the unit filter, there is no need
      // for a seperator.
      var html = template({serviceIsJujuGUI: true, units: []});
      assert.equal(html.indexOf(divider), -1);
    });

    it('renders a seperator in the footer for other services', function() {
      var html = template({serviceIsJujuGUI: false, units: []});
      assert.notEqual(html.indexOf(divider), -1);
    });

  });
})();
