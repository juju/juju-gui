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

describe('added services view', function() {
  var models, utils, view, View, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-tests-utils',
      'juju-models',
      'juju-added-services',
      'node-event-simulate'
    ], function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      View = Y.juju.browser.views.AddedServices;
      done();
    });
  });

  beforeEach(function() {
    var db = new models.Database();
    db.services.add([
      {id: 'service-foo', name: 'foo', unit_count: 1, icon: 'foo.png'},
      {id: 'service-bar', name: 'bar', unit_count: 2, icon: 'bar.png'},
      {id: 'service-baz', name: 'baz', unit_count: 3, icon: 'baz.png'}
    ]);
    var container = utils.makeContainer(this, 'added-services-view');
    view = new View({
      container: container,
      db: db
    });
  });

  afterEach(function(done) {
    if (view) {
      view.after('destroy', function() { done(); });
      view.destroy();
    }
  });

  it('is extended by the search widget', function() {
    assert.notEqual(view._renderSearchWidget, undefined);
  });

  it('navs to the service inspector on a service name click', function(done) {
    view.render();
    var container = view.get('container');
    view.on('*:changeState', function(e) {
      assert.equal(e.sectionA.component, 'inspector');
      done();
    });
    container.one('.name').simulate('click');
  });

  describe('initializer', function() {
    it('sets up the internal list of service tokens', function() {
      var serviceTokens = view.get('serviceTokens'),
          db = view.get('db'),
          keys = Object.keys(serviceTokens);
      assert.equal(db.services.size(), keys.length,
                   'Internal list size does not match DB size');
      keys.forEach(function(key, index) {
        assert.notEqual(db.services.getById(key), undefined,
                        'ID not found in the DB');
      });
    });
  });

  describe('render', function() {
    var renderSearch, renderButton;

    beforeEach(function() {
      renderSearch = utils.makeStubMethod(view, '_renderSearchWidget');
      this._cleanups.push(renderSearch.reset);
      renderButton = utils.makeStubMethod(view, '_renderAddedServicesButton');
      this._cleanups.push(renderButton.reset);
    });

    it('appends the template to the container', function() {
      view.render();
      var container = view.get('container');
      assert.notEqual(container.one('.search-widget'), null);
      assert.notEqual(container.one('.services-list'), null);
    });

    it('creates a token for each service', function() {
      view.render();
      var container = view.get('container');
      view.get('db').services.each(function(service) {
        var id = service.get('id');
        assert.notEqual(container.one('.token[data-id="' + id + '"]'), null,
                        'Unable to find a token for service: ' + id);
      });
    });

    it('calls to render the search widget on render', function() {
      view.render();
      assert.equal(renderSearch.calledOnce(), true);
    });

    it('calls to render the nav button on render', function() {
      view.render();
      assert.equal(renderButton.calledOnce(), true);
    });

    it('displays the "no services" message when needed', function() {
      view.get('db').services.reset();
      view.set('serviceTokens', {});
      view.render();
      var message = view.get('container').one('.no-services');
      assert.notEqual(message, null,
                      '"No services" message not found');
      assert.equal(message.hasClass('hide'), false,
                   '"No services" message is not displayed');
    });

    it('updates instead of re-rendering its template', function() {
      view.render();
      var id = view.get('container').one('.environment-counts').get('_yuid');
      assert.isNotNull(id, 'environment-counts element does not exist');
      // By rendering twice if this is overwriting the old template then the
      // yuid's will change.
      view.render();
      assert.equal(
          id,
          view.get('container').one('.environment-counts').get('_yuid'),
          'views template was re-rendered');
    });

    it('respects existing flags on the service', function() {
      var db = view.get('db'),
          serviceTokens = view.get('serviceTokens'),
          container = view.get('container');
      var idFoo = 'service-foo',
          idBar = 'service-bar',
          idBaz = 'service-baz',
          serviceFoo = db.services.getById(idFoo),
          serviceBar = db.services.getById(idBar),
          serviceBaz = db.services.getById(idBaz);
      serviceFoo.set('highlight', true);
      serviceBar.set('fade', true);
      view.render();
      var tokenFoo = container.one('.token[data-id="' + idFoo + '"]'),
          tokenBar = container.one('.token[data-id="' + idBar + '"]'),
          tokenBaz = container.one('.token[data-id="' + idBaz + '"]');
      assert.notEqual(tokenFoo.one('.action[data-action="fade"]'), null,
                      'Fade button not shown');
      assert.notEqual(tokenFoo.one('.action[data-action="unhighlight"]'), null,
                      'Unhighlight button not shown');
      assert.notEqual(tokenBar.one('.action[data-action="show"]'), null,
                      'Show button not shown');
      assert.notEqual(tokenBar.one('.action[data-action="highlight"]'), null,
                      'Highlight button not shown');
      assert.notEqual(tokenBaz.one('.action[data-action="fade"]'), null,
                      'Fade button not shown');
      assert.notEqual(tokenBaz.one('.action[data-action="highlight"]'), null,
                      'Highlight button not shown');
    });
  });

  describe('bind events', function() {
    var renderButton;

    beforeEach(function() {
      renderButton = utils.makeStubMethod(view, '_renderAddedServicesButton');
      this._cleanups.push(renderButton.reset);
    });

    it('adds tokens when services are added', function() {
      var db = view.get('db'),
          container = view.get('container');
      view.render();
      assert.equal(container.all('.token').size(), db.services.size(),
                   'Initial sizes do not match');
      db.services.add([
        {id: 'service-fuz', unit_count: 1, icon: 'fuz.png'}
      ]);
      assert.equal(container.all('.token').size(), db.services.size(),
                   'Token not added to list');
    });

    it('updates service count in nav button on add', function() {
      var db = view.get('db'),
          container = view.get('container');
      view.render();
      assert.equal(renderButton.lastArguments()[0], db.services.size(),
                   'Initial sizes do not match');
      db.services.add([
        {id: 'service-fuz', unit_count: 1, icon: 'fuz.png'}
      ]);
      assert.equal(renderButton.lastArguments()[0], db.services.size(),
                   'Incorrect service size sent to button render');
    });

    it('hides the "no services" message after adding', function() {
      var db = view.get('db');
      db.services.reset();
      view.set('serviceTokens', {});
      view.render();
      var message = view.get('container').one('.no-services');
      assert.equal(message.hasClass('hide'), false,
                   '"No services" message is not displayed');
      db.services.add([
        {id: 'service-fuz', unit_count: 1, icon: 'fuz.png'}
      ]);
      assert.equal(message.hasClass('hide'), true,
                   '"No services" message is still displayed');
    });

    it('removes tokens when services are removed', function() {
      var db = view.get('db'),
          container = view.get('container');
      view.render();
      assert.equal(container.all('.token').size(), db.services.size(),
                   'Initial sizes do not match');
      db.services.remove(0);
      assert.equal(container.all('.token').size(), db.services.size(),
                   'Token not removed from list');
    });

    it('updates service count in nav button on remove', function() {
      var db = view.get('db'),
          container = view.get('container');
      view.render();
      assert.equal(renderButton.lastArguments()[0], db.services.size(),
                   'Initial sizes do not match');
      db.services.remove(0);
      assert.equal(renderButton.lastArguments()[0], db.services.size(),
                   'Incorrect service size sent to button render');
    });

    it('displays the "no services" message after removing', function() {
      var db = view.get('db');
      db.services.reset();
      view.set('serviceTokens', {});
      db.services.add([
        {id: 'service-fuz', unit_count: 1, icon: 'fuz.png'}
      ]);
      view.render();
      var message = view.get('container').one('.no-services');
      assert.equal(message.hasClass('hide'), true,
                   '"No services" message is displayed');
      db.services.remove(0);
      assert.equal(message.hasClass('hide'), false,
                   '"No services" message is not displayed');
    });

    it('updates tokens when service IDs are changed', function() {
      var db = view.get('db'),
          container = view.get('container');
      view.render();
      var service = db.services.item(0),
          oldID = service.get('id'),
          newID = 'scooby';
      assert.notEqual(container.one('.token[data-id="' + oldID + '"]'), null,
                      'Unable to find old ID in HTML');
      assert.notEqual(view.get('serviceTokens')[oldID], undefined,
                      'Unable to find old ID in internal list');
      service.set('id', newID);
      assert.equal(container.one('.token[data-id="' + oldID + '"]'), null,
                   'Old ID should not be in HTML');
      assert.equal(view.get('serviceTokens')[oldID], undefined,
                   'Old ID should not be in internal list');
      assert.notEqual(container.one('.token[data-id="' + newID + '"]'), null,
                      'Unable to find new ID in HTML');
      assert.notEqual(view.get('serviceTokens')[newID], undefined,
                      'Unable to find new ID in internal list');
    });

    it('updates tokens when services are changed', function() {
      var db = view.get('db'),
          container = view.get('container');
      view.render();
      var service = db.services.item(0),
          id = service.get('id'),
          oldName = service.get('name'),
          newName = 'scooby',
          token = container.one('.token[data-id="' + id + '"]');
      assert.equal(token.one('.name').get('text'), oldName,
                   'Token does not start out with the old name');
      service.set('name', newName);
      assert.equal(token.one('.name').get('text'), newName,
                   'Token name does not match the expected name');
    });

    it('toggles off any other highlighted tokens on highlight', function(done) {
      view.render();
      var db = view.get('db'),
          service = db.services.item(0),
          id = service.get('id'),
          tokens = view.get('serviceTokens'),
          token = tokens[id];
      // Highlight another service.
      tokens[db.services.item(1).get('id')].set('highlight', true);
      // After the highlight event, make sure all other tokens have highlight
      // toggled off.
      view.after('*:highlight', function() {
        Object.keys(tokens).forEach(function(key) {
          if (key !== id) {
            assert.equal(tokens[key].get('highlight'), false,
                         'Token for service "' + key + '" still highlighted');
          }
        });
        done();
      });
      // Fire the actual event.
      token.fire('highlight');
    });
  });

  describe('added services visibility', function() {
    function testClick(options, done, useGhost) {
      // Ensure the visibility flag on the service is set correctly.
      var service;
      if (useGhost) {
        service = view.get('db').services.add({
          id: '123467$',
          name: 'ghost-service'
        });
      } else {
        service = view.get('db').services.item(0);
      }
      var token = view.get('serviceTokens')[service.get('id')];
      service.set(options.attr, options.attrVal);
      // Proceed with the actual test.
      view.render();
      var index = options.attr === 'fade' ? 0 : 1,
          tokenElement = token.get('container'),
          icon = tokenElement.all('.action').item(index),
          action = icon.getAttribute('data-action'),
          oldState = options.oldState,
          newState = options.newState;
      assert.equal(action, newState,
                   'Button is not in expected ' + newState + ' mode');
      token.on(newState, function() {
        // Can't reuse action variable because the underlying attribute has
        // changed.
        var changedIcon = tokenElement.all('.action').item(index);
        assert.equal(changedIcon.getAttribute('data-action'), oldState,
                     'Button is not in ' + oldState + ' mode after clicking');
        done();
      });
      icon.simulate('click');
    }

    it('triggers a change from show to fade state', function(done) {
      testClick({
        attr: 'fade',
        attrVal: false,
        oldState: 'show',
        newState: 'fade'
      }, done);
    });

    it('triggers a change from fade to show state', function(done) {
      testClick({
        attr: 'fade',
        attrVal: true,
        oldState: 'fade',
        newState: 'show'
      }, done);
    });

    it('triggers a change from unhighlighted to highlighted', function(done) {
      testClick({
        attr: 'highlight',
        attrVal: false,
        oldState: 'unhighlight',
        newState: 'highlight'
      }, done);
    });

    it('triggers a change from highlighted to unhighlighted', function(done) {
      testClick({
        attr: 'highlight',
        attrVal: true,
        oldState: 'highlight',
        newState: 'unhighlight'
      }, done);
    });

    it('changes from highlighted to unhighlighted (ghost)', function(done) {
      testClick({
        attr: 'highlight',
        attrVal: true,
        oldState: 'highlight',
        newState: 'unhighlight'
      }, done, true);
    });
  });

  describe('destroy', function() {
    it('empties the container', function() {
      view.render();
      var container = view.get('container');
      assert.notEqual(container.one('.search-widget'), null,
                      'Search widget HTML not found');
      assert.notEqual(container.one('.added-services-button'), null,
                      'Button widget HTML not found');
      assert.notEqual(container.one('.services-list'), null,
                      'Services list HTML not found');
      view.destroy();
      assert.equal(container.one('.search-widget'), null,
                   'Search widget HTML found');
      assert.equal(container.one('.added-services-button'), null,
                   'Button widget HTML found');
      assert.equal(container.one('.services-list'), null,
                   'Services list HTML found');
    });

    it('destroys the tokens', function() {
      view.render();
      var serviceTokens = view.get('serviceTokens'),
          db = view.get('db');
      assert.equal(Object.keys(serviceTokens).length, db.services.size(),
                   'Token list not the same size as services in the db');
      view.destroy();
      assert.equal(Object.keys(serviceTokens).length, 0,
                   'Token list not cleared out by destroy');
    });
  });
});
