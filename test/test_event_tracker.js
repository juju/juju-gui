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

describe('EventTracker Extension', function() {
  var event, TestClass, testInstance, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['event-tracker', 'event-dom'],
        function(Y) {
          event = Y.Event;
          TestClass = Y.Base.create(
              'testclass',
              Y.Base,
              [event.EventTracker]);
          done();
        });
  });

  beforeEach(function() {
    testInstance = new TestClass();
  });

  afterEach(function() {
    if (testInstance) {
      testInstance.destroy();
    }
  });

  it('exists', function() {
    assert.isFunction(event.EventTracker);
  });

  it('event tracker wires into an object properly', function() {
    testInstance._events.should.eql([]);
    assert(typeof(testInstance.addEvent) === 'function');
  });

  it('event tracker should handle cleanup', function() {
    var body = Y.one('body');

    // start out with no listeners.
    assert(event.getListeners(body) === null);

    // add an event to track/detach.
    var evt = body.on('click', function(ev) {
      // do nothing
    });
    testInstance.addEvent(evt);
    event.getListeners(body).length.should.equal(1);

    // destroying the instance should restore us back to no listeners.
    testInstance.destroy();
    assert(event.getListeners(body) === null);
  });
});
