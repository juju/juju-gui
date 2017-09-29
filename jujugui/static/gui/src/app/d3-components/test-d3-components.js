/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const Component = require('./d3-components');
const testUtils = require('../../test/utils');
const viewUtils = require('../views/utils');

describe('d3-components', function() {
  let TestModule, state, container, comp;

  beforeEach(function() {
    TestModule = class {
      constructor(options={}) {
        this.name = options.name || 'TestModule';
        this.container = options.container;
        this.events = {
          scene: { '.thing': {click: 'decorateThing'}},
          d3: {'.target': {click: 'targetTarget'}},
          topo: {
            cancel: 'cancelHandler'
          },
          window: {
            resize: 'windowResizeHandler'
          }
        };
      }

      decorateThing(evt) {
        state.thing = 'decorated';
      }

      targetTarget(evt) {
        state.targeted = true;
      }

      cancelHandler(evt) {
        state.cancelled = true;
      }

      destroy() {}
    };
    container = testUtils.makeContainer(this, 'container');
    const button1 = document.createElement('button');
    button1.classList.add('thing');
    container.appendChild(button1);
    const button2 = document.createElement('button');
    button2.classList.add('target');
    container.appendChild(button2);
    state = {};
  });

  afterEach(function() {
    if (comp) {
      comp.destructor();
    }
    state = null;
    TestModule = null;
    container = null;
  });


  it('should be able to create a component and add a module', function() {
    comp = new Component();
    viewUtils.isValue(comp).should.equal(true);
  });

  it('should be able to add and remove a module', function() {
    comp = new Component({container: container});
    comp.addModule(TestModule);
    viewUtils.isValue(comp.events).should.equal(true);
    viewUtils.isValue(comp.modules).should.equal(true);
  });

  it('should be able to (un)bind module event subscriptions', function() {
    comp = new Component({container: container});
    comp.addModule(TestModule, {container: container});

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
    container.querySelector('.thing').click();
    state.thing.should.equal('decorated');
  });

  it('should allow event bindings through the use of a declarative object',
    function() {
      comp = new Component({container: container});

      // Change test module to use rich captures on some events.
      // This defines a phase for click (before, after, on (default))
      // and also shows an inline callback (which is discouraged but allowed)
      class modA extends TestModule {
        constructor(options) {
          super(options);
          this.events.scene['.thing'] = {
            click: {
              phase: 'after',
              callback: 'afterThing'
            },
            dblclick: {
              phase: 'on',
              callback: function(evt) {
                state.dbldbl = true;
              }
            }
          };
        }

        afterThing(evt) {
          state.clicked = true;
        }
      }
      comp.addModule(modA, {name: 'modA', container: container});
      comp.render();

      container.querySelector('.thing').click();
      assert.strictEqual(state.clicked, true);

      const event = new MouseEvent('dblclick', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      container.querySelector('.thing').dispatchEvent(event);
      assert.strictEqual(state.dbldbl, true);
    });

  it('should correctly handle synthetic event bindings', function(done) {
    comp = new Component({container: container});
    class modA extends TestModule {
      windowResizeHandler(evt) {
        resized = true;
        done();
      }
    }
    var resized = false;
    comp.addModule(modA, {name: 'modA', container: container});
    window.dispatchEvent(new Event('resize'));
    assert.isTrue(resized);
  });

  it('deep clones event objects to avoid shared bindings', function() {
    var compA = new Component({container: container});
    compA.addModule(TestModule);
    compA.render();

    var containerB = testUtils.makeContainer(this, 'foo');
    var compB = new Component({container: containerB});
    compB.addModule(TestModule);
    compB.render();

    assert.notEqual(compA.events.TestModule.subscriptions[1].callable,
      compB.events.TestModule.subscriptions[1].callable);

    // Cleanup
    compA.unbind();
    compB.unbind();
  });

  it('should support basic rendering from all modules',
    function() {
      class modA extends TestModule {
        render() {
          const node = document.createElement('div');
          node.setAttribute('id', 'fromA');
          this.container.appendChild(node);
        }
      }

      class modB extends TestModule {
        render() {
          const node = document.createElement('div');
          node.setAttribute('id', 'fromB');
          this.container.appendChild(node);
        }
      }

      comp = new Component({container: container});

      comp.addModule(modA, {name: 'modA', container: container});
      comp.addModule(modB, {name: 'modB', container: container});

      comp.render();
      viewUtils.isValue(document.querySelector('#fromA')).should.equal(true);
      viewUtils.isValue(document.querySelector('#fromB')).should.equal(true);
    });

  it('should support d3 event bindings post render', function() {
    comp = new Component({container: container});

    comp.addModule(TestModule);

    comp.render();

    // This is a d3 bound handler that occurs only after render.
    document.querySelector('.target').click();
    state.targeted.should.equal(true);
  });

});
