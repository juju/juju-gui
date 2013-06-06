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
                      'Unable to bind, invalid Viewlet');
      });

      it('maintains proper binding references', function() {
        var viewlet = {
          container: container,
          bindings: []
        };
        engine = new BindingEngine();
        container = utils.makeContainer();
        engine.bind(new Y.Model({a: 'b'}), viewlet);
        // The default model object should be in place.
        assert.equal(Y.Object.keys(engine._events).length, 1);
        // Assign a new default model, the old event handler
        // will be unbound leaving the length consistent.
        engine.bind(new Y.Model({foo: 'bar'}), viewlet);
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
          engine.bind(model,
              {
                container: form,
                bindings: [{name: 'test', target: ['[name=test]']}]
              });
          assert.equal(dom.get('value'), v1);
          model.set('test', v2);
          assert.equal(dom.get('value'), v2);
          done();
        });
      }

      fieldShould('bind string to inputs',
          '<input type="text"/>',
          'Wintermute', 'Neuromancer');
      fieldShould('bind strings to textareas',
          '<textarea/>', 'Hello\nWorld', 'Goodbye');

      fieldShould('bind numbers to inputs',
          '<input type="number"/>', 1, 10);
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
