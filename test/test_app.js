var YUI = require("yui").YUI,
    base = require("./base.js");

(function () {
describe("juju gui application", function() {
    var Y, app;

    before(function (done) {
            Y = YUI(base.TestConfig).use("juju-gui", function (Y) {
            console.log(base.TestConfig, base.AppConfig);
            app = new Y.juju.App(base.AppConfig);
            done();
        });
    });
 
    it("app should have views", function() {
            app.views.should.have.overview;
            app.views.should.have.status;
        
       });
   
    });
})();
