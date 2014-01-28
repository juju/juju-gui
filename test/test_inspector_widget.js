/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

describe('Inspector Widget', function() {
  var container, inspector, Y, jujuViews;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['juju-inspector-widget',
          'view', 'juju-tests-utils'], function(Y) {
          jujuViews = Y.namespace('juju.views');
          done();
        });
  });

  beforeEach(function() {
    container = Y['juju-tests'].utils.makeContainer(this, 'container');
  });

  afterEach(function() {
    if (inspector) {
      inspector.destroy();
    }
  });

  var createInspector = function(config) {
    inspector = new Y.juju.widgets.Inspector(config);
    return inspector;
  };

  it('can be instantiated', function() {
    assert(createInspector() instanceof Y.juju.widgets.Inspector);
  });

  it('renders initialView when defined', function() {
    jujuViews.TestView = Y.Base.create('test-view', Y.View, [], {}, {});
    createInspector({
      render: container,
      views: {
        testView: {
          type: 'TestView'
        }
      },
      modelController: {},
      initialView: {
        name: 'testView'
      }
    });
    assert.equal(inspector.get('activeView').name, 'test-view');
  });

  it('passes config values through on instantiation', function() {
    jujuViews.TestView = Y.Base.create('test-view', Y.View, [], {}, {});
    createInspector({
      render: container,
      views: {
        testView: {
          type: 'TestView'
        }
      },
      modelController: {},
      initialView: {
        name: 'testView'
      },
      config: {
        test: 'success'
      }
    });
    var activeView = inspector.get('activeView');
    assert.equal(activeView.name, 'test-view');
    assert.equal(activeView.get('test'), 'success');
  });

  it('acts as a bubble target for the child views', function(done) {
    jujuViews.TestView = Y.Base.create('test-view', Y.View, [], {}, {});
    createInspector({
      render: container,
      views: {
        testView: {
          type: 'TestView'
        }
      },
      modelController: {},
      initialView: {
        name: 'testView'
      }
    });
    inspector.on('*:testevent', function() {
      done();
    });
    inspector.get('activeView').fire('testevent');
  });

  it('changes views when requested from a child view', function() {
    jujuViews.TestViewOne = Y.Base.create('test-view-one', Y.View, [], {}, {});
    jujuViews.TestViewTwo = Y.Base.create('test-view-two', Y.View, [], {}, {});
    createInspector({
      render: container,
      views: {
        testViewOne: { type: 'TestViewOne' },
        testViewTwo: { type: 'TestViewTwo' }
      },
      modelController: {},
      initialView: {
        name: 'testViewOne'
      }
    });
    var activeView = inspector.get('activeView');
    assert.equal(activeView.name, 'test-view-one');
    inspector.after('activeViewChange', function() {
      assert.equal(this.get('activeView').name, 'test-view-two');
    });
    activeView.fire('showView', {
      name: 'testViewTwo'
    });
  });

  it('changes views when externally requested', function() {
    jujuViews.TestViewOne = Y.Base.create('test-view-one', Y.View, [], {}, {});
    jujuViews.TestViewTwo = Y.Base.create('test-view-two', Y.View, [], {}, {});
    createInspector({
      render: container,
      views: {
        testViewOne: { type: 'TestViewOne' },
        testViewTwo: { type: 'TestViewTwo' }
      },
      modelController: {},
      initialView: {
        name: 'testViewOne'
      }
    });
    assert.equal(inspector.get('activeView').name, 'test-view-one');
    inspector.showView('testViewTwo');
    assert.equal(inspector.get('activeView').name, 'test-view-two');
  });

  it('passes config values through on showView', function() {
    jujuViews.TestViewOne = Y.Base.create('test-view-one', Y.View, [], {}, {});
    jujuViews.TestViewTwo = Y.Base.create('test-view-two', Y.View, [], {}, {});
    createInspector({
      render: container,
      views: {
        testViewOne: { type: 'TestViewOne' },
        testViewTwo: { type: 'TestViewTwo' }
      },
      modelController: {},
      initialView: {
        name: 'testViewOne'
      }
    });
    assert.equal(inspector.get('activeView').name, 'test-view-one');
    inspector.showView('testViewTwo', { test: 'success' });
    assert.equal(inspector.get('activeView').name, 'test-view-two');
    assert.equal(inspector.get('activeView').get('test'), 'success');
  });

  it('preserves all view instances', function() {
    jujuViews.TestViewOne = Y.Base.create('test-view-one', Y.View, [], {}, {});
    jujuViews.TestViewTwo = Y.Base.create('test-view-two', Y.View, [], {}, {});
    createInspector({
      render: container,
      views: {
        testViewOne: { type: 'TestViewOne' },
        testViewTwo: { type: 'TestViewTwo' }
      },
      modelController: {},
      initialView: {
        name: 'testViewOne'
      }
    });
    assert.equal(inspector.get('activeView').name, 'test-view-one');
    inspector.showView('testViewTwo');
    assert.equal(inspector.get('activeView').name, 'test-view-two');
    var views = inspector.get('views');
    assert(views.testViewOne.instance instanceof Y.View);
    assert(views.testViewTwo.instance instanceof Y.View);
  });

});
