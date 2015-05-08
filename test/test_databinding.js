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

describe('data binding library', function() {
  var Y, BindingEngine, utils, viewlet, engine, container;

  var generateEngine = function(context, input) {
    container = utils.makeContainer(context);
    container.setHTML(input);
    viewlet = Object.create({
      name: 'testViewlet',
      container: container,
      changedValues: {},
      _eventHandles: [],
      syncedFields: function() {
        this.calledSyncedFields = true;
      },
      unsyncedFields: function() {
        this.calledUnsyncedFields = true;
      },
      conflict: function() {
        this.conflictArgs = Array.prototype.slice.call(arguments);
      },
      changed: function() {
        this.changedArgs = Array.prototype.slice.call(arguments);
      }
    });
    engine = new BindingEngine({interval: 0});
  };

  before(function(done) {
    var requires = ['juju-databinding',
                    'base', 'handlebars',
                    'model', 'model-list', 'node-event-simulate'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
      utils = window.jujuTestUtils.utils;
      BindingEngine = Y.namespace('juju.views').BindingEngine;
      done();
    });
  });

  describe('supports declarative bindings', function() {
    var model;

    describe('binding tests', function() {

      it('bind should fail on invalid DOM', function() {
        engine = new BindingEngine({interval: 0});
        assert.throws(function() {engine.bind(new Y.Model(), null);},
                      'Unable to bind, invalid Viewlet');
      });

      it('maintains proper binding references', function() {
        container = utils.makeContainer(this);
        container.append('<div data-bind="a"></div>');

        var viewlet = {
          container: container,
          changedValues: {},
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'b');
      });

      it('supports more than one binding to a single model attr',
          function(done) {
            // We intentionally run this test with an interval, so we need to
            // wait. This is because the change interval can mask certain types
            // of errors and we want the space to see that this acutally works.
            engine = new BindingEngine({interval: 50});
            container = utils.makeContainer(this);
            container.append('<input data-bind="a"/>');
            container.append('<input data-bind="a"/>');
            var viewlet = {
              container: container,
              changedValues: {},
              _eventHandles: []
            };
            var model = new Y.Model({a: 'b'});
            engine.bind(model, viewlet);
            // Trigger the change event.
            model.set('a', 'c');
            setTimeout(function() {
              var nodes = container.all('input');
              assert.equal(nodes.item(0).get('value'), 'c');
              assert.equal(nodes.item(1).get('value'), 'c');
              done();
            }, 100);
          });

      it('can reset viewlets back to model values', function() {
        generateEngine(this, '<input data-bind="a"/>');
        var model = new Y.Model({a: 'b'});
        engine.bind(model, viewlet);
        // It renders with the model value
        var node = container.one('input');
        assert.equal(node.get('value'), 'b');

        // We manually change the form
        node.set('value', 'the new newness');
        assert.equal(node.get('value'), 'the new newness');
        engine._nodeChanged(node, viewlet);
        assert.deepEqual(viewlet.changedValues, {a: true});

        // But then we reset
        engine.resetDOMToModel();
        assert.lengthOf(Object.keys(viewlet.changedValues), 0);
        assert.equal(node.get('value'), 'b');
        assert.equal(model.get('a'), 'b');

        // Bindings continue to work after reset.
        model.set('a', 'c');
        assert.equal(node.get('value'), 'c');
      });

      it('can reset a viewlet back to model values', function() {
        // Very similar  to the previous test, this checks
        // that the binding filtering by viewlet runs and produces
        // the expected outcome.
        generateEngine(this, '<input data-bind="a"/>');
        var model = new Y.Model({a: 'b'});
        engine.bind(model, viewlet);
        // It renders with the model value
        var node = container.one('input');
        assert.equal(node.get('value'), 'b');

        // We manually change the form
        node.set('value', 'the new newness');
        assert.equal(node.get('value'), 'the new newness');

        // But then we reset
        engine.resetDOMToModel('testViewlet');
        assert.equal(node.get('value'), 'b');
        assert.equal(model.get('a'), 'b');

        // Bindings continue to work after reset.
        model.set('a', 'c');
        assert.equal(node.get('value'), 'c');
      });

      it('supports nested model bindings', function() {
        container = utils.makeContainer(this);
        container.append('<div data-bind="a.b.c.d"></div>');

        var viewlet = {
          container: container,
          changedValues: {},
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});

        engine.bind(new Y.Model({a: {b: {c: {d: 'nested'}}
              }}), viewlet);
        // The default model object should be in place.
        assert.equal(container.one('[data-bind="a.b.c.d"]').getHTML(),
                     'nested');
      });

      it('inherits functions from object attributes to its properties',
         function() {
           container = utils.makeContainer(this);
           container.append('<div data-bind="a.b"></div>');

           var viewlet = {
             container: container,
             changedValues: {},
             _eventHandles: [],
             bindings: {
               a: {
                 format: function() {return 'parent';}
               }
             }
           };
           engine = new BindingEngine({interval: 0});

           engine.bind(new Y.Model({a: {b: 'child'}}), viewlet);
           assert.equal(container.one('[data-bind="a.b"]').getHTML(),
                        'parent');
         });

      it('does not override child property methods',
         function() {
           container = utils.makeContainer(this);
           container.append('<div data-bind="a.b"></div>');

           var viewlet = {
             container: container,
             changedValues: {},
             _eventHandles: [],
             bindings: {
               a: {
                 format: function() {return 'parent';}
               },
               'a.b': {
                 format: function() { return 'child format';}
               }
             }
           };
           engine = new BindingEngine({interval: 0});

           engine.bind(new Y.Model({a: {b: 'child'}}), viewlet);
           assert.equal(container.one('[data-bind="a.b"]').getHTML(),
           'child format');
         });

      it('supports formatters', function() {
        container = utils.makeContainer(this);
        container.append('<div data-bind="a"></div>');

        var viewlet = {
          container: container,
          _eventHandles: [],
          bindings: {
            a: {
              format: function(value) {
                return value + 'FORMATTED';
              }
            }
          },
          changedValues: {}
        };
        engine = new BindingEngine({interval: 0});
        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'bFORMATTED');
      });

      it('supports callbacks on binding updates', function() {
        container = utils.makeContainer(this);
        container.append('<div data-bind="a"></div>');

        var viewlet = {
          container: container,
          bindings: {
            a: {
              update: function(node, value) {
                node.set('text', 'overide');
              }
            }
          },
          changedValues: {},
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'overide');
      });

      it('supports before/after callbacks on binding updates', function() {
        container = utils.makeContainer(this);
        container.append('<div data-bind="a"></div>');

        var viewlet = {
          container: container,
          bindings: {
            a: {
              beforeUpdate: function(node, value) {
                node.set('text', 'a');
              },
              update: function(node, value) {
                node.set('text', node.get('text') + 'b');
              },
              afterUpdate: function(node, value) {
                node.set('text', node.get('text') + 'c');
              }
            }
          },
          changedValues: {},
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'abc');
      });

      it('update callback uses formatted value', function() {
        container = utils.makeContainer(this);
        container.append('<div data-bind="a"></div>');

        var viewlet = {
          container: container,
          bindings: {
            a: {
              format: function() {return 'hi';},
              update: function(node, value) {
                node.set('text', value);
              }
            }
          },
          changedValues: {},
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'hi');
      });

      describe('wildcard support', function() {
        it('supports * styled wildcard bindings', function() {
          container = utils.makeContainer(this);
          container.append('<div data-bind="a"></div>');

          var result;
          var viewlet = {
            container: container,
            bindings: {
              '*': {
                beforeUpdate: function() {
                  result = [];

                },
                update: function() {
                  result.push(1);
                },
                afterUpdate: function() {
                  result.push(true);
                }
              }
            },
            changedValues: {},
            _eventHandles: []
          };
          engine = new BindingEngine({interval: 0});
          var model = new Y.Model({a: 'a'});
          engine.bind(model, viewlet);
          model.set('a', 'b');
          assert.equal(result[0], 1);
          assert.equal(result[1], true);
        });

        it('supports + styled wildcard bindings', function() {
          container = utils.makeContainer(this);
          container.append('<div data-bind="a"/>' +
                           '<div data-bind="b"/>');

          var result = [];
          var viewlet = {
            container: container,
            bindings: {
              '+': {
                beforeUpdate: function() {
                  result = [];
                },
                update: function(node, value) {
                  result.push(node.getData('bind'));
                }
              }
            },
            changedValues: {},
            _eventHandles: []
          };
          engine = new BindingEngine({interval: 0});
          var model = new Y.Model({a: 'a'});
          engine.bind(model, viewlet);
          model.set('a', 'b');
          // The important part here is that update
          // could have been invoked for both a and b
          // but only a changed and so only a appears
          // in the result set.
          assert.equal(result[0], 'a');
          assert.equal(result.length, 1);
        });
      });
    });

    describe('field types', function() {

      afterEach(function() {
        viewlet = null;
        engine = null;
      });

      it('binds strings to inputs', function() {
        generateEngine(this, '<input type="text" data-bind="a"></input>');
        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').get('value'), 'b');
      });

      it('supports eq for string inputs', function() {
        var model = new Y.Model({a: undefined});
        generateEngine(this, '<input type="text" data-bind="a"></input>');
        var input = container.one('[data-bind=a]');
        engine.bind(model, viewlet);
        var handler = engine.getNodeHandler(input.getDOMNode());
        assert.isTrue(handler.eq(input, undefined));
        assert.isTrue(handler.eq(input, ''));
        assert.isFalse(handler.eq(input, 42));
        model.set('a', 42);
        assert.isTrue(handler.eq(input, 42));
        assert.isTrue(handler.eq(input, '42'));
        assert.isFalse(handler.eq(input, undefined));
        assert.isFalse(handler.eq(input, ''));
        model.set('a', '42');
        assert.isTrue(handler.eq(input, 42));
        assert.isTrue(handler.eq(input, '42'));
        assert.isFalse(handler.eq(input, undefined));
        assert.isFalse(handler.eq(input, ''));
      });

      it('binds strings to textareas', function() {
        generateEngine(this, '<textarea data-bind="g"/></textarea>');
        engine.bind(new Y.Model({g: 'g'}), viewlet);
        assert.equal(container.one('[data-bind=g]').get('value'), 'g');
      });

      it('supports eq for textarea inputs', function() {
        var model = new Y.Model({a: undefined});
        generateEngine(this, '<textarea data-bind="a"></textarea>');
        var input = container.one('[data-bind=a]');
        engine.bind(model, viewlet);
        var handler = engine.getNodeHandler(input.getDOMNode());
        assert.isTrue(handler.eq(input, undefined));
        assert.isTrue(handler.eq(input, ''));
        assert.isFalse(handler.eq(input, 42));
        model.set('a', 42);
        assert.isTrue(handler.eq(input, 42));
        assert.isTrue(handler.eq(input, '42'));
        assert.isFalse(handler.eq(input, undefined));
        assert.isFalse(handler.eq(input, ''));
        model.set('a', '42');
        assert.isTrue(handler.eq(input, 42));
        assert.isTrue(handler.eq(input, '42'));
        assert.isFalse(handler.eq(input, undefined));
        assert.isFalse(handler.eq(input, ''));
      });

      it('binds numbers to inputs', function() {
        generateEngine(this, '<input type="number" data-bind="e"/>');
        engine.bind(new Y.Model({e: 7}), viewlet);
        assert.equal(container.one('[data-bind=e]').get('value'), '7');
      });

      it('binds boolean to checkboxes', function() {
        generateEngine(this, '<input type="checkbox" data-bind="e"/>');
        var model = new Y.Model({e: false});
        engine.bind(model, viewlet);
        var input = container.one('[data-bind=e]');
        assert.equal(input.get('checked'), false);
        model.set('e', true);
        assert.equal(input.get('checked'), true);
      });

      it('supports eq for checkboxes', function() {
        var model = new Y.Model({a: undefined});
        generateEngine(this, '<input type="checkbox" data-bind="a"></input>');
        var input = container.one('[data-bind=a]');
        engine.bind(model, viewlet);
        var handler = engine.getNodeHandler(input.getDOMNode());
        assert.isTrue(handler.eq(input, undefined));
        assert.isTrue(handler.eq(input, false));
        assert.isFalse(handler.eq(input, true));
        model.set('a', true);
        assert.isTrue(handler.eq(input, true));
        assert.isFalse(handler.eq(input, undefined));
        assert.isFalse(handler.eq(input, false));
        model.set('a', false);
        assert.isTrue(handler.eq(input, false));
        assert.isTrue(handler.eq(input, undefined));
        assert.isFalse(handler.eq(input, true));
      });

      it('supports eq for text', function() {
        var model = new Y.Model({a: undefined});
        generateEngine(this, '<div data-bind="a"></div>');
        var input = container.one('[data-bind=a]');
        engine.bind(model, viewlet);
        var handler = engine.getNodeHandler(input.getDOMNode());
        assert.isTrue(handler.eq(input, undefined));
        assert.isTrue(handler.eq(input, ''));
        assert.isFalse(handler.eq(input, 42));
        model.set('a', 42);
        assert.isTrue(handler.eq(input, 42));
        assert.isTrue(handler.eq(input, '42'));
        assert.isFalse(handler.eq(input, undefined));
        assert.isFalse(handler.eq(input, ''));
        model.set('a', '42');
        assert.isTrue(handler.eq(input, 42));
        assert.isTrue(handler.eq(input, '42'));
        assert.isFalse(handler.eq(input, undefined));
        assert.isFalse(handler.eq(input, ''));
      });

    });

    describe('changedValues tests', function() {
      var model, input;

      beforeEach(function() {
        model = new Y.Model({a: undefined});
        generateEngine(this, '<textarea data-bind="a"></textarea>');
        input = container.one('[data-bind=a]');
        engine.bind(model, viewlet);
      });

      afterEach(function() {
        model.destroy(true);
        input.destroy(true);
      });

      it('should update changedValues when inputs change', function(done) {
        // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
        // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
        if (Y.UA.ie === 10) {
          done();
        }
        assert.deepEqual(viewlet.changedValues, {});
        input.after('valueChange', function(e) {
          assert.deepEqual(viewlet.changedValues, {a: true});
          done();
        });
        // Make valueChange work.
        input.simulate('focus');
        input.set('value', 'kumquat');
      });

      it('should clear changedValues when inputs reset', function(done) {
        // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
        // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
        if (Y.UA.ie === 10) {
          done();
        }
        assert.deepEqual(viewlet.changedValues, {});
        var handler = input.after('valueChange', function(e) {
          handler.detach();
          input.after('valueChange', function(e) {
            assert.deepEqual(viewlet.changedValues, {});
            assert.isTrue(viewlet.calledSyncedFields);
            done();
          });
          // Make valueChange work.
          input.simulate('focus');
          input.set('value', '');
        });
        // Make valueChange work.
        input.simulate('focus');
        input.set('value', 'kumquat');
      });
    });
  });

  describe('dependencies in bindings', function() {
    var TestModel;

    beforeEach(function() {
      TestModel = Y.Base.create('tester', Y.Model, [], {}, {
        ATTRS: {
          first: {},
          last: {},
          full: {
            getter: function() {return this.get('first') +
                  ' ' + this.get('last');}
          }
        }
      });

      container = utils.makeContainer(this);
      viewlet = {
        container: container,
        bindings: {
          full: {
            depends: ['first', 'last']
          }
        },
        changedValues: {},
        _eventHandles: []
      };
    });

    it('should properly update dependent fields', function() {
      var model = new TestModel({first: 'Ned', last: 'Stark'});
      container.setHTML(
          '<input data-bind="first"><input data-bind="full">');
      engine = new BindingEngine({interval: 0});
      engine.bind(model, viewlet);
      assert.equal(container.one('[data-bind="full"]')
                   .get('value'), 'Ned Stark');
      // Update something "full" depends on.
      model.setAttrs({first: 'Sansa'});
      assert.equal(container.one('[data-bind="first"]')
                   .get('value'), 'Sansa');

      assert.equal(container.one('[data-bind="full"]')
                   .get('value'), 'Sansa Stark');

      // The last name isn't bound to the DOM fragment but is a dependency
      // of "full". The system should allow for this.
      model.set('last', 'Lannister');
      assert.equal(container.one('[data-bind="full"]')
                   .get('value'), 'Sansa Lannister');
    });

    it('should update from dependent fields only', function() {
      // This is like the one above, but the value itself doesn't change, only
      // the dependents.  This example is artifical, but real examples
      // exist.  The use case is for bindings that have complex
      // representations based only peripherally on a given attribute.
      var model = new Y.Model({a: {something: 'wicked'}, b: undefined});
      generateEngine(
          this,
          '<textarea data-bind="a"></textarea>');
      viewlet.bindings = {
        a: {
          depends: ['b'],
          update: function(node, value) {
            node.set('value', value.something);
          }
        }
      };
      engine.bind(model, viewlet);
      var node = container.one('[data-bind="a"]');
      assert.equal(node.get('value'), 'wicked');
      // This does not trigger an update...
      model.get('a').something = 'comes';
      assert.equal(node.get('value'), 'wicked');
      // ...but this does.
      model.set('b', 'this way');
      assert.equal(node.get('value'), 'comes');
    });

    it('should handle multiple dependents', function() {
      var model = new TestModel({first: 'Ned', last: 'Stark'});
      container.setHTML(
          '<input data-bind="full"><span data-bind="full"></span>');
      engine = new BindingEngine({interval: 0});
      engine.bind(model, viewlet);
      assert.equal(container.one('input[data-bind="full"]')
                   .get('value'), 'Ned Stark');
      assert.equal(container.one('span[data-bind="full"]')
                   .get('text'), 'Ned Stark');
    });

  });

  describe('modellist tests', function() {
    beforeEach(function(done) {
      engine = new BindingEngine({interval: 0});
      done();
    });

    it('should be able to observe modellists', function() {
      var list = new Y.ModelList();
      var template = Y.Handlebars.compile(
          '{{#modellist}}' +
          '   <input id="{{id}}" name="test" value="{{test}}"/>' +
          '{{/modellist}}'
          );
      list.add({test: 'alpha', id: 'a'});
      container = utils.makeContainer(this);
      engine.bind(list, {
        name: 'testViewlet',
        container: container,
        _eventHandles: [],
        update: function(modellist) {
          var data = modellist.map(function(m) {return m.getAttrs();});
          this.container.setHTML(template({modellist: data}));
        }
      });
      assert.equal(container.all('input').size(), 1);
      list.add({id: 'b', test: 'beta'});
      assert.equal(container.all('input').size(), 2);

      var output = [];
      container.all('input').each(function(n) {
        output.push(n.get('value'));
      });
      assert.deepEqual(output, ['alpha', 'beta']);
    });

  });

  describe('_getBindingForNode tests', function() {
    var model;

    beforeEach(function() {
      model = new Y.Model({a: undefined, b: undefined});
      generateEngine(
          this,
          '<textarea data-bind="a"></textarea>' +
          '<input type="text" data-bind="a"></input>' +
          '<textarea data-bind="b"></textarea>');
      engine.bind(model, viewlet);
    });

    afterEach(function() {
      model.destroy(true);
    });

    it('should find a binding', function() {
      var nodeA1 = container.one('textarea[data-bind="a"]');
      var nodeA2 = container.one('input[data-bind="a"]');
      var nodeB = container.one('[data-bind="b"]');
      var bindingA1 = engine._getBindingForNode(nodeA1);
      var bindingA2 = engine._getBindingForNode(nodeA2);
      var bindingB = engine._getBindingForNode(nodeB);
      assert.equal(bindingA1.name, 'a');
      assert.strictEqual(bindingA1.target, nodeA1);
      assert.equal(bindingA2.name, 'a');
      assert.strictEqual(bindingA2.target, nodeA2);
      assert.equal(bindingB.name, 'b');
      assert.strictEqual(bindingB.target, nodeB);
    });

    it('should throw an error when a binding is not found', function() {
      assert.throws(
          function() {engine._getBindingForNode(container);},
          'Programmer error: no binding found for node');
    });
  });
});
