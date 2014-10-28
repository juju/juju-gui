/**
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2014 Canonical Ltd.

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
(function() {

  describe('browser event handlers', function() {
    var Y, utils, browser, Browser;

    before(function(done) {
      var requires = [
        'base',
        'base-build',
        'subapp-browser-events',
        'juju-browser',
        'subapp-browser',
        'juju-tests-utils'
      ];
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      Browser = Y.Base.create('mockbrowser', Y.Base,
          [Y.juju.browser.BrowserEventsExtension], {});
      browser = new Browser();
    });

    afterEach(function() {
      browser.destroy();
    });

    describe('changeState events', function() {
      var generateUrlStub, navigateStub;

      beforeEach(function() {
        // Setup state.
        var State = Y.Base.create('mockstate', Y.Base, [], {});
        var state = new State();
        generateUrlStub = utils.makeStubMethod(state, 'generateUrl', '/foo');
        browser.state = state;
        // Stub out the navigate function.
        navigateStub = utils.makeStubFunction();
        browser.navigate = navigateStub;
      });

      afterEach(function() {
        browser.state.destroy();
        generateUrlStub = null;
        navigateStub = null;
      });

      it('cancels the inspector retry timer', function() {
        var timer = {};
        var cancelStub = utils.makeStubFunction();
        timer.cancel = cancelStub;
        browser.set('inspectorRetryTimer', timer);
        browser._onChangeState({details: ['foo']});
        assert.equal(cancelStub.calledOnce(), true, 'timer was not canceled');
        assert.equal(browser.get('inspectorRetries'), 0);
      });

      it('navigates to the proper URL', function() {
        browser._onChangeState({details: ['foo']});
        assert.equal(browser.state.get('allowInspector'), true,
                     'inspector was not allowed');
        assert.equal(generateUrlStub.lastArguments()[0], 'foo',
                     'details were not passed to generateUrl');
        assert.equal(navigateStub.lastArguments()[0], '/foo',
                     'incorrect URL was passed to navigate');
      });
    });

    describe('serviceDeployed events', function() {
      beforeEach(function() {
        var Inspector = Y.Base.create('mockinspector', Y.Base, [], {}),
            inspector = new Inspector();
        var Model = Y.Base.create('mockmodel', Y.Base, [], {}),
            model = new Model();
        inspector.set('model', model);
        browser._inspector = inspector;
      });

      it('updates the active inspector appropriately', function(done) {
        var clientId = 'test',
            serviceName = 'test-0',
            inspector = browser._inspector;
        inspector.get('model').set('clientId', clientId);
        browser.on('changeState', function(e) {
          assert.equal(e.sectionA.component, 'inspector',
                       'the state component is not set to inspector');
          assert.equal(e.sectionA.metadata.id, serviceName,
                       'the state metadata id is not set properly');
          done();
        });
        browser._onServiceDeployed({
          clientId: clientId,
          serviceName: serviceName
        });
      });

      it('does nothing when there is no active inspector', function() {
        browser._inspector = null;
        var fireStub = utils.makeStubMethod(browser, 'fire');
        this._cleanups.push(fireStub.reset);
        browser._onServiceDeployed({
          clientId: 'test',
          serviceName: 'test-0'
        });
        assert.equal(fireStub.callCount(), 0);
      });

      it('does nothing when the active inspector is destroyed', function() {
        browser._inspector.set('destroyed', true);
        var fireStub = utils.makeStubMethod(browser, 'fire');
        this._cleanups.push(fireStub.reset);
        browser._onServiceDeployed({
          clientId: 'test',
          serviceName: 'test-0'
        });
        assert.equal(fireStub.callCount(), 0);
      });

      it('ignores services that don\'t matched the provided ID', function() {
        var inspector = browser._inspector;
        inspector.get('model').set('clientId', 'foobar');
        var fireStub = utils.makeStubMethod(browser, 'fire');
        this._cleanups.push(fireStub.reset);
        browser._onServiceDeployed({
          clientId: 'test',
          serviceName: 'test-0'
        });
        assert.equal(fireStub.callCount(), 0);
      });
    });

    describe('highlight events', function() {
      var db;

      beforeEach(function() {
        db = new Y.juju.models.Database();
        db.services.add([
          {id: 'mysql'},
          {id: 'wordpress'},
          {id: 'haproxy'}
        ]);
        browser.set('db', db);
        var unrelated = db.services.filter({asList: true}, function(service) {
          return service.get('id') === 'haproxy';
        });
        utils.makeStubMethod(db, 'findUnrelatedServices', unrelated);
      });

      it('sets highlight flag on selected service', function() {
        var mysql = db.services.getById('mysql');
        assert.equal(mysql.get('highlight'), false,
                     'target service should not have flag set initially');
        browser._onHighlight({serviceName: 'mysql'});
        assert.equal(mysql.get('highlight'), true,
                     'target service should have flag set to true');
      });

      it('sets unrelated services\' fade flag on highlight', function() {
        var mysql = db.services.getById('mysql'), // Target service.
            wordpress = db.services.getById('wordpress'), // Related service.
            haproxy = db.services.getById('haproxy'); // Unrelated service.
        assert.equal(mysql.get('fade'), false,
                     'target service should not have flag set initially');
        assert.equal(wordpress.get('fade'), false,
                     'related service should not have flag set initially');
        assert.equal(haproxy.get('fade'), false,
                     'unrelated service should not have flag set initially');
        browser._onHighlight({serviceName: 'mysql'});
        assert.equal(mysql.get('fade'), false,
                     'target service should not have flag set post-event');
        assert.equal(wordpress.get('fade'), false,
                     'related service should not have flag set post-event');
        assert.equal(haproxy.get('fade'), true,
                     'unrelated service should have flag set to true');
      });

      it('unsets highlight flag on selected service', function() {
        var mysql = db.services.getById('mysql');
        mysql.set('highlight', true);
        browser._onUnhighlight({serviceName: 'mysql'});
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
        browser._onUnhighlight({serviceName: 'mysql'});
        assert.equal(mysql.get('fade'), false,
                     'target service should not have flag set post-event');
        assert.equal(wordpress.get('fade'), false,
                     'related service should not have flag set post-event');
        assert.equal(haproxy.get('fade'), false,
                     'unrelated service should have flag set to false');
      });
    });

    describe('hide/fade events', function() {
      var db;

      beforeEach(function() {
        db = new Y.juju.models.Database();
        db.services.add([
          {id: 'mysql'},
          {id: 'wordpress'}
        ]);
        browser.set('db', db);
      });

      it('sets fade flag on the selected service on fade', function() {
        var mysql = db.services.getById('mysql'),
            wordpress = db.services.getById('wordpress');
        assert.equal(mysql.get('fade'), false);
        assert.equal(wordpress.get('fade'), false);
        browser._onFade({serviceNames: ['mysql']});
        assert.equal(mysql.get('fade'), true);
        assert.equal(wordpress.get('fade'), false);
      });

      it('unsets fade flag on show', function() {
        var mysql = db.services.getById('mysql'),
            wordpress = db.services.getById('wordpress');
        mysql.set('fade', true);
        assert.equal(wordpress.get('fade'), false);
        browser._onShow({serviceNames: ['mysql']});
        assert.equal(mysql.get('fade'), false);
        assert.equal(wordpress.get('fade'), false);
      });
    });
  });
})();
