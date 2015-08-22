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
  var db, models, utils, view, View, Y;

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
    db = new models.Database();
    db.services.add([
      {id: 'service-foo', name: 'foo', unit_count: 1, icon: 'foo.png'},
      {id: 'service-bar', name: 'bar', unit_count: 2, icon: 'bar.png'},
      {id: 'service-baz', name: 'baz', unit_count: 3, icon: 'baz.png'},
      {id: 'mysql', name: 'mysql'},
      {id: 'wordpress', name: 'wordpress'},
      {id: 'haproxy', name: 'haproxy'}
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
      db.services.each(function(service) {
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
      db.services.reset();
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
      var container = view.get('container');
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
      var container = view.get('container');
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
      var container = view.get('container');
      view.render();
      assert.equal(container.all('.token').size(), db.services.size(),
                   'Initial sizes do not match');
      db.services.remove(0);
      assert.equal(container.all('.token').size(), db.services.size(),
                   'Token not removed from list');
    });

    it('updates service count in nav button on remove', function() {
      view.render();
      assert.equal(renderButton.lastArguments()[0], db.services.size(),
                   'Initial sizes do not match');
      db.services.remove(0);
      assert.equal(renderButton.lastArguments()[0], db.services.size(),
                   'Incorrect service size sent to button render');
    });

    it('displays the "no services" message after removing', function() {
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
      var container = view.get('container');
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
      var container = view.get('container');
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
      var service = db.services.item(0),
          id = service.get('id'),
          tokens = view.get('serviceTokens'),
          token = tokens[id];
      // Highlight another service.
      db.services.item(1).set('highlight', true);
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
      token.fire('highlight', { id: service.get('id') });
    });
  });

  describe('added services visibility', function() {
    function testClick(options, done, useGhost) {
      // Ensure the visibility flag on the service is set correctly.
      var service;
      if (useGhost) {
        service = db.services.add({
          id: '123467$',
          name: 'ghost-service'
        });
      } else {
        service = db.services.item(0);
      }
      var token = view.get('serviceTokens')[service.get('id')];
      service.set(options.attr, options.attrVal);
      // Proceed with the actual test.
      view.render();
      token.after(options.event, function() {
        assert.equal(service.get(options.attr), !options.attrVal,
            '"' + options.attr + '" flag not set properly after clicking');
        done();
      });
      var index = options.attr === 'fade' ? 0 : 1;
      var button = token.get('container').all('.action').item(index);
      button.simulate('click');
    }

    it('triggers a change from show to fade state', function(done) {
      testClick({
        attr: 'fade',
        attrVal: false,
        event: 'fade'
      }, done);
    });

    it('triggers a change from fade to show state', function(done) {
      testClick({
        attr: 'fade',
        attrVal: true,
        event: 'show'
      }, done);
    });

    it('triggers a change from unhighlighted to highlighted', function(done) {
      testClick({
        attr: 'highlight',
        attrVal: false,
        event: 'highlight'
      }, done);
    });

    it('triggers a change from highlighted to unhighlighted', function(done) {
      testClick({
        attr: 'highlight',
        attrVal: true,
        event: 'unhighlight'
      }, done);
    });

    it('changes from highlighted to unhighlighted (ghost)', function(done) {
      testClick({
        attr: 'highlight',
        attrVal: true,
        event: 'unhighlight'
      }, done, true);
    });
  });

  describe('highlight events', function() {
    beforeEach(function() {
      var unrelated = db.services.filter({asList: true}, function(service) {
        return service.get('id') === 'haproxy';
      });
      utils.makeStubMethod(db, 'findUnrelatedServices', unrelated);
    });

    it('sets highlight flag on selected service', function() {
      var mysql = db.services.getById('mysql');
      assert.equal(mysql.get('highlight'), false,
                   'target service should not have flag set initially');
      view._onHighlight({id: 'mysql'});
      assert.equal(mysql.get('highlight'), true,
                   'target service should have flag set to true');
    });

    it('toggles fade off when highlighting', function() {
      var mysql = db.services.getById('mysql');
      mysql.set('fade', true);
      view._onHighlight({id: 'mysql'});
      assert.equal(mysql.get('fade'), false,
                   'target service should have toggled flag to false');
    });

    it('sets unrelated services\' hide flag on highlight', function() {
      var mysql = db.services.getById('mysql'), // Target service.
          wordpress = db.services.getById('wordpress'), // Related service.
          haproxy = db.services.getById('haproxy'); // Unrelated service.
      assert.equal(mysql.get('hide'), false,
                   'target service should not have flag set initially');
      assert.equal(wordpress.get('hide'), false,
                   'related service should not have flag set initially');
      assert.equal(haproxy.get('hide'), false,
                   'unrelated service should not have flag set initially');
      view._onHighlight({id: 'mysql'});
      assert.equal(mysql.get('hide'), false,
                   'target service should not have flag set post-event');
      assert.equal(wordpress.get('hide'), false,
                   'related service should not have flag set post-event');
      assert.equal(haproxy.get('hide'), true,
                   'unrelated service should have flag set to true');
    });

    it('unsets highlight flag on selected service', function() {
      var mysql = db.services.getById('mysql');
      mysql.set('highlight', true);
      view._onUnhighlight({id: 'mysql'});
      assert.equal(mysql.get('highlight'), false,
                   'target service should have flag set to false');
    });

    it('unsets unrelated services\' fade flag on unhighlight', function() {
      var mysql = db.services.getById('mysql'), // Target service.
          wordpress = db.services.getById('wordpress'), // Related service.
          haproxy = db.services.getById('haproxy'); // Unrelated service.
      mysql.set('highlight', true);
      assert.equal(wordpress.get('fade'), false,
                   'related service should not have flag set initially');
      assert.equal(haproxy.get('fade'), false,
                   'unrelated service should not have flag set initially');
      view._onUnhighlight({id: 'mysql'});
      assert.equal(mysql.get('fade'), false,
                   'target service should not have flag set post-event');
      assert.equal(wordpress.get('fade'), false,
                   'related service should not have flag set post-event');
      assert.equal(haproxy.get('fade'), false,
                   'unrelated service should have flag set to false');
    });
  });

  describe('fade/show events', function() {
    it('sets fade flag on the selected service on fade', function() {
      var mysql = db.services.getById('mysql'),
          wordpress = db.services.getById('wordpress');
      assert.equal(mysql.get('fade'), false);
      assert.equal(wordpress.get('fade'), false);
      view._onFade({id: 'mysql'});
      assert.equal(mysql.get('fade'), true);
      assert.equal(wordpress.get('fade'), false);
    });

    it('only unhighlights on fade if highlighted & not hidden', function() {
      var unhighlight = utils.makeStubMethod(view, '_onUnhighlight');
      this._cleanups.push(unhighlight.reset);
      var fireChange = utils.makeStubMethod(view, '_fireMachineChanges');
      this._cleanups.push(fireChange.reset);
      var mysql = db.services.getById('mysql');
      mysql.set('hide', true);
      mysql.set('highlight', true);
      view._onFade({id: 'mysql'});
      assert.equal(mysql.get('fade'), true,
                   'Service is hidden: fade is set improperly');
      assert.equal(mysql.get('hide'), true,
                   'Service is hidden: hide is set improperly');
      assert.equal(mysql.get('highlight'), true,
                   'Service is hidden: highlight is set improperly');
      assert.equal(unhighlight.callCount(), 0,
                   'Service is hidden: unhighlight should not be called');
      mysql.set('hide', false);
      mysql.set('highlight', false);
      view._onFade({id: 'mysql'});
      assert.equal(mysql.get('fade'), true,
                   'Service not highlighted: fade is set improperly');
      assert.equal(mysql.get('hide'), false,
                   'Service not highlighted: hide is set improperly');
      assert.equal(mysql.get('highlight'), false,
                   'Service not highlighted: highlight is set improperly');
      assert.equal(unhighlight.callCount(), 0,
                   'Service not highlighted: unhighlight should not be called');
    });

    it('toggles highlight off when fading', function() {
      var mysql = db.services.getById('mysql');
      mysql.set('highlight', true);
      view._onFade({id: 'mysql'});
      assert.equal(mysql.get('highlight'), false);
    });

    it('unsets fade flag on show', function() {
      var mysql = db.services.getById('mysql'),
          wordpress = db.services.getById('wordpress');
      mysql.set('fade', true);
      assert.equal(wordpress.get('fade'), false);
      view._onShow({id: 'mysql'});
      assert.equal(mysql.get('fade'), false);
      assert.equal(wordpress.get('fade'), false);
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
      var serviceTokens = view.get('serviceTokens');
      assert.equal(Object.keys(serviceTokens).length, db.services.size(),
                   'Token list not the same size as services in the db');
      view.destroy();
      assert.equal(Object.keys(serviceTokens).length, 0,
                   'Token list not cleared out by destroy');
    });
  });
});
