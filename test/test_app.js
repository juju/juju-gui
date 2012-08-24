describe("Application", function() {
  var Y, app;

  before(function(done) {
      Y = YUI(GlobalConfig).use("juju-gui", function (Y) {
          app = new Y.juju.App({
                  container: "#main",
                  viewContainer: "#main"
                  }).render();
          done();
        });

  });

  it("should produce a valid index", function() {
      container = app.get("container");

      container.getAttribute("id").should.equal("main");
      container.getAttribute("class").should.include("container");
  });
});