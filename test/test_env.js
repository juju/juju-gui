var YUI = require("yui").YUI,
    base= require("../lib/base.js");


(function () {
    
describe("juju env conn", function() {
    var Y, juju;

    before(function (done) {
        Y = YUI(base.TestConfig).use("base", "node", "juju-models", function (Y) {
            juju = Y.namespace("juju");
            done();
	});
    })
  
    it("must be able to create an environment", function() {
	console.log('hello');
    });
})
})();
