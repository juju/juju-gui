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

describe('request-series-inspector', function() {
  var Y, views, testUtils, container, rsi, fileObj, envObj, dbObj;

  before(function(done) {
    var modules = ['juju-tests-utils', 'request-series-inspector'];
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      views = Y.namespace('juju.views');
      testUtils = Y['juju-tests'].utils;
      done();
    });
    fileObj = { file: 'file' };
    envObj = { get: function() { return 'precise'; }};
    dbObj = { db: 'db' };
  });

  // These are required so that the monkey patched versions
  // which add the _cleanups property do not fire.
  beforeEach(function() {
    container = testUtils.makeContainer(this, 'content');
    container.append(
        '<div id="bws-sidebar"><div class="bws-content"></div></div>');
    rsi = new views.RequestSeriesInspector({
      file: fileObj,
      env: envObj,
      db: dbObj
    });
  });

  afterEach(function() {
    rsi.destroy();
  });

  it('can be instantiated', function() {
    assert.equal(rsi instanceof views.RequestSeriesInspector, true);
  });

  it('can be rendered', function() {
    rsi.render();
    assert.notEqual(container.one('#defaultSeries'), null);
  });

  it('shows the requestSeries view', function() {
    rsi.render();
    assert.notEqual(container.one('.view-content'), null);
  });

  it('sets file, env, db, attributes on the requestSeries view', function() {
    // Need to call render for it to hit the setupUI cycle
    rsi.render();
    var requestSeries = rsi.views.requestSeries;
    assert.deepEqual(requestSeries.get('file'), fileObj);
    assert.deepEqual(requestSeries.get('env'), envObj);
    assert.deepEqual(requestSeries.get('db'), dbObj);
  });

});
