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

  var db, envAnno, helpView, views, landscape, models, utils, viewNode, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-landscape',
      'juju-models',
      'juju-views',
      'help-dropdown',
      'node-event-simulate'], function(Y) {

      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = window.jujuTestUtils.utils;

      db = new models.Database();
      landscape = new views.Landscape();
      landscape.set('db', db);

      done();
    });
  });

  beforeEach(function() {
    envAnno = db.environment.get('annotations');
    viewNode = utils.makeContainer(this, 'help-dropdown');
  });

  afterEach(function() {
    if (helpView) {
      helpView.destroy();
    }
  });

  it('renders the basic list', function() {
    helpView = new views.HelpDropdownView({
      container: viewNode,
      env: db.environment
    }).render();
    // Landscape url should be hidden
    var container = helpView.get('container');
    assert.equal(
        container.one('.landscape-url').getStyle('display'), 'none');
    assert.equal(container.all('li').size(), 4);
  });

  it('should display the Landscape menu item', function() {
    envAnno['landscape-url'] = 'http://landscape.example.com';
    envAnno['landscape-computers'] = '/computers/criteria/environment:test';
    new views.HelpDropdownView({
      container: viewNode,
      env: db.environment
    }).render();

    assert.equal(
        viewNode.one('.landscape-url').getStyle('display'), 'list-item');
    assert.equal(
        viewNode.one('.landscape-url a').get('href'),
        'http://landscape.example.com/computers/criteria/environment:test/');
  });

  it('can start the onboarding visualization', function(done) {
    helpView = new views.HelpDropdownView({
      container: viewNode,
      env: db.environment
    });
    helpView.on('navigate', function(e) {
      assert.equal(e.url, '/');
      assert.equal(localStorage.getItem('force-onboarding'), 'true');
      done();
    });
    helpView.render();
    var ob = helpView.get('container').one('.start-onboarding');
    ob.simulate('click');
  });
});
