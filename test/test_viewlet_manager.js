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

  var generateViewletManager = function(options, viewletList) {
    container = utils.makeContainer();
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
      template: juju.views.Templates['viewlet-manager'],
      templateConfig: {},
      container: container,
      events: {
        '.tab': {'click': function() {}}
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
    container.remove().destroy(true);
  });

  it('sets up a viewlet instance property', function() {
    generateViewletManager();
    assert.equal(typeof viewletManager.viewlets, 'object');
  });

  it('allows an user configurable event object', function() {
    generateViewletManager();
    assert.equal(typeof viewletManager.events['.tab'].click, 'function');
  });

  it('properly nests config properties', function() {
    generateViewletManager();
    var cfg = viewletManager.viewletConfig;
    assert.notEqual(cfg.serviceConfig.template.value, undefined);
  });

  it('sets up a view template instance property', function() {
    generateViewletManager();
    assert.equal(typeof viewletManager.template, 'function');
  });

  it('generates viewlet instances based on the config', function() {
    generateViewletManager();
    var vl = viewletManager.viewlets,
        vlKeys = ['serviceConfig', 'constraints'];
    vlKeys.forEach(function(key) {
      assert.equal(typeof vl[key], 'object');
    });
  });

  it('fails silently when generating invalid viewlet configs', function() {
    // 'foo' does not have a config defined
    generateViewletManager({}, ['serviceConfig', 'foo']);
    var vl = viewletManager.viewlets;
    assert.equal(typeof vl.serviceConfig, 'object');
    assert.equal(typeof vl.foo, 'undefined');
  });

  it('renders its container into the DOM', function() {
    generateViewletManager();
    viewletManager.render();
    assert.notEqual(container.one('.viewlet-wrapper'), null);
  });

  it('renders all viewlets into the DOM', function() {
    generateViewletManager();
    viewletManager.render();
    assert.notEqual(container.one('.viewlet-wrapper'), null);
    assert.equal(container.all('.viewlet-container').size(), 1);
    assert.equal(container.all('.viewlet').size(), 2);
  });

  it('allows you to define your own render method', function() {
    generateViewletManager({ render: function() {
      return 'foo';
    }});
    var vlKeys = ['serviceConfig', 'constraints'];

    viewletManager.render();
    vlKeys.forEach(function(key) {
      assert.equal(viewletManager.viewlets[key].render(), 'foo');
    });
  });

  it('passes model and attrs to the viewlet render method', function() {
    var render = function(model, attrs) {
      assert.deepEqual(viewletManager.get('model'), model);
      assert.deepEqual(viewletManager.getAttrs(), attrs);
      return 'foo';
    };
    generateViewletManager({render: render});
    viewletManager.render();
  });

  it('allows you to define your own update method', function() {
    generateViewletManager({update: function() {
      return 'foo';
    }});
    var vlKeys = ['serviceConfig', 'constraints'];
    viewletManager.render();
    vlKeys.forEach(function(key) {
      assert.equal(viewletManager.viewlets[key].update(), 'foo');
    });
  });

  it('switches the visible viewlet on request', function() {
    generateViewletManager();
    var vlKeys = ['serviceConfig', 'constraints'];
    viewletManager.render();
    vlKeys.forEach(function(key) {
      viewletManager.showViewlet(key);
      assert.equal(
          viewletManager.viewlets[key].container.getStyle('display'), 'block');
    });
  });

  it('removes all elements from the DOM on destroy', function() {
    generateViewletManager();
    viewletManager.render();
    assert.equal(container.all('.viewlet-container').size(), 1);
    viewletManager.destroy();
    assert.equal(container.all('.viewlet-container').size(), 0);
  });


  it('only renders elements without a slot by default', function() {
    generateViewletManager();
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
    generateViewletManager();
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
       generateViewletManager();
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
    generateViewletManager();
    //Define a slot mapping on the container for 'left'
    viewletManager.slots = {
      left: '.left-breakout'
    };
    // And constraints will use that slot.
    viewletManager.viewlets.constraints.slot = 'left';
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
        typeof constraints.container
                          .one('.left-breakout .close-slot'), 'object');

    container.one('.left-breakout .close-slot').simulate('click');
    assert.equal(constraints.container.one('.left-breakout .close-slot'), null);
  });

});
