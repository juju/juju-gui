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

    var UnitDetailsStub = Y.Base.create(
        'unit-details-stub', Y.View, [Y.juju.viewlets.ViewletBaseView], {
          template: Y.Handlebars.compile(
              '<div class="view-container" data-bind="name">{{name}}</div>')
        });

    var ConstraintsStub = Y.Base.create(
        'constraints-stub', Y.View, [Y.juju.viewlets.ViewletBaseView], {
          template: Y.Handlebars.compile(
              '<div class="view-container" data-bind="name">{{name}}</div>')
        });

    managerOptions = Y.mix({
      databinding: {
        interval: 0
      },
      enableDatabinding: true,
      views: {
        unitDetailsStub: UnitDetailsStub,
        constraintsStub: ConstraintsStub
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
      'unit-details-view',
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

  it('sets up a view template instance property', function() {
    generateViewletManager(this);
    assert.equal(typeof viewletManager.template, 'function');
  });

  it('renders its container into the DOM', function() {
    generateViewletManager(this);
    viewletManager.render();
    assert.notEqual(container.one('.yui3-juju-inspector'), null);
  });

  it('passes the manager attrs to the view instances', function() {
    generateViewletManager(this);
    viewletManager.render();
    var unitDetails = viewletManager.views.unitDetailsStub;
    // enableDatabinding is only passed into the viewlet manager so it's
    // presence shows that the attrs was passed through.
    assert.deepEqual(unitDetails.options.enableDatabinding,
      viewletManager.get('enableDatabinding'));
  });

  it('renders all views into the DOM', function() {
    generateViewletManager(this);
    viewletManager.render();
    assert.notEqual(container.one('.yui3-juju-inspector'), null);
    assert.equal(container.all('.view-container').size(), 2);
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

  it('switches the visible view on request', function() {
    generateViewletManager(this);
    viewletManager.render();
    var views = viewletManager.views;
    viewletManager.showViewlet('constraintsStub');
    assert.equal(
        views.constraintsStub.get('container').getStyle('display'),
        'block');
    assert.equal(
        views.unitDetailsStub.get('container').getStyle('display'),
        'none');
    viewletManager.showViewlet('unitDetailsStub');
    assert.equal(
        views.unitDetailsStub.get('container').getStyle('display'),
        'block');
    assert.equal(
        views.constraintsStub.get('container').getStyle('display'),
        'none');
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
    viewletManager.views.constraintsStub.slot = 'left';
    viewletManager.render();
    viewletManager.showViewlet('unitDetailsStub');
    var views = viewletManager.views;
    assert.equal(
        views.unitDetailsStub.get('container').getStyle('display'),
        'block');
    assert.equal(container.all('.view-container').size(), 1);
  });

  it('can fill a slot with a view', function() {
    generateViewletManager(this);
    //Define a slot mapping on the container for 'left'
    viewletManager.slots = {
      'left': '.left-breakout'
    };
    // And unitDetailsStub will use that slot.
    viewletManager.views.unitDetailsStub.slot = 'left';
    viewletManager.render();
    viewletManager.showViewlet('constraintsStub');

    // Now render the unitDetailsStub viewlet.
    viewletManager.showViewlet('unitDetailsStub');
    assert.equal(
        container.one('.left-breakout .view-container').get('text'), 'foo');
  });

  it('can replace a slot, removing old bindings and installing a new model',
     function() {
       generateViewletManager(this);
       //Define a slot mapping on the container for 'left'
       viewletManager.slots = {
         left: '.left-breakout'
       };
       // And unitDetailsStub will use that slot.
       viewletManager.views.unitDetailsStub.slot = 'left';
       viewletManager.render();
       viewletManager.showViewlet('constraintsStub');

       // Now render the unit details view.
       viewletManager.showViewlet('unitDetailsStub');
       assert.equal(
           container.one('.left-breakout .view-container').get('text'), 'foo');

       var replacementModel = new Y.Model({id: 'replacement', name: 'pie'});
       viewletManager.showViewlet('unitDetailsStub', replacementModel);
       assert.equal(
           container.one('.left-breakout .view-container').get('text'), 'pie');

       // And the new databindings are working.
       replacementModel.set('name', 'ice cream');
       assert.equal(
           container.one('.left-breakout .view-container').get('text'),
           'ice cream');

       // The old model (still associated with the viewletManager) isn't bound
       // though.
       viewletManager.get('model').set('name', 'broken');
       assert.equal(
           container.one('.left-breakout .view-container').get('text'),
           'ice cream');
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
    // And unitDetailsStub will use that slot.
    viewletManager.views.unitDetailsStub.slot = 'left-hand-panel';
    viewletManager.render();
    viewletManager.showViewlet('constraintsStub');

    // Now render the unitDetailsStub viewlet.
    var unitDetailsStub = viewletManager.views.unitDetailsStub;
    unitDetailsStub.render = function() {
      this.set('container', Y.Node.create(
          juju.views.Templates['left-breakout-panel']({})));
    };
    viewletManager.showViewlet('unitDetailsStub');
    var container = unitDetailsStub.get('container');
    assert.equal(container.one('a.close-slot') instanceof Y.Node, true);
    container.one('.close-slot').simulate('click');
    assert.equal(
        viewletManager.get('container')
                      .one('.left-breakout').getStyle('display'),
        'none');
  });

  describe('View Support', function() {
    function generateTestView() {
      var TestView = Y.Base.create(
          'testView', Y.View, [Y.juju.viewlets.ViewletBaseView], {
            template: Y.Handlebars.compile('<div class="viewie"></div>')
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

      assert.isNotNull(viewletManager.get('container').one('.viewie'));
    });
  });

});
