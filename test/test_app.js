var YUI = require("yui").YUI,
    base = require("../lib/base.js");


(function () {
describe("juju gui application", function() {
    var Y, app;

    before(function (done) {
            Y = YUI(base.TestConfig).use("juju-gui", function (Y) {
            app = new Y.juju.App(base.AppConfig);
            done();
        });
    });
 
    it("app should have views", function() {
           app.views["service"].should.be.ok;
           app.views["environment"].should.be.ok;
           
       });
   
    });
})();
