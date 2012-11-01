'use strict';

describe.only('d3-components', function() {
  var Y, NS, TestModule, modA, state,
      container;

  before(function(done) {
    Y = YUI(GlobalConfig).use('d3-components',
      function(Y) {
        NS = Y.namespace('d3');

        container = Y.Node.create('<div id="test">' +
                                  '<button class="thing"></button>' +
                                  'button class="target"></button>' +
                                  '</div>');

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

        done();
      });
  });

  beforeEach(function() {
    state = {};
  });


  it('should be able to create a component and add a module', function() {
        var c = new NS.Component();
        c.should.be.ok;
      });

  it('should be able to add and remove a module', function() {
    var c = new NS.Component();
    c.setAttrs({container: container});
    c.addModule(TestModule);
  });

  it('should be able to (un)bind module events and subscriptions', function() {
    var c = new NS.Component();
    c.setAttrs({container: container});
    c.addModule(TestModule);

    // Test that default bindings work by simulating
    Y.fire('cancel');
    state.cancelled.should.equal(true);

    // Manually set state, remove the module and test again
    state.cancelled = false;
    c.removeModule('TestModule');

    Y.fire('cancel');
    state.cancelled.should.equal(false);

    // Adding the module back again doesn't create any issues.
    c.addModule(TestModule);
    Y.fire('cancel');
    state.cancelled.should.equal(true);
  });
});


