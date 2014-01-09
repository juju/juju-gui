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

describe('Network view list - Prototype', function() {
  var Y, viewContainer, models, views, juju, db;
  before(function(done) {
    Y = YUI(GlobalConfig).use(['node', 'view',
      'juju-models',
      'juju-views',
      'juju-env',
      'juju-tests-utils',
      'node-event-simulate'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    viewContainer = Y.namespace('juju-tests.utils')
      .makeContainer();
    viewContainer.addClass('network-list');
    db = new models.Database();
  });

  //after()

  afterEach(function() {
    viewContainer.remove(true);
  });

  it('should build a network list with an add button', function() {
    var view = new views.NetworkListView({
      db: db
    });
    view.render();
    assert.isNotNull(viewContainer.one('.add-network'));
  });

  it('should add a network on click and display it in the network list',
     function(done) {
       var view = new views.NetworkListView({
         db: db
       });
       view.render();
       db.networks.on('add', function(evt) {
         assert.equal(evt.model.get('name').substring(0, 3), 'net');
       });
       view.on('render', function() {
         assert.equal(view.get('container').one('.network')
           .get('text').substring(0, 3), 'net');
         done();
       });
       viewContainer.one('.add-network').simulate('click');
     });
});
