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

describe.only('data binding library', function() {
  var Y, BindingEngine, utils, container;


  before(function(done) {
    var requires = ['juju-databinding', 'juju-tests-utils',
                    'model', 'model-list'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
      utils = Y.namespace('juju-tests.utils');
      BindingEngine = Y.namespace('juju.views').BindingEngine;
      done();
    });
  });

  afterEach(function() {
    if (container) {container.remove(true);}
  });

  describe('supports declarative bindings', function() {
    var engine, form, model;

    function makeForm(dom, container) {
      if (!container) {
        container = utils.makeContainer();
      }
      form = container.append(Y.Node.create('<form/>'));
      form.append(dom);
      return form;
    }

    describe('binding tests', function() {
      var engine;

      it('bind should fail on invalid DOM', function() {
        engine = new BindingEngine();
        assert.throws(function() {engine.bind({}, null);},
                      'Unable to bind, invalid DOM');
      });

      it('maintain proper binding references', function() {
          engine = new BindingEngine();
          container = utils.makeContainer();
          engine.bind(new Y.Model({a: 'b'}), container);
          // The default model object should be in place.
          assert.equal(Y.Object.keys(engine._events).length, 1);
          // Assign a new default model, the old event handler
          // will be unbound leaving the length consistent.
          engine.bind(new Y.Model({foo: 'bar'}), container);
          assert.equal(Y.Object.keys(engine._events).length, 1);
        });
    });

    describe('field types', function() {
        beforeEach(function(done) {
          engine = new BindingEngine();
          done();
        });

        function fieldShould(spec, dom, v1, v2) {
         return it(spec, function(done) {
            // Prep the DOM with a known selector
            var model = new Y.Model({test: v1});
            if (Y.Lang.isString(dom)) {
              dom = Y.Node.create(dom);
            }
            dom.set('name', 'test');
            form = makeForm(dom);
            engine.bind(model, form,
              {
                bindings: [{name: 'test', target: ['[name=test]']}]
              });
              assert.equal(dom.get('value'), v1);
              model.set('test', v2);
              assert.equal(dom.get('value'), v2);
              done();
          });
        }

        fieldShould('should be able to bind string to inputs',
                   '<input type="text"/>',
                   'Wintermute', 'Neuromancer');
        fieldShould('should be able to bind strings to textareas',
                   '<textarea/>', 'Hello\nWorld', 'Goodbye');

        fieldShould('should be able to bind numbers to inputs',
                   '<input type="number"/>', 1, 10);
    });
  });

  describe.skip('modellist tests', function() {
    var engine;
    beforeEach(function(done) {
      engine = new BindingEngine();
      done();
    });

    it('should be able to observe modellists', function() {
      var list = new Y.ModelList();
      list.add({test: 'alpha', id: 'a'});
      container = utils.makeContainer();
      engine.bind(list, container, {
        add: function(model, container) {
            container.append(
              Y.Node.create('<input type="text"/>')
               .setAttribute(id, model.id));
        },
        remove: function(model, container) {
          container.one('#' + model.id).remove(true);
        },
        bindings: [
          {name: 'test', target: ['input']}
        ]
      });
      console.log('container', container, list.toArray());
      list.add({id: 'b', test: 'beta'});
      console.log('after add', container, list.toArray());
    });

  });


});
