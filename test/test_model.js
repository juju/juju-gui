var YUI = require("yui").YUI,
    base= require("./base.js");


(function () {
    
describe("juju models", function() {
    var Y, models;

    before(function (done) {
        Y = YUI(base.TestConfig).use("base", "juju-models", function (Y) {
            models = Y.namespace("juju.models");
            done();
        });
    });
 
 
    it("must be able to create charm", function() {
           var charm = new models.Charm({name: "mysql"});
           charm.get("name").should.eql("mysql");
       });

    it("must be able to create charm list", function() {
        var c1 = new models.Charm({name: "mysql",
                                  description: "A DB"}),
            c2 = new models.Charm({name: "logger",
                                  description: "Log sub"}),
            clist = new models.CharmList().add([c1, c2]);
           var names = clist.map(function(c) {return c.get("name");});
           names[0].should.equal("mysql");
           names[1].should.equal("logger");
       });
             
    });
})();
