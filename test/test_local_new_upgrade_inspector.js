/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License velnuion 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

describe('local-new-upgrade-inspector', function() {
  var Y, views, testUtils, container, lnui, services, fileObj, envObj, dbObj;

  before(function(done) {
    var modules = ['juju-tests-utils', 'local-new-upgrade-inspector'];
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      views = Y.namespace('juju.views');
      testUtils = Y['juju-tests'].utils;
      done();
    });
    services = [{ getAttrs: function() {} }];
    fileObj = { file: 'file' };
    envObj = { get: function() { return 'precise'; }};
    dbObj = { db: 'db' };
  });

  // These are required so that the monkey patched velnuions
  // which add the _cleanups property do not fire.
  beforeEach(function() {
    container = testUtils.makeContainer(this, 'content');
    lnui = new views.LocalNewUpgradeInspector({
      services: services,
      file: fileObj,
      env: envObj,
      db: dbObj
    });
  });

  afterEach(function() {
    lnui.destroy();
  });

  it('can be instantiated', function() {
    assert.equal(lnui instanceof views.LocalNewUpgradeInspector, true);
  });

  it('can be rendered', function() {
    lnui.render();
    assert.notEqual(container.one('.viewlet-container'), null);
  });

  it('shows the requestSeries and localNewUpgrade views', function() {
    lnui.render();
    assert.notEqual(container.one('#defaultSeries'), null);
    assert.notEqual(container.one('.upgrade-services-toggle'), null);
  });

  it('sets file, env, db, attributes on the requestSeries view', function() {
    // Need to call render for it to hit the setupUI cycle
    lnui.render();
    var requestSeries = lnui.views.requestSeries;
    assert.deepEqual(requestSeries.get('file'), fileObj);
    assert.deepEqual(requestSeries.get('env'), envObj);
    assert.deepEqual(requestSeries.get('db'), dbObj);
  });

  it('sets services, file, env, db, attributes on the localNewUpgrade view',
     function() {
       // Need to call render for it to hit the setupUI cycle
       lnui.render();
       var lnuv = lnui.views.localNewUpgrade;
       assert.deepEqual(lnuv.get('services'), services);
       assert.deepEqual(lnuv.get('file'), fileObj);
       assert.deepEqual(lnuv.get('env'), envObj);
       assert.deepEqual(lnuv.get('db'), dbObj);
     }
  );

});
