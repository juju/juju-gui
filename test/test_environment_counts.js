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

describe('environment counts view', function() {
  var db, models, utils, view, View, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-tests-utils',
      'juju-models',
      'juju-environment-counts',
      'node-event-simulate'
    ], function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      View = Y.juju.browser.views.EnvironmentCounts;
      done();
    });
  });

  beforeEach(function() {
    db = new models.Database();
    db.services.add({id: 'django'});
    db.addUnits({id: 'django/0', machine: '0'});
    db.addUnits({id: 'django/1', machine: '0'});
    db.machines.add([
      {id: '0'},
      {id: '1'},
      {id: '2'}
    ]);
    var container = utils.makeContainer(this, 'environment-counts-view');
    view = new View({
      container: container,
      db: db
    });
  });

  afterEach(function(done) {
    if (view) {
      view.after('destroy', function() { done(); });
      view.destroy();
    }
  });

  describe('render', function() {
    it('appends the template to the container', function() {
      var container = view.get('container');
      assert.equal(container.one('ul'), null,
                   'Environment counts HTML found');
      view.render();
      assert.notEqual(container.one('ul'), null,
                      'Environment counts HTML not found');
      assert.notEqual(container.one('.servicesCount'), null,
                      'Services count HTML not found');
      assert.notEqual(container.one('.unitsCount'), null,
                      'Units count HTML not found');
      assert.notEqual(container.one('.machinesCount'), null,
                      'Machines count HTML not found');
    });
  });

  describe('bind events', function() {
    it('increments unit count when units are added', function() {
      var initialCount = db.units.size(),
          container = view.get('container');
      view.render();
      assert.equal(container.one('.unitsCount').get('text'), initialCount,
                   'Initial count does not match displayed count');
      db.addUnits({id: 'django/2', machine: '0'});
      assert.equal(container.one('.unitsCount').get('text'), initialCount + 1,
                   'Displayed count was not incremented properly');
    });

    it('decrements unit count when units are removed', function() {
      var initialCount = db.units.size(),
          container = view.get('container');
      view.render();
      assert.equal(container.one('.unitsCount').get('text'), initialCount,
                   'Initial count does not match displayed count');
      db.removeUnits(db.units.item(0));
      assert.equal(container.one('.unitsCount').get('text'), initialCount - 1,
                   'Displayed count was not decremented properly');
    });

    it('increments machine count when machines are added', function() {
      var initialCount = db.machines.size(),
          container = view.get('container');
      view.render();
      assert.equal(container.one('.machinesCount').get('text'), initialCount,
                   'Initial count does not match displayed count');
      db.machines.add({id: '3'});
      assert.equal(container.one('.machinesCount').get('text'),
                   initialCount + 1,
                   'Displayed count was not incremented properly');
    });

    it('decrements machine count when machines are removed', function() {
      var initialCount = db.machines.size(),
          container = view.get('container');
      view.render();
      assert.equal(container.one('.machinesCount').get('text'), initialCount,
                   'Initial count does not match displayed count');
      db.machines.remove(0);
      assert.equal(container.one('.machinesCount').get('text'),
                   initialCount - 1,
                   'Displayed count was not decremented properly');
    });

    it('increments service count when services are added', function() {
      var initialCount = db.services.size(),
          container = view.get('container');
      view.render();
      assert.equal(container.one('.servicesCount').get('text'), initialCount,
                   'Initial count does not match displayed count');
      db.services.add({id: 'mysql'});
      assert.equal(container.one('.servicesCount').get('text'),
                   initialCount + 1,
                   'Displayed count was not incremented properly');
    });

    it('decrements service count when services are removed', function() {
      var initialCount = db.services.size(),
          container = view.get('container');
      view.render();
      assert.equal(container.one('.servicesCount').get('text'), initialCount,
                   'Initial count does not match displayed count');
      db.services.remove(0);
      assert.equal(container.one('.servicesCount').get('text'),
                   initialCount - 1,
                   'Displayed count was not decremented properly');
    });
  });

  describe('destroy', function() {
    it('empties the container', function() {
      view.render();
      var container = view.get('container');
      assert.notEqual(container.getDOMNode, null,
                      'Environment counts DOM node not found');
      view.destroy();
      assert.equal(container.getDOMNode(), null,
                   'Environment counts DOM node found');
    });
  });
});
