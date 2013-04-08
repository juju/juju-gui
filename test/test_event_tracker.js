'use strict';

describe.only('EventTracker Extension', function() {
  var event, testInstance, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['event-tracker', 'event-dom'],
        function(Y) {
          event = Y.Event;
          done();
        });
  });

  beforeEach(function() {
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
    var TestClass = Y.Base.create(
        'testclass',
        Y.Base,
        [event.EventTracker]);
    var testInstance = new TestClass();
    testInstance._events.should.eql([]);
    assert(typeof(testInstance.evt) === 'function');
  });

  it('event tracker manager handles cleanup', function(done) {
    var body = Y.one('body');
    var TestClass = Y.Base.create(
        'testclass',
        Y.Base,
        [event.EventTracker], {
          _destroyEvents: function() {
            // override the cleanup method to check it's called.
            Y.Object.each(this._events, function(evt, key) {
              evt.detach();
            });
            done();
          }
        });

    var testInstance = new TestClass();
    // add an event to track/detach.
    var evt = body.on('click', function(ev) {
      // do nothing
    });
    testInstance.destroy();
    var listeners = event.getListeners(body);
    listeners.length.should.equal(0);
  });
});
