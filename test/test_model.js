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

             
    it("service unit list should be able to get units of a given service", 
       function() {
        var sl = new models.ServiceList();
        var sul = new models.ServiceUnitList();
        var mysql = new models.Service({name: "mysql"});
        var wordpress = new models.Service({name: "wordpress"});
        sl.add([mysql, wordpress]);
        sl.getById("mysql").should.equal(mysql);
        sl.getById("wordpress").should.equal(wordpress);

        var my0 = new models.ServiceUnit({service:mysql,
                                         name:"mysql/0"}),
           my1 = new models.ServiceUnit({service:mysql,
                                         name:"mysql/1"});

        sul.add([my0, my1]);

        var wp0 = new models.ServiceUnit({service:wordpress,
                                         name:"wordpress/0"}),
           wp1 = new models.ServiceUnit({service:wordpress,
                                         name:"wordpress/1"});
        sul.add([wp0, wp1]);
        wp0.get("service").should.equal(wordpress);
       
       sul.get_units_for_service(mysql, true).getAttrs(["id"]).id.should.eql(
           ["mysql/0", "mysql/1"]);
       sul.get_units_for_service(wordpress, true).getAttrs(
           ["id"]).id.should.eql(["wordpress/0", "wordpress/1"]);
    });
             
             
    });
})();
