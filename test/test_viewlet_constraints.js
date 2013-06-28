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

  describe('Constraints viewlet', function() {
    var env, inspector, model, utils, viewlet, views, Y;

    before(function(done) {
      // var requirements = ['juju-view-service', 'juju-tests-utils', 'handlebars'];
      var requirements = [
        'juju-views', 'juju-models', 'base', 'node', 'json-parse', 'juju-env',
        'node-event-simulate', 'juju-tests-utils', 'event-key'];
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        views = Y.namespace('juju.views');
        var juju = Y.namespace('juju');
        var conn = new utils.SocketStub();
        env = juju.newEnvironment({conn: conn});
        model = new Y.Model({name: 'foo'});
        done();
      });
    });

    after(function(done) {
      env.destroy();
      done();
    });

    beforeEach(function(done) {
      inspector = new views.ServiceInspector(model, {
        env: env,
        viewletList: ['constraints'],
        template: views.Templates['view-container']
      });
      viewlet = inspector.viewlets.constraints;
      done();
    });

    afterEach(function(done) {
      inspector.destroy();
      done();
    });

    it('render the constraints form correctly', function() {
      viewlet.render();
    });

  });

})();
