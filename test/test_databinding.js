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
  var Y, BindingEngine, utils, container;

  before(function(done) {
    var requires = ['juju-databinding', 'juju-tests-utils',
                    'base', 'handlebars',
                    'model', 'model-list'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
      utils = Y.namespace('juju-tests.utils');
      BindingEngine = Y.namespace('juju.views').BindingEngine;
      done();
    });
  });

  describe('supports declarative bindings', function() {
    var engine, form, model;

    describe('binding tests', function() {
      var engine;

      it('bind should fail on invalid DOM', function() {
        engine = new BindingEngine({interval: 0});
        assert.throws(function() {engine.bind(new Y.Model(), null);},
                      'Unable to bind, invalid Viewlet');
      });

      it('maintains proper binding references', function() {
        container = utils.makeContainer();
        container.append('<div data-bind="a"></div>');

        var viewlet = {
          container: container,
          _changedValues: [],
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
            container = utils.makeContainer();
            container.append('<input data-bind="a"/>');
            container.append('<input data-bind="a"/>');
            var viewlet = {
              container: container,
              _changedValues: [],
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

      it('supports gt one binding to a single model element', function(done) {
        // We intentionally run this test with an interval, and thus need a
        // wait.  This is because the change interval can mask certain types of
        // errors and we want the space to see that this actually works.
        engine = new BindingEngine({interval: 50});
        container = utils.makeContainer();
        container.append('<input data-bind="a"/>');
        container.append('<input data-bind="a"/>');
        var viewlet = {
          container: container,
          _changedValues: [],
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

      it('supports nested model bindings', function() {
        container = utils.makeContainer();
        container.append('<div data-bind="a.b.c.d"></div>');

        var viewlet = {
          container: container,
          _changedValues: [],
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
           container = utils.makeContainer();
           container.append('<div data-bind="a.b"></div>');

           var viewlet = {
             container: container,
             _changedValues: [],
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
           container = utils.makeContainer();
           container.append('<div data-bind="a.b"></div>');

           var viewlet = {
             container: container,
             _changedValues: [],
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
        container = utils.makeContainer();
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
          _changedValues: []
        };
        engine = new BindingEngine({interval: 0});
        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'bFORMATTED');
      });

      it('supports callbacks on binding updates', function() {
        container = utils.makeContainer();
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
          _changedValues: [],
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'overide');
      });

      it('supports before/after callbacks on binding updates', function() {
        container = utils.makeContainer();
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
          _changedValues: [],
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'abc');
      });

      it('update callback uses formatted value', function() {
        container = utils.makeContainer();
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
          _changedValues: [],
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'hi');
      });

      describe('wildcard support', function() {
        it('supports * styled wildcard bindings', function() {
          container = utils.makeContainer();
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
            _changedValues: [],
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
          container = utils.makeContainer();
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
            _changedValues: [],
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

      it('should be able to observe pojos', function(done) {
        var pojo = {id: 'a', name: 'test'};
        container = utils.makeContainer();
        container.append('<div data-bind="name"></div>');
        var called = false;

        var engine = new BindingEngine({interval: 0});
        engine.bind(pojo, {
          get: function(m) { return m[this.name];},
          name: 'testViewlet',
          container: container,
          _changedValues: [],
          _eventHandles: [],
          bindings: {
            name: {
              update: function(node, value) {
                node.setHTML(value);
                called = true;
              }
            }
          }
        });

        called = false;
        // Should trigger binding update
        pojo.name = 'rising';
        setTimeout(function() {
          // The polyfll impl of Object.observe needs this,
          // the browser impl shouldn't.
          assert.equal(called, true);
          done();
        }, 125);
      });

      it('unbind method unbinds models and pojos (unit test)', function() {
        container = utils.makeContainer();
        var engine = new BindingEngine({interval: 0});
        var model = {id: 'test', name: 'this'};
        var viewlet = {
          container: container,
          _changedValues: [],
          _eventHandles: []
        };
        engine.bind(model, viewlet);
        // Gently poke at the internals
        // to see that we've unbound
        var notifier = Object.getNotifier(model);
        var listeners = notifier.listeners();
        assert.equal(listeners.length, 1);

        engine.unbind();
        listeners = notifier.listeners();
        assert.equal(listeners.length, 0);
      });
    });

    describe('field types', function() {
      var viewlet, engine, container;

      function generateEngine(input) {
        container = utils.makeContainer();
        container.setHTML(input);
        viewlet = {
          container: container,
          _changedValues: [],
          _eventHandles: []
        };
        engine = new BindingEngine({interval: 0});
      }

      afterEach(function() {
        container.remove().destroy(true);
        viewlet = null;
        engine = null;
      });

      it('binds strings to inputs', function() {
        generateEngine('<input type="text" data-bind="a"></input>');
        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').get('value'), 'b');
      });

      it('supports eq for string inputs', function() {
        var model = new Y.Model({a: undefined});
        generateEngine('<input type="text" data-bind="a"></input>');
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
        generateEngine('<textarea data-bind="g"/></textarea>');
        engine.bind(new Y.Model({g: 'g'}), viewlet);
        assert.equal(container.one('[data-bind=g]').get('value'), 'g');
      });

      it('supports eq for textarea inputs', function() {
        var model = new Y.Model({a: undefined});
        generateEngine('<textarea data-bind="a"></textarea>');
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
        generateEngine('<input type="number" data-bind="e"/>');
        engine.bind(new Y.Model({e: 7}), viewlet);
        assert.equal(container.one('[data-bind=e]').get('value'), '7');
      });

      it('binds boolean to checkboxes', function() {
        generateEngine('<input type="checkbox" data-bind="e"/>');
        var model = new Y.Model({e: false});
        engine.bind(model, viewlet);
        var input = container.one('[data-bind=e]');
        assert.equal(input.get('checked'), false);
        model.set('e', true);
        assert.equal(input.get('checked'), true);
      });

      it('supports eq for checkboxes', function() {
        var model = new Y.Model({a: undefined});
        generateEngine('<input type="checkbox" data-bind="a"></input>');
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
        generateEngine('<div data-bind="a"></div>');
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
  });

  describe('dependencies in bindings', function() {
    var TestModel, engine, viewlet, container;

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

      container = utils.makeContainer();
      viewlet = {
        container: container,
        bindings: {
          full: {
            depends: ['first', 'last']
          }
        },
        _changedValues: [],
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
      // Update something full depends on.
      model.setAttrs({first: 'Sansa'});
      assert.equal(container.one('[data-bind="first"]')
                   .get('value'), 'Sansa');

      assert.equal(container.one('[data-bind="full"]')
                   .get('value'), 'Sansa Stark');

      // Last name isn't bound the DOM fragment but is a dep
      // of full. The system should allow for this
      model.set('last', 'Lannister');
      assert.equal(container.one('[data-bind="full"]')
                   .get('value'), 'Sansa Lannister');
    });

  });

  describe('modellist tests', function() {
    var engine;
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
      container = utils.makeContainer();
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

});
