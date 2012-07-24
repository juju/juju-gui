var path = require("path"),
    YUI = require("yui").YUI;

(function () {
    
describe("juju models", function() {
    var Y, models;

    before(function (done) {
        Y = YUI({
        modules: {
            'juju-models': {
                requires: ["model", "model-list"],
                fullpath: path.join(
                    __dirname, 
                    '../app/models/models.js')
            }
        }
        }).use("base", "juju-models", function (Y) {
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
        
       });
             
    });
})();
