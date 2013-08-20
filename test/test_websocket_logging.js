/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

/* jslint: -W079 */
var saveAs = saveAs;

(function() {
  describe.only('websocket recording', function() {
    var Y, WebsocketLogging, websocketLogging;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-websocket-logging', function(Y) {
            WebsocketLogging = Y.namespace('juju').WebsocketLogging;
            done();
          });
    });

    beforeEach(function() {
      websocketLogging = new WebsocketLogging();
      // Provide a noop saveAs global which is normally provided by the app.
      saveAs = function() {};
    });

    afterEach(function() {
      // We need to clean up all the event handlers.
      Y.detach('websocketSend');
      Y.detach('websocketReceive');
      Y.detach('saveWebsocketLog');
    });

    it('can save a log', function(done) {
      // When asked to save a log, the global saveAs function is called with a
      // blob containing the serialized log entries.
      saveAs = function(blob, fileName) {
        assert.isTrue(blob !== undefined);
        assert.equal(blob.type, 'text/plain;charset=utf-8');
        assert.equal(blob.size, 6);
        assert.equal(fileName, 'websocket-log.txt');
        done();
      };
      websocketLogging.saveLog(['my', 'log']);
    });

    it('responds to the saveWebsocketLog event', function(done) {
      // When the saveWebsocketLog event is fired, the saveLog method is called
      // with the current log of websocket events.
      var logEntry = 'this is a log entry';
      websocketLogging.saveLog = function(log) {
        assert.deepEqual(log, [logEntry]);
        done();
      };
      websocketLogging.log.push(logEntry);
      // Since we changed one of the event handlers, we have to re-bind the
      // event listeners.
      Y.detach('saveWebsocketLog');
      websocketLogging.setUpEventListeners();
      Y.fire('saveWebsocketLog');
    });

    it('logs messages', function() {
      // We want the timestamp to be fixed in time so we know what to expect
      // for the assertion below.
      websocketLogging.timestamp = function() {
        return '2013-05-31T16:15:05.923Z';
      };
      websocketLogging.logMessage('to server', 'ping');
      websocketLogging.logMessage('to client', 'pong');
      assert.deepEqual(websocketLogging.log,
          ['2013-05-31T16:15:05.923Z\nto server\nping',
           '2013-05-31T16:15:05.923Z\nto client\npong']);
    });

    it('logs server messages on the websocketReceive event', function(done) {
      websocketLogging.logMessage = function(direction, message) {
        assert.equal(direction, 'to client');
        assert.equal(message, 'message to the client');
        done();
      };
      Y.fire('websocketReceive', 'message to the client');
    });

    it('logs client messages on the websocketSend event', function(done) {
      websocketLogging.logMessage = function(direction, message) {
        assert.equal(direction, 'to server');
        assert.equal(message, 'message to the server');
        done();
      };
      Y.fire('websocketSend', 'message to the server');
    });

  });

})();
