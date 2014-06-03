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

  describe('local-new-upgrade-view', function() {
    var juju, testUtils, view, yui;

    before(function(done) {
      var modules = ['juju-tests-utils', 'local-new-upgrade-view',
        'node-event-simulate'];
      YUI(GlobalConfig).use(modules, function(Y) {
        yui = Y;
        juju = Y.namespace('juju');
        testUtils = Y['juju-tests'].utils;
        done();
      });
    });

    var services, filestub, envstub, dbstub;

    beforeEach(function() {
      services = [{ getAttrs: function() {} }];
      filestub = { name: 'foo.zip', size: 1234 };
      envstub = {
        series: ['precise', 'saucy', 'trusty'],
        get: function() {
          return 'precise';
        }
      };
      dbstub = { db: 'db' };
      view = new juju.viewlets.LocalNewUpgradeView({
        services: services,
        file: filestub,
        env: envstub,
        db: dbstub
      });
    });

    afterEach(function(done) {
      view.after('destroy', function() {
        done();
      });
      view.destroy();
    });

    it('can be instantiated', function() {
      assert.equal(view instanceof yui.View, true);
    });

    it('can be rendered', function() {
      view.render();
      var container = view.get('container');
      // If this is in the container then content was rendered into it.
      assert.isObject(container.one('.view-container'));
    });

    it('attaches the button click events on render', function() {
      var destroyVM = testUtils.makeStubMethod(view, 'closeInspector');
      this._cleanups.push(destroyVM.reset);
      var upgradeServices = testUtils.makeStubMethod(view,
          '_upgradeSelectedServices');
      this._cleanups.push(upgradeServices.reset);
      view.render();
      var wrapper = testUtils.makeContainer(this);
      var container = view.get('container');
      wrapper.append(container);
      container.one('button.cancel').simulate('click');
      container.one('button.confirm').simulate('click');
      assert.equal(destroyVM.calledOnce(), true);
      assert.equal(upgradeServices.calledOnce(), true);
    });

    it('calls upgradeServiceUsingLocalCharm on upgrade', function() {
      yui.namespace('juju.localCharmHelpers');
      var helperUpgrade = testUtils.makeStubMethod(
          juju.localCharmHelpers, 'upgradeServiceUsingLocalCharm');
      this._cleanups.push(helperUpgrade.reset);
      var selectedServices = testUtils.makeStubMethod(
          view, '_getSelectedServices', services);
      this._cleanups.push(selectedServices.reset);
      var fireStub = testUtils.makeStubMethod(view, 'fire');
      this._cleanups.push(fireStub.reset);
      view._upgradeSelectedServices();
      assert.equal(helperUpgrade.calledOnce(), true, 'helperUpgrade');
      assert.equal(fireStub.calledOnce(), true);
      assert.equal(fireStub.lastArguments()[0], 'changeState');
      assert.deepEqual(fireStub.lastArguments()[1], {
        sectionA: {
          component: 'charmbrowser'
        }
      });
    });

    it('returns service objects for checked services', function() {
      dbstub.services = {
        getById: function(name) {
          return { name: name };
        }
      };
      services = [{ id: 'foo' }, { id: 'bar' }];
      view.set('services', services);
      view.set('db', dbstub);
      view.render();
      var wrapper = testUtils.makeContainer(this);
      var container = view.get('container');
      wrapper.append(container);
      container.one('#input-foo').set('checked', true);
      var selectedServices = view._getSelectedServices();
      assert.equal(selectedServices.length, 1);
      assert.equal(selectedServices[0].name, 'foo');
    });

  });
})();
