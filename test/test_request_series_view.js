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

    var fileObj, envObj, dbObj, vmObj;

    beforeEach(function() {
      fileObj = { name: 'foo.zip', size: 1234 };
      envObj = { get: function() { return 'precise'; } };
      dbObj = { db: 'db' };
      vmObj = { destroy: testUtils.makeStubFunction() };
      view = new juju.viewlets.RequestSeries({
        file: fileObj,
        env: envObj,
        db: dbObj
      });
      // added by the viewletManager
      view.viewletManager = vmObj;
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
      assert.deepEqual(destroyVM.lastArguments()[1], vmObj);
      assert.equal(uploadLocal.calledOnce(), true);
      var uploadLocalArgs = uploadLocal.lastArguments();
      // the argument in the 0 spot is the click event object.
      assert.deepEqual(uploadLocalArgs[1], vmObj);
      assert.deepEqual(uploadLocalArgs[2], fileObj);
      assert.deepEqual(uploadLocalArgs[3], envObj);
      assert.deepEqual(uploadLocalArgs[4], dbObj);
    });

    it('destroyViewletManager: destroys the viewlet manager', function() {
      view.destroyViewletManager(null, vmObj);
      assert.equal(vmObj.destroy.calledOnce(), true);
    });

    it('_uploadLocalCharm: calls _uploadLocalCharm', function() {
      yui.namespace('juju.localCharmHelpers');
      var helperUpload = testUtils.makeStubMethod(
          juju.localCharmHelpers, '_uploadLocalCharm');
      this._cleanups.push(helperUpload.reset);
      view._uploadLocalCharm(null, vmObj, fileObj, envObj, dbObj);
      assert.equal(helperUpload.calledOnce(), true);
      var helperArgs = helperUpload.lastArguments();
      assert.equal(helperArgs[0], vmObj);
      assert.equal(helperArgs[1], fileObj);
      assert.equal(helperArgs[2], envObj);
      assert.equal(helperArgs[3], dbObj);
      assert.equal(vmObj.destroy.calledOnce(), true);
    });

  });
})();
