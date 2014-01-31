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

  var generateViewletManager = function(context, options, viewletList) {
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

    viewletManager = new Y.juju.viewlets.ViewletManager({
      databinding: {
        interval: 0
      },
      viewlets: {
        serviceConfig: Y.merge(viewletConfig),
        constraints: Y.merge(viewletConfig)
      },
      viewletList: viewletList,
      template: juju.views.Templates['service-config-wrapper'],
      templateConfig: {},
      container: container,
      events: {
        '.tab': { click: function() {} },
        '.close-slot': { click: 'hideSlot' }
      },
      viewletContainer: '.viewlet-container',
      model: new Y.Model({id: 'test', name: 'foo'})
    });
  };

  before(function(done) {
    YUI(GlobalConfig).use([
      'juju-templates',
      'juju-tests-utils',
      'juju-viewlet-manager',
      'node-event-simulate'
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

  it('sets up a viewlet instance property', function() {
    generateViewletManager(this);
    assert.equal(typeof viewletManager.viewlets, 'object');
  });

  it('allows an user configurable event object', function() {
    generateViewletManager(this);
    assert.equal(typeof viewletManager.events['.tab'].click, 'function');
  });

  it('properly nests config properties', function() {
    generateViewletManager(this);
    var cfg = viewletManager.viewletConfig;
    assert.notEqual(cfg.serviceConfig.template.value, undefined);
  });

  it('sets up a view template instance property', function() {
    generateViewletManager(this);
    assert.equal(typeof viewletManager.template, 'function');
  });

  it('generates viewlet instances based on the config', function() {
    generateViewletManager(this);
    var vl = viewletManager.viewlets,
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
    assert.deepEqual(viewletManager.viewlets.serviceConfig.options, expected);
    assert.deepEqual(viewletManager.viewlets.constraints.options, expected);
  });

  it('fails silently when generating invalid viewlet configs', function() {
    // 'foo' does not have a config defined
    generateViewletManager(this, {}, ['serviceConfig', 'foo']);
    var vl = viewletManager.viewlets;
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
      assert.equal(viewletManager.viewlets[key].render(), 'foo');
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

  it('allows you to define your own hide method', function(done) {
    generateViewletManager(this);
    viewletManager.viewlets.serviceConfig.hide = function() {
      // Test passes by hitting done and getting called.
      done();
    };

    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');
  });

  it('provides a sane default hide method', function() {
    generateViewletManager(this);

    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');

    var container = viewletManager.viewlets.serviceConfig.container;
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
      assert.equal(viewletManager.viewlets[key].update(), 'foo');
    });
  });

  it('switches the visible viewlet on request', function() {
    generateViewletManager(this);
    var vlKeys = ['serviceConfig', 'constraints'];
    viewletManager.render();
    vlKeys.forEach(function(key) {
      viewletManager.showViewlet(key);
      assert.equal(
          viewletManager.viewlets[key].container.getStyle('display'), 'block');
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
    viewletManager.viewlets.constraints.slot = 'left';
    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');

    assert.equal(
        viewletManager.viewlets.serviceConfig
                   .container.getStyle('display'), 'block');
    // Constraints didn't render, not even its container is set.
    assert.equal(
        viewletManager.viewlets.constraints.container, undefined);
  });

  it('can fill a slot with a viewlet', function() {
    generateViewletManager(this);
    //Define a slot mapping on the container for 'left'
    viewletManager.slots = {
      left: '.left-breakout'
    };
    // And constraints will use that slot.
    viewletManager.viewlets.constraints.slot = 'left';
    assert.equal(
        viewletManager.viewlets.constraints.container, undefined);
    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');

    // Now render the constraints viewlet.
    viewletManager.showViewlet('constraints');
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
       viewletManager.viewlets.constraints.slot = 'left';
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

  it('can remove a slot from the dom', function() {
    generateViewletManager(this);
    //Define a slot mapping on the container for 'left'
    viewletManager.slots = {
      'left-hand-panel': '.left-breakout'
    };
    // And constraints will use that slot.
    viewletManager.viewlets.constraints.slot = 'left-hand-panel';
    viewletManager.render();
    viewletManager.showViewlet('serviceConfig');

    // Now render the constraints viewlet.
    var constraints = viewletManager.viewlets.constraints;
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

});
