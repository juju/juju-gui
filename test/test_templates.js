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

  describe('Template: service-footer-destroy-service.partial', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, partial;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        var partials = Y.Handlebars.partials;
        partial = partials['service-header-destroy-service'];
        done();
      });
    });

    it('does not display a "Destroy" button for the Juju GUI', function() {
      // Disallow foot-shooting.
      var html = partial({serviceIsJujuGUI: true});
      assert.notMatch(html, /Destroy/);
    });

    it('does display a "Destroy" button for other services', function() {
      var html = partial({serviceIsJujuGUI: false});
      assert.match(html, /Destroy/);
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

    it('includes unit count UI for the Juju GUI service', function() {
      var html = partial({serviceIsJujuGUI: true});
      assert.match(html, /Unit count/);
    });

    it('includes unit count UI for non-Juju-GUI services', function() {
      var html = partial({serviceIsJujuGUI: false});
      assert.match(html, /Unit count/);
    });


  });
})();

(function() {

  describe('Template: service-header.partial', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, partial;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        var partials = Y.Handlebars.partials;
        partial = partials['service-header'];
        done();
      });
    });

    it('does not include (un)expose for the Juju GUI service', function() {
      var html = partial({serviceIsJujuGUI: true});
      assert.notMatch(html, /Expose/);
    });

    it('includes (un)expose for non-Juju-GUI services', function() {
      var html = partial({serviceIsJujuGUI: false});
      assert.match(html, /Expose/);
    });


  });
})();

(function() {

  describe('Template: service-config.handlebars', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var warningMessage = /Warning: Changing the settings/;
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
      assert.match(html, warningMessage);
    });

    it('does not warn about about reconfiguring other services', function() {
      var html = template({serviceIsJujuGUI: false});
      assert.notMatch(html, warningMessage);
    });

  });
})();


