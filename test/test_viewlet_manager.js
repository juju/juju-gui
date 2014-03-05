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

describe('Viewlet Manager', function() {
  var Y, juju, viewletManager, utils, container;

  var fakeController = function() {};
  fakeController.prototype.bind = function() { /* noop */};

  var generateViewletManager = function(
      context, options, managerOptions, merge) {
    merge = merge || false;
    container = utils.makeContainer(context);
    container.setHTML([
      '<div class="yui3-juju-inspector">',
      '<div class="panel juju-inspector"></div>',
      '<div class="left-breakout"></div>',
      '</div>'].join(''));

    // Merging Mix.
    var viewletConfig = Y.mix({
      template: '<div class="viewlet" data-bind="name">{{name}}</div>'
    }, options || {}, false, undefined, 0, true);

    managerOptions = Y.mix({
      databinding: {
        interval: 0
      },
      enableDatabinding: true,
      views: {
        serviceConfig: Y.merge(viewletConfig),
        constraints: Y.merge(viewletConfig)
      },
      template: juju.views.Templates['service-config-wrapper'],
      templateConfig: {},
      container: container,
      events: {
        '.tab': { click: function() {} },
        '.close-slot': { click: 'hideSlot' }
      },
      viewletContainer: '.viewlet-container',
      model: new Y.Model({id: 'test', name: 'foo'})
    }, managerOptions || {}, true, undefined, 0, merge);

    viewletManager = new Y.juju.viewlets.ViewletManager(managerOptions);
  };

  before(function(done) {
    YUI(GlobalConfig).use([
      'juju-templates',
      'juju-tests-utils',
      'juju-viewlet-manager',
      'viewlet-view-base',
      'node-event-simulate',
      'view',
      'base-build'
    ],
    function(y) {
      Y = y;
      juju = y.namespace('juju');
      utils = Y['juju-tests'].utils;
      done();
    });
  });

  afterEach(function(done) {
    // destroy is async
    viewletManager.after('destroy', function() {
      done();
    });
    viewletManager.destroy();
  });

  it('sets up a view instance property', function() {
    generateViewletManager(this);
    assert.equal(typeof viewletManager.views, 'object');
  });

  it('allows an user configurable event object', function() {
    generateViewletManager(this);
    assert.equal(typeof viewletManager.events['.tab'].click, 'function');
  });

  it('properly nests config properties', function() {
    generateViewletManager(this);
    var cfg = viewletManager.views;
    assert.notEqual(cfg.serviceConfig.template, undefined);
  });

  it('sets up a view template instance property', function() {
    generateViewletManager(this);
    assert.equal(typeof viewletManager.template, 'function');
  });

  it('generates viewlet instances based on the config', function() {
    generateViewletManager(this);
    var vl = viewletManager.views,
        vlKeys = ['serviceConfig', 'constraints'];
    vlKeys.forEach(function(key) {
      assert.equal(typeof vl[key], 'object');
    });
  });

  it('includes the manager attrs in the viewlet instances', function() {
    generateViewletManager(this);
    var expected = viewletManager.getAttrs();
    // At the time the viewlet options are set, the manager is not yet
    // initialized.
    expected.initialized = false;
    assert.deepEqual(viewletManager.views.serviceConfig.options, expected);
    assert.deepEqual(viewletManager.views.constraints.options, expected);
  });

  it('fails silently when generating invalid viewlet configs', function() {
    // 'foo' does not have a config defined
    generateViewletManager(this, {}, ['serviceConfig', 'foo']);
    var vl = viewletManager.views;
    assert.equal(typeof vl.serviceConfig, 'object');
    assert.equal(typeof vl.foo, 'undefined');
  });

  it('renders its container into the DOM', function() {
    generateViewletManager(this);
    viewletManager.render();
    assert.notEqual(container.one('.viewlet-wrapper'), null);
  });

  it('renders all viewlets into the DOM', function() {
    generateViewletManager(this);
    viewletManager.render();
    assert.notEqual(container.one('.viewlet-wrapper'), null);
    assert.equal(container.all('.viewlet-container').size(), 1);
    assert.equal(container.all('.viewlet').size(), 2);
  });

  it('allows you to define your own render method', function() {
    generateViewletManager(this, { render: function() {
      return 'foo';
    }});
    var vlKeys = ['serviceConfig', 'constraints'];

    viewletManager.render();
    vlKeys.forEach(function(key) {
      assert.equal(viewletManager.views[key].render(), 'foo');
    });
  });

  it('allows you to define your own show method', function(done) {
    generateViewletManager(this, { show: function() {
      // Test passes by hitting done and getting called.
      done();
    }});
    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');
  });

  it('provides a sane default show method', function() {
    generateViewletManager(this);
    viewletManager.render();
    var managerContainer = viewletManager.get('container');
    var wrapper = managerContainer.one('.viewlet-wrapper');
    assert.equal(wrapper.getComputedStyle('display'), 'none');
    viewletManager.showViewlet('serviceConfig');
    assert.equal(wrapper.getComputedStyle('display'), 'block');
  });

  it('allows you to define your own hide method', function() {
    generateViewletManager(this);
    var hideStub = utils.makeStubMethod(
        viewletManager.views.serviceConfig, 'hide');
    this._cleanups.push(hideStub.reset);

    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');
    assert.equal(hideStub.calledOnce(), true);
  });

  it('provides a sane default hide method', function() {
    generateViewletManager(this);

    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');

    var container = viewletManager.views.serviceConfig.container;
    assert.equal(container.getComputedStyle('display'), 'block');

    // Now render the constraints viewlet which runs hide on the serviceConfig
    // viewlet.
    viewletManager.showViewlet('constraints');
    assert.equal(container.getComputedStyle('display'), 'none');
  });

  it('passes model and attrs to the viewlet render method', function() {
    var render = function(model, attrs) {
      assert.deepEqual(viewletManager.get('model'), model);
      assert.deepEqual(viewletManager.getAttrs(), attrs);
      return 'foo';
    };
    generateViewletManager(this, {render: render});
    viewletManager.render();
  });

  it('allows you to define your own update method', function() {
    generateViewletManager(this, {update: function() {
      return 'foo';
    }});
    var vlKeys = ['serviceConfig', 'constraints'];
    viewletManager.render();
    vlKeys.forEach(function(key) {
      assert.equal(viewletManager.views[key].update(), 'foo');
    });
  });

  it('switches the visible viewlet on request', function() {
    generateViewletManager(this);
    var vlKeys = ['serviceConfig', 'constraints'];
    viewletManager.render();
    vlKeys.forEach(function(key) {
      viewletManager.showViewlet(key);
      assert.equal(
          viewletManager.views[key].container.getStyle('display'), 'block');
    });
  });

  it('removes all elements from the DOM on destroy', function() {
    generateViewletManager(this);
    viewletManager.render();
    assert.equal(container.all('.viewlet-container').size(), 1);
    viewletManager.destroy();
    assert.equal(container.all('.viewlet-container').size(), 0);
  });


  it('only renders elements without a slot by default', function() {
    generateViewletManager(this);
    // Modify one viewlet to have a slot.
    viewletManager.views.constraints.slot = 'left';
    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');

    assert.equal(
        viewletManager.views.serviceConfig
                   .container.getStyle('display'), 'block');
    // Constraints didn't render, not even its container is set.
    assert.equal(viewletManager.views.constraints.container, undefined);
  });

  it('can fill a slot with a viewlet', function() {
    generateViewletManager(this);
    //Define a slot mapping on the container for 'left'
    viewletManager.slots = {
      left: '.left-breakout'
    };
    // And constraints will use that slot.
    viewletManager.views.constraints.slot = 'left';
    assert.equal(viewletManager.views.constraints.container, undefined);
    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');

    // Now render the constraints viewlet.
    viewletManager.showViewlet('unitDetails');
    assert.equal(container.one('.left-breakout .viewlet').get('text'), 'foo');
  });

  it('can replace a slot, removing old bindings and installing a new model',
     function() {
       generateViewletManager(this);
       //Define a slot mapping on the container for 'left'
       viewletManager.slots = {
         left: '.left-breakout'
       };
       // And constraints will use that slot.
       viewletManager.views.constraints.slot = 'left';
       viewletManager.render();
       viewletManager.showViewlet('serviceConfig');

       // Now render the constraints viewlet.
       viewletManager.showViewlet('constraints');
       assert.equal(
           container.one('.left-breakout .viewlet').get('text'), 'foo');

       var replacementModel = new Y.Model({id: 'replacement', name: 'pie'});
       viewletManager.showViewlet('constraints', replacementModel);
       assert.equal(
           container.one('.left-breakout .viewlet').get('text'), 'pie');

       // And the new databindings are working.
       replacementModel.set('name', 'ice cream');
       assert.equal(
           container.one('.left-breakout .viewlet').get('text'), 'ice cream');

       // The old model (still associated with the viewletManager) isn't bound
       // though.
       viewletManager.get('model').set('name', 'broken');
       assert.equal(
           container.one('.left-breakout .viewlet').get('text'), 'ice cream');
     });

  it('can be instantiated without databinding', function() {
    generateViewletManager(this, null, {
      enableDatabinding: false
    });

    assert.strictEqual(viewletManager.bindingEngine, undefined);
  });

  it('can remove a slot from the dom', function() {
    generateViewletManager(this);
    //Define a slot mapping on the container for 'left'
    viewletManager.slots = {
      'left-hand-panel': '.left-breakout'
    };
    // And constraints will use that slot.
    viewletManager.views.constraints.slot = 'left-hand-panel';
    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');

    // Now render the constraints viewlet.
    var constraints = viewletManager.views.constraints;
    constraints.render = function() {
      this.container = Y.Node.create(
          juju.views.Templates['left-breakout-panel']({}));
    };
    viewletManager.showViewlet('constraints');

    assert.equal(
        constraints.container.one('a.close-slot') instanceof Y.Node, true);

    constraints.container.one('.close-slot').simulate('click');

    assert.equal(constraints.container.one('a.close-slot'), null);
  });

  describe('View Support', function() {
    function generateTestView() {
      var TestView = Y.Base.create('testView', Y.View, [], {
        show: function() {
          this.get('container').show();
        },
        hide: function() {
          this.get('container').hide();
        },
        render: function() {
          this.get('container').append('<div class="rendered"></div>');
        }
      });
      return TestView;
    }

    it('accepts new Y.View instances', function() {
      var TestView = generateTestView();
      generateViewletManager(this, null, {
        enableDatabinding: false,
        views: {
          testView: new TestView()
        }
      });
      var testViewInstance = viewletManager.views.testView;
      assert.equal(testViewInstance instanceof Y.View, true);
      assert.deepEqual(testViewInstance.viewletManager, viewletManager);
    });

    it('renders Y.View\'s', function() {
      var TestView = generateTestView();
      generateViewletManager(this, null, {
        enableDatabinding: false,
        views: {
          testView: new TestView()
        }
      });
      viewletManager.render();
      viewletManager.showViewlet('testView');

      assert.isNotNull(viewletManager.get('container').one('.rendered'));
    });

    it('can instantiate Y.View\'s and viewlets simultaneously', function() {
      var TestView = generateTestView();
      generateViewletManager(this, null, {
        enableDatabinding: false,
        views: {
          testView: new TestView()
        }
      }, true);

      assert.equal(viewletManager.views.testView instanceof Y.View, true);
      // When a viewlet is instantiated this property is added. This property
      // cannot exist if the viewlet is not instantiated.
      assert.equal(
          typeof viewletManager.views.serviceConfig._eventHandles, 'object');
    });

    it('can render Y.View\'s and viewlets simultaneously', function() {
      function getContainer() {
        return viewletManager.get('container').one('.viewlet-container');
      }
      var TestView = generateTestView();
      generateViewletManager(this, null, {
        enableDatabinding: false,
        views: {
          testView: new TestView()
        }
      }, true);

      viewletManager.render();
      viewletManager.showViewlet('serviceConfig');
      var container = getContainer();
      var children = container.get('children');

      // Views and viewlets are rendered in order so this order is important
      // to test that the appropriate views are rendered.
      assert.equal(children.item(0).getComputedStyle('display'), 'block');
      assert.equal(children.item(1).getComputedStyle('display'), 'none');
      assert.equal(children.item(2).getComputedStyle('display'), 'none');

      viewletManager.showViewlet('testView');

      assert.equal(children.item(0).getComputedStyle('display'), 'none');
      assert.equal(children.item(1).getComputedStyle('display'), 'none');
      assert.equal(children.item(2).getComputedStyle('display'), 'block');
    });

  });

});
