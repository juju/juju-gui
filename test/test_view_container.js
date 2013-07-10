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

describe('View Container', function() {
  var Y, juju, viewContainer, utils, container;

  var fakeController = function() {};
  fakeController.prototype.bind = function() { /* noop */};

  var generateViewContainer = function(options) {
    container = utils.makeContainer();

    // Merging Mix.
    var viewletConfig = Y.mix({
      template: '<div class="viewlet" data-bind="name">{{name}}</div>'
    }, options || {}, false, undefined, 0, true);


    viewContainer = new Y.juju.views.ViewContainer({
      viewlets: {
        serviceConfig: Y.merge(viewletConfig),
        constraints: Y.merge(viewletConfig)
      },
      template: juju.views.Templates['view-container'],
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
      'juju-view-container',
      'juju-templates',
      'juju-tests-utils'],
    function(y) {
      Y = y;
      juju = y.namespace('juju');
      utils = Y['juju-tests'].utils;
      done();
    });
  });

  afterEach(function(done) {
    // destroy is async
    viewContainer.after('destroy', function() {
      done();
    });
    viewContainer.destroy();
    container.remove().destroy(true);
  });

  it('sets up a viewlet instance property', function() {
    generateViewContainer();
    assert.equal(typeof viewContainer.viewlets, 'object');
  });

  it('allows an user configurable event object', function() {
    generateViewContainer();
    assert.equal(typeof viewContainer.events['.tab'].click, 'function');
  });

  it('properly nests config properties', function() {
    generateViewContainer();
    var cfg = viewContainer.viewletConfig;
    assert.notEqual(cfg.serviceConfig.template.value, undefined);
  });

  it('sets up a view template instance property', function() {
    generateViewContainer();
    assert.equal(typeof viewContainer.template, 'function');
  });

  it('generates viewlet instances based on the config', function() {
    generateViewContainer();
    var vl = viewContainer.viewlets,
        vlKeys = ['serviceConfig', 'constraints'];
    vlKeys.forEach(function(key) {
      assert.equal(typeof vl[key], 'object');
    });
  });

  it('renders its container into the DOM', function() {
    generateViewContainer();
    viewContainer.render();
    assert.notEqual(container.one('.view-container-wrapper'), null);
  });

  it('renders all viewlets into the DOM', function() {
    generateViewContainer();
    viewContainer.render();
    assert.notEqual(container.one('.view-container-wrapper'), null);
    assert.equal(container.all('.viewlet-container').size(), 1);
    assert.equal(container.all('.viewlet').size(), 2);
  });

  it('allows you to define your own render method', function() {
    generateViewContainer({ render: function() {
      return 'foo';
    }});
    var vlKeys = ['serviceConfig', 'constraints'];

    viewContainer.render();
    vlKeys.forEach(function(key) {
      assert.equal(viewContainer.viewlets[key].render(), 'foo');
    });
  });

  it('allows you to define your own update method', function() {
    generateViewContainer({update: function() {
      return 'foo';
    }});
    var vlKeys = ['serviceConfig', 'constraints'];
    viewContainer.render();
    vlKeys.forEach(function(key) {
      assert.equal(viewContainer.viewlets[key].update(), 'foo');
    });
  });

  it('switches the visible viewlet on request', function() {
    generateViewContainer();
    var vlKeys = ['serviceConfig', 'constraints'];
    viewContainer.render();
    vlKeys.forEach(function(key) {
      viewContainer.showViewlet(key);
      assert.equal(
          viewContainer.viewlets[key].container.getStyle('display'), 'block');
    });
  });

  it('removes all elements from the DOM on destroy', function() {
    generateViewContainer();
    viewContainer.render();
    assert.equal(container.all('.viewlet-container').size(), 1);
    viewContainer.destroy();
    assert.equal(container.all('.viewlet-container').size(), 0);
  });


  it('only renders elements without a slot by default', function() {
    generateViewContainer();
    // Modify one viewlet to have a slot.
    viewContainer.viewlets.constraints.slot = 'left';
    viewContainer.render();
    viewContainer.showViewlet('serviceConfig');

    assert.equal(
        viewContainer.viewlets.serviceConfig
                   .container.getStyle('display'), 'block');
    // Constraints didn't render, not even its container is set.
    assert.equal(
        viewContainer.viewlets.constraints.container, undefined);
  });

  it('can fill a slot with a viewlet', function() {
    generateViewContainer();
    //Define a slot mapping on the container for 'left'
    viewContainer.slots = {
      left: '.left'
    };
    // And constraints will use that slot.
    viewContainer.viewlets.constraints.slot = 'left';
    assert.equal(
        viewContainer.viewlets.constraints.container, undefined);
    viewContainer.render();
    viewContainer.showViewlet('serviceConfig');

    // Now render the constraints viewlet.
    viewContainer.showViewlet('constraints');
    assert.equal(container.one('.left .viewlet').get('text'), 'foo');
  });

  it('can replace a slot, removing old bindings and installing a new model',
     function() {
       generateViewContainer();
       //Define a slot mapping on the container for 'left'
       viewContainer.slots = {
         left: '.left'
       };
       // And constraints will use that slot.
       viewContainer.viewlets.constraints.slot = 'left';
       viewContainer.render();
       viewContainer.showViewlet('serviceConfig');

       // Now render the constraints viewlet.
       viewContainer.showViewlet('constraints');
       assert.equal(container.one('.left .viewlet').get('text'), 'foo');

       var replacementModel = new Y.Model({id: 'replacement', name: 'pie'});
       viewContainer.showViewlet('constraints', replacementModel);
       assert.equal(container.one('.left .viewlet').get('text'), 'pie');

       // And the new databindings are working.
       replacementModel.set('name', 'ice cream');
       assert.equal(container.one('.left .viewlet').get('text'), 'ice cream');

       // The old model (still associated with the viewContainer) isn't bound
       // though.
       viewContainer.get('model').set('name', 'broken');
       assert.equal(container.one('.left .viewlet').get('text'), 'ice cream');
     });

});
