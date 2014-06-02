/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2014 Canonical Ltd.

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

describe('Inspector Base', function() {
  var fakeView, Y, Inspector, testUtils;
  var requirements = ['inspector-base', 'juju-tests-utils'];

  before(function(done) {
    // Set up the YUI instance, the test utils and the web namespace.
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      testUtils = Y.namespace('juju-tests.utils');
      Inspector = Y.juju.views.Inspector;
      fakeView = Y.Base.create('fake-view', Y.View, [], {});
      done();
    });
  });

  afterEach(function() {});

  it('can be instantiated', function() {
    var inspector = new Inspector({
      views: { testView: fakeView }
    });
    assert.equal(inspector instanceof Inspector, true);
    // The container is generated on instantiation.
    assert.equal(typeof inspector.get('container'), 'object');
  });

  it('can be subclassed', function() {
    var markup = '<div class="new-inspector-container"></div>';
    var NewInspector = Y.Base.create('new-inspector', Inspector, [], {
      views: { testView: fakeView },
      template: markup
    });
    var newInspector = new NewInspector();
    assert.equal(newInspector instanceof NewInspector, true);
    assert.equal(newInspector.template, markup);
    assert.equal(newInspector.viewletContainer, '.viewlet-container');
    // The container is generated on instantiation.
    assert.equal(typeof newInspector.get('container'), 'object');
  });

  it('can be rendered into the sidebar', function() {
    testUtils.makeContainer(this, 'bws-sidebar');
    Y.one('#bws-sidebar').setHTML('<div class="bws-content"></div>');
    var inspector = new Inspector({
      views: { testView: fakeView }
    });
    inspector.render();
    // If this element is not in the page then it will be null.
    assert.isObject(inspector.get('container').one('.viewlet-container'));
  });

});
