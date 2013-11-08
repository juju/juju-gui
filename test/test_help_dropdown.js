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

describe('help dropdown view', function() {

  var views, models, db, landscape, Y, viewNode, envAnno;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'help-dropdown',
      'juju-landscape',
      'juju-models',
      'juju-views'], function(Y) {

      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');

      db = new models.Database();
      landscape = new views.Landscape();
      landscape.set('db', db);

      // Set defaults for testing.
      envAnno = db.environment.get('annotations');

      viewNode = Y.Node.create('<div id="help-dropdown"></div>');
      Y.one('body').append(viewNode);

      done();
    });
  });

  it('should display the Landscape menu item', function() {
    var helpView = new views.HelpDropdownView({
      container: Y.one('#help-dropdown'),
      env: db.environment
    });
    helpView.render();
    viewNode.one('#landscape-url').getStyle('display').should.equal('none');

    envAnno['landscape-url'] = 'http://landscape.example.com';
    envAnno['landscape-computers'] = '/computers/criteria/environment:test';
    viewNode.remove();
    Y.one('body').append(viewNode);
    helpView.render();

    viewNode.one('#landscape-url').getStyle('display').should.not.equal('none');
    viewNode.one('#landscape-url a').get('href').should
      .equal('http://landscape.example.com/computers/criteria/environment:test/');

    viewNode.remove();
  });
});
