// YUI = require("yui").YUI,
//   base= require("../lib/base.js");


(function () {
    
describe("Environment connection", function() {
    var Y, juju;

    before(function (done) {
	console.log('before test');
        Y = YUI(GlobalConfig).use("base", "node", "juju-models", function (Y) {
            juju = Y.namespace("juju");
            done();
	});
    })
  
    it("must be able to create an environment", function() {
	console.log('hello');
    });
})
})();
