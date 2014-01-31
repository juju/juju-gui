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

describe('d3-components', function() {
  var Y, NS, TestModule, modA, state,
      container, comp, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['d3-components',
      'juju-tests-utils',
      'node',
      'node-event-simulate'],
    function(Y) {
      NS = Y.namespace('d3');

      TestModule = Y.Base.create('TestModule', NS.Module, [], {
        events: {
          scene: { '.thing': {click: 'decorateThing'}},
          d3: {'.target': {click: 'targetTarget'}},
          yui: {
            cancel: 'cancelHandler'
          }
        },

        decorateThing: function(evt) {
          state.thing = 'decorated';
        },

        targetTarget: function(evt) {
          state.targeted = true;
        },

        cancelHandler: function(evt) {
          state.cancelled = true;
        }
      });
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    container.append(Y.Node.create('<button/>')
             .addClass('thing'))
             .append(Y.Node.create('<button/>')
             .addClass('target'));
    state = {};
  });

  afterEach(function() {
    if (comp) {
      comp.unbind();
    }
  });


  it('should be able to create a component and add a module', function() {
    comp = new NS.Component();
    Y.Lang.isValue(comp).should.equal(true);
  });

  it('should be able to add and remove a module', function() {
    comp = new NS.Component();
    comp.setAttrs({container: container});
    comp.addModule(TestModule);
    Y.Lang.isValue(comp.events).should.equal(true);
    Y.Lang.isValue(comp.modules).should.equal(true);
  });

  it('should be able to (un)bind module event subscriptions', function() {
    comp = new NS.Component();
    comp.setAttrs({container: container});
    comp.addModule(TestModule);

    // Test that default bindings work by simulating
    comp.fire('cancel');
    state.cancelled.should.equal(true);

    // XXX: While on the plane I determined that things like
    // 'events' are sharing state with other runs/modules.
    // This must be fixed before this can work again.

    // Manually set state, remove the module and test again
    state.cancelled = false;
    comp.removeModule('TestModule');

    comp.fire('cancel');
    state.cancelled.should.equal(false);

    // Adding the module back again doesn't create any issues.
    comp.addModule(TestModule);
    comp.fire('cancel');
    state.cancelled.should.equal(true);

    // Simulated events on DOM handlers better work.
    // These require a bound DOM element however
    comp.render();
    Y.one('.thing').simulate('click');
    state.thing.should.equal('decorated');
  });

  it('should allow event bindings through the use of a declarative object',
     function() {
       comp = new NS.Component();
       comp.setAttrs({container: container});

       // Change test module to use rich captures on some events.
       // This defines a phase for click (before, after, on (default))
       // and also shows an inline callback (which is discouraged but allowed)
       modA = new TestModule();
       modA.events.scene['.thing'] = {
         click: {phase: 'after',
           callback: 'afterThing'},
         dblclick: {phase: 'on',
           callback: function(evt) {
             state.dbldbl = true;
           }}};
       modA.afterThing = function(evt) {
         state.clicked = true;
       };
       comp.addModule(modA);
       comp.render();

       Y.one('.thing').simulate('click');
       state.clicked.should.equal(true);

       Y.one('.thing').simulate('dblclick');
       state.dbldbl.should.equal(true);

     });

  it('should correctly handle synthetic event bindings', function(done) {
    comp = new NS.Component();
    comp.setAttrs({container: container});
    modA = new TestModule();
    var resized = false;
    modA.windowResizeHandler = function(evt) {
      resized = true;
    };
    modA.events.yui.windowresize = {
      callback: 'windowResizeHandler',
      context: 'window'};
    comp.addModule(modA);
    var subscription = Y.after('windowresize', function(evt) {
      subscription.detach();
      assert.isTrue(resized);
      done();
    });
    Y.one('window').simulate('resize');
  });

  it('deep clones event objects to avoid shared bindings', function() {
    var compA = new NS.Component({container: container});
    compA.addModule(TestModule);
    compA.render();

    var containerB = utils.makeContainer(this, 'foo');
    var compB = new NS.Component({container: containerB});
    compB.addModule(TestModule);
    compB.render();

    assert.notEqual(compA.events.TestModule.subscriptions[1].evt.id,
                    compB.events.TestModule.subscriptions[1].evt.id);

    // Cleanup
    compA.destroy();
    compB.destroy();
  });

  it('should support basic rendering from all modules',
     function() {
       var modA = new TestModule(),
           modB = new TestModule();

       comp = new NS.Component();
       // Give each of these a render method that adds to container
       modA.name = 'moda';
       modA.render = function() {
         this.get('container').append(Y.Node.create('<div id="fromA"></div>'));
       };

       modB.name = 'modb';
       modB.render = function() {
         this.get('container').append(Y.Node.create('<div id="fromB"></div>'));
       };

       comp.setAttrs({container: container});
       comp.addModule(modA)
        .addModule(modB);

       comp.render();
       Y.Lang.isValue(Y.one('#fromA')).should.equal(true);
       Y.Lang.isValue(Y.one('#fromB')).should.equal(true);
     });

  it('should support d3 event bindings post render', function() {
    comp = new NS.Component();
    comp.setAttrs({container: container});

    comp.addModule(TestModule);

    comp.render();

    // This is a d3 bound handler that occurs only after render.
    container.one('.target').simulate('click');
    state.targeted.should.equal(true);
  });

});
