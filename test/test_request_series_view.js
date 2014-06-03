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

  describe('request-series-view', function() {
    var juju, testUtils, view, yui;

    before(function(done) {
      var modules = ['juju-tests-utils', 'request-series-view',
        'node-event-simulate'];
      YUI(GlobalConfig).use(modules, function(Y) {
        yui = Y;
        juju = Y.namespace('juju');
        testUtils = Y['juju-tests'].utils;
        done();
      });
    });

    var filestub, envstub, dbstub, vmstub;

    beforeEach(function() {
      filestub = { name: 'foo.zip', size: 1234 };
      envstub = {
        series: ['precise', 'saucy', 'trusty'],
        get: function() {
          return 'precise';
        }
      };
      dbstub = { db: 'db' };
      vmstub = { destroy: testUtils.makeStubFunction() };
      view = new juju.viewlets.RequestSeries({
        file: filestub,
        env: envstub,
        db: dbstub
      });
      // added by the viewletManager
      view.viewletManager = vmstub;
    });

    afterEach(function(done) {
      view.after('destroy', function() {
        done();
      });
      view.destroy();
    });

    it('can be instantiated', function() {
      assert.equal(view instanceof yui.View, true);
      assert.equal(view._eventsBound, false);
    });

    it('can be rendered', function() {
      var bindUI = testUtils.makeStubMethod(view, '_bindUI');
      this._cleanups.push(bindUI.reset);
      view.render();
      var container = view.get('container');
      // If this is in the container then content was rendered into it.
      assert.isObject(container.one('.view-container'));
      assert.equal(bindUI.calledOnce(), true);
    });

    it('only calls bindUI once on multiple renders', function() {
      var bindUI = testUtils.makeStubMethod(view, '_bindUI');
      this._cleanups.push(bindUI.reset);
      view.render();
      view.render();
      assert.equal(bindUI.calledOnce(), true);
    });

    it('attaches the button click events on render', function() {
      var destroyVM = testUtils.makeStubMethod(view, 'destroyViewletManager');
      this._cleanups.push(destroyVM.reset);
      var uploadLocal = testUtils.makeStubMethod(view, '_uploadLocalCharm');
      this._cleanups.push(uploadLocal.reset);
      view.render();
      var wrapper = testUtils.makeContainer(this);
      var container = view.get('container');
      wrapper.append(container);
      container.one('button.cancel').simulate('click');
      container.one('button.confirm').simulate('click');
      assert.equal(destroyVM.calledOnce(), true);
      // the argument in the 0 spot is the click event object.
      assert.deepEqual(destroyVM.lastArguments()[1], vmstub);
      assert.equal(uploadLocal.calledOnce(), true);
      var uploadLocalArgs = uploadLocal.lastArguments();
      // the argument in the 0 spot is the click event object.
      assert.deepEqual(uploadLocalArgs[1], vmstub);
      assert.deepEqual(uploadLocalArgs[2], filestub);
      assert.deepEqual(uploadLocalArgs[3], envstub);
      assert.deepEqual(uploadLocalArgs[4], dbstub);
    });

    it('destroyViewletManager: destroys the viewlet manager', function() {
      var fireStub = testUtils.makeStubMethod(view, 'fire');
      this._cleanups.push(fireStub.reset);
      view.destroyViewletManager(null);
      assert.equal(fireStub.calledOnce(), true);
      assert.equal(fireStub.lastArguments()[0], 'changeState');
      assert.deepEqual(fireStub.lastArguments()[1], {
        sectionA: {
          component: 'charmbrowser'
        }
      });
    });

    it('_uploadLocalCharm: calls uploadLocalCharm', function() {
      yui.namespace('juju.localCharmHelpers');
      var defSeries = 'precise';
      var helperUpload = testUtils.makeStubMethod(
          juju.localCharmHelpers, 'uploadLocalCharm');
      this._cleanups.push(helperUpload.reset);
      var getSeries = testUtils.makeStubMethod(
          view, 'getSeriesValue', defSeries);
      this._cleanups.push(getSeries.reset);
      view._uploadLocalCharm(null, vmstub, filestub, envstub, dbstub);
      assert.equal(helperUpload.calledOnce(), true);
      assert.equal(getSeries.calledOnce(), true);
      var helperArgs = helperUpload.lastArguments();
      assert.equal(helperArgs[0], defSeries);
      assert.equal(helperArgs[1], filestub);
      assert.equal(helperArgs[2], envstub);
      assert.equal(helperArgs[3], dbstub);
      assert.equal(vmstub.destroy.calledOnce(), true);
    });

    it('gets the series value from the viewlet selector', function(done) {
      var viewletManager = {
        get: function(val) {
          assert.equal(val, 'container');
          return {
            one: function(val) {
              assert.equal(val, 'select#defaultSeries');
              return {
                get: function(val) {
                  assert.equal(val, 'value');
                  done();
                }
              };
            }
          };
        }
      };
      view.getSeriesValue(viewletManager);
    });

    it('shows all the supported series in the selector', function() {
      view.render();
      var selector = view.get('container').one('select#defaultSeries');
      var optionValues = selector.all('option').get('value');
      assert.deepEqual(optionValues, envstub.series);
    });

  });
})();
