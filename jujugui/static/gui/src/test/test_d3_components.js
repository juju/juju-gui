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
  let NS, TestModule, modA, state,
      container, comp, utils, viewUtils;

  beforeAll(function(done) {
    YUI(GlobalConfig).use(['d3-components',
      'juju-tests-utils',
      'juju-view-utils',
      'node'],
    function(Y) {
      NS = Y.namespace('d3-components');

      TestModule = Y.Base.create('TestModule', NS.Module, [], {
        events: {
          scene: { '.thing': {click: 'decorateThing'}},
          d3: {'.target': {click: 'targetTarget'}},
          topo: {
            cancel: 'cancelHandler'
          },
          window: {
            resize: 'windowResizeHandler'
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
      viewUtils = Y.namespace('juju.views.utils');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    const button1 = document.createElement('button');
    button1.classList.add('thing');
    container.appendChild(button1);
    const button2 = document.createElement('button');
    button2.classList.add('target');
    container.appendChild(button2);
    state = {};
  });

  afterEach(function() {
    container.remove();
    if (comp) {
      comp.unbind();
    }
  });


  it('should be able to create a component and add a module', function() {
    comp = new NS.Component();
    viewUtils.isValue(comp).should.equal(true);
  });

  it('should be able to add and remove a module', function() {
    comp = new NS.Component();
    comp.setAttrs({container: container});
    comp.addModule(TestModule);
    viewUtils.isValue(comp.events).should.equal(true);
    viewUtils.isValue(comp.modules).should.equal(true);
  });

  it('should be able to (un)bind module event subscriptions', function() {
    comp = new NS.Component();
    comp.setAttrs({container: container});
    comp.addModule(TestModule);

    // Test that default bindings work by simulating
    document.dispatchEvent(new Event('topo.cancel'));
    state.cancelled.should.equal(true);

    // XXX: While on the plane I determined that things like
    // 'events' are sharing state with other runs/modules.
    // This must be fixed before this can work again.

    // Manually set state, remove the module and test again
    state.cancelled = false;
    comp.removeModule('TestModule');

    document.dispatchEvent(new Event('topo.cancel'));
    state.cancelled.should.equal(false);

    // Adding the module back again doesn't create any issues.
    comp.addModule(TestModule);
    document.dispatchEvent(new Event('topo.cancel'));
    state.cancelled.should.equal(true);

    // Simulated events on DOM handlers better work.
    // These require a bound DOM element however
    comp.render();
    document.querySelector('.thing').click();
    assert.equal(state.thing, 'decorated');
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

      document.querySelector('.thing').click();
      assert.equal(state.clicked, true);

      const event = new MouseEvent('dblclick', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      document.querySelector('.thing').dispatchEvent(event);
      state.dbldbl.should.equal(true);

    });

  it('should correctly handle synthetic event bindings', function(done) {
    comp = new NS.Component();
    comp.setAttrs({container: container});
    modA = new TestModule();
    var resized = false;
    modA.windowResizeHandler = function(evt) {
      resized = true;
      done();
    };
    comp.addModule(modA);
    window.dispatchEvent(new Event('resize'));
    assert.isTrue(resized);
  });

  it('deep clones event objects to avoid shared bindings', function() {
    var compA = new NS.Component({container: container});
    compA.addModule(TestModule);
    compA.render();

    var containerB = utils.makeContainer(this, 'foo');
    var compB = new NS.Component({container: containerB});
    compB.addModule(TestModule);
    compB.render();

    assert.notEqual(compA.events.TestModule.subscriptions[1].callable,
      compB.events.TestModule.subscriptions[1].callable);

    // Cleanup
    compA.unbind();
    compB.unbind();
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
        const node = document.createElement('div');
        node.setAttribute('id', 'fromA');
        this.get('container').appendChild(node);
      };

      modB.name = 'modb';
      modB.render = function() {
        const node = document.createElement('div');
        node.setAttribute('id', 'fromB');
        this.get('container').appendChild(node);
      };

      comp.setAttrs({container: container});
      comp.addModule(modA)
        .addModule(modB);

      comp.render();
      viewUtils.isValue(document.querySelector('#fromA')).should.equal(true);
      viewUtils.isValue(document.querySelector('#fromB')).should.equal(true);
    });

  it('should support d3 event bindings post render', function() {
    comp = new NS.Component();
    comp.setAttrs({container: container});

    comp.addModule(TestModule);

    comp.render();

    // This is a d3 bound handler that occurs only after render.
    document.querySelector('.target').click();
    state.targeted.should.equal(true);
  });

});
