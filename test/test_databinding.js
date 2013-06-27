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
                    'handlebars', 'model', 'model-list'];
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
        engine = new BindingEngine();
        assert.throws(function() {engine.bind(new Y.Model(), null);},
                      'Unable to bind, invalid Viewlet');
      });

      it('maintains proper binding references', function() {
        container = utils.makeContainer();
        container.append('<div data-bind="a"></div>');

        var viewlet = {
          container: container,
          _changedValues: []
        };
        engine = new BindingEngine();

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        // The default model object should be in place.
        assert.equal(Y.Object.keys(engine._events).length, 2);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'b');
      });

      it('supports nested model bindings', function() {
        container = utils.makeContainer();
        container.append('<div data-bind="a.b.c.d"></div>');

        var viewlet = {
          container: container,
          _changedValues: []
        };
        engine = new BindingEngine();

        engine.bind(new Y.Model({a: {b: {c: {d: 'nested'}}
              }}), viewlet);
        // The default model object should be in place.
        assert.equal(Y.Object.keys(engine._events).length, 2);
        assert.equal(container.one('[data-bind="a.b.c.d"]').getHTML(),
                     'nested');
      });

      it('supports providing functions from object attributes to its properties',
        function() {
        container = utils.makeContainer();
        container.append('<div data-bind="a.b"></div>');

        var viewlet = {
          container: container,
          _changedValues: [],
          bindings: {
            a: {
              format: function() {return 'parent';}
            }
          }
        };
        engine = new BindingEngine();

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
          bindings: {
            a: {
              format: function() {return 'parent';}
            },
            'a.b': {
              format: function() { return 'child format';}
            }
          }
        };
        engine = new BindingEngine();

        engine.bind(new Y.Model({a: {b: 'child'}}), viewlet);
        assert.equal(container.one('[data-bind="a.b"]').getHTML(),
                     'child format');
      });



      it('supports formatters', function() {
        container = utils.makeContainer();
        container.append('<div data-bind="a"></div>');

        var viewlet = {
          container: container,
          bindings: {
            a: {
              format: function(value) {
                return value + 'FORMATTED';
              }
            }
          },
          _changedValues: []
        };
        engine = new BindingEngine();
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
          _changedValues: []
        };
        engine = new BindingEngine();

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'overide');
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
          _changedValues: []
        };
        engine = new BindingEngine();

        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(container.one('[data-bind=a]').getHTML(), 'hi');
      });

    });

    describe('field types', function() {
      var viewlet, engine, container;

      function generateEngine(input) {
        container = utils.makeContainer();
        container.setHTML(input);
        viewlet = {
          container: container,
          _changedValues: []
        };
        engine = new BindingEngine();
      }

      afterEach(function() {
        container.remove().destroy(true);
        viewlet = null;
        engine = null;
      });

      it('binds strings to inputs', function() {
        generateEngine('<input type="text" data-bind="a"></input>');
        engine.bind(new Y.Model({a: 'b'}), viewlet);
        assert.equal(Y.Object.keys(engine._events).length, 2);
        assert.equal(container.one('[data-bind=a]').get('value'), 'b');
      });

      it('binds strings to textareas', function() {
        generateEngine('<textarea data-bind="g"/></textarea>');
        engine.bind(new Y.Model({g: 'g'}), viewlet);
        assert.equal(Y.Object.keys(engine._events).length, 2);
        assert.equal(container.one('[data-bind=g]').get('value'), 'g');
      });

      it('binds numbers to inputs', function() {
        generateEngine('<input type="number" data-bind="e"/>');
        engine.bind(new Y.Model({e: 7}), viewlet);
        assert.equal(Y.Object.keys(engine._events).length, 2);
        assert.equal(container.one('[data-bind=e]').get('value'), '7');
      });

    });
  });

  describe('modellist tests', function() {
    var engine;
    beforeEach(function(done) {
      engine = new BindingEngine();
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
