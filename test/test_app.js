"use strict";
/*global after:false, before:false, describe:false, GlobalConfig:false,
  it:false, YUI:false */

function injectData(app, data) {
    var d = data || {"result": [["service", "add", {"charm": "cs:precise/wordpress-6", "id": "wordpress", "exposed": false}], ["service", "add", {"charm": "cs:precise/mysql-6", "id": "mysql"}], ["relation", "add", {"interface": "reversenginx", "scope": "global", "endpoints": [["wordpress", {"role": "peer", "name": "loadbalancer"}]], "id": "relation-0000000000"}], ["relation", "add", {"interface": "mysql", "scope": "global", "endpoints": [["mysql", {"role": "server", "name": "db"}], ["wordpress", {"role": "client", "name": "db"}]], "id": "relation-0000000001"}], ["machine", "add", {"agent-state": "running", "instance-state": "running", "id": 0, "instance-id": "local", "dns-name": "localhost"}], ["unit", "add", {"machine": 0, "agent-state": "started", "public-address": "192.168.122.113", "id": "wordpress/0"}], ["unit", "add", {"machine": 0, "agent-state": "started", "public-address": "192.168.122.222", "id": "mysql/0"}]], "op": "delta"};
    app.env.dispatch_result(d);
    return app;
}

describe("Application", function() {
  var Y, app;

  before(function(done) {
      Y = YUI(GlobalConfig).use("juju-gui", function (Y) {
          app = new Y.juju.App({
                  container: "#main",
                  viewContainer: "#main"
                  });
          injectData(app).render();
          done();
        });

  });

  after(function(done) {
      var active_view = app.get("activeView");
      if (active_view) {
          active_view.destroy({remove: true});
      } else {
          Y.one(app.get("container")).setHTML("");
      }
      done();
  });

  it("should produce a valid index", function() {
      var container = app.get("container");
      container.getAttribute("id").should.equal("main");
      container.getAttribute("class").should.include("container");
  });

  it("should be able to render the environment view with default data",
     function() {
       var container = app.get("container");
       app.showView("environment", {domain_models: app.db});
       container.one("svg").should.not.equal(null);
  });

});
