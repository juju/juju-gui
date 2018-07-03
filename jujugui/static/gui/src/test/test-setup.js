var flags = {};
var origBeforeEach = Mocha.Suite.prototype.beforeEach;
var origAfterEach = Mocha.Suite.prototype.afterEach;
Mocha.Suite.prototype.beforeEach = function(title, fn) {
  this.ctx._cleanups = [];
  origBeforeEach.call(this, title, fn);
};

Mocha.Suite.prototype.afterEach = function(func) {
  const newAfterEach = function(done) {
    let doneCalled = false;
    const doneWrapper = () => {
      done();
      doneCalled = true;
    };
    if (this._cleanups && this._cleanups.length) {
      while (this._cleanups.length > 0) {
        // Run the clean up method after popping it off the stack.
        this._cleanups.pop()();
      }
      this._cleanups = [];
    }
    func.call(this, doneWrapper);
    if (!doneCalled) {
      done();
    }
  }
  origAfterEach.call(this, newAfterEach);
};

var assert = chai.assert,
    expect = chai.expect,
    should = chai.should();
