var juju = {
  utils: {},
  components: {}
};
var flags = {};
var zip = {};
var GlobalConfig = {
  combine: true,
  base: '/dev/combo?/app/assets/javascripts/yui/',
  comboBase: '/dev/combo?',
  maxURLLenght: 1300,
  root: 'app/assets/javascripts/yui/',
  groups: {
    app: {
        //combine: true,
        base: "/dev/combo?app/",
        comboBase: "/dev/combo?",
        root: 'app/',
        filter: 'raw',
        // From modules.js
        modules: YUI_MODULES,
    },
  }
};

var origBeforeEach = Mocha.Suite.prototype.beforeEach;
var origAfterEach = Mocha.Suite.prototype.afterEach;
Mocha.Suite.prototype.beforeEach = function(title, fn) {
  this.ctx._cleanups = [];
  origBeforeEach.call(this, title, fn);
};

Mocha.Suite.prototype.afterEach = function(func) {
  var newAfterEach = function(done) {
    func.apply(this, arguments);
    if (this._cleanups && this._cleanups.length) {
      while (this._cleanups.length > 0) {
        // Run the clean up method after popping it off the stack.
        this._cleanups.pop()();
      }
      this._cleanups = [];
    }
    done();
  }

  origAfterEach.call(this, newAfterEach);
};

var assert = chai.assert,
    expect = chai.expect,
    should = chai.should();
