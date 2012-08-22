describe("Application", function() {
  before(function(done) {
      var Y, app;
      Y = YUI(GlobalConfig).use("juju-gui", function (Y) {
          app = new Y.juju.App(AppConfig).render();
          done();
        });

  });

  it("should produce a valid index", function() {
      container = app.get("container");
      container.getAttribute("id").should.equal("main");
      container.getAttribute("class").should.eql("container");
  });
});