var Browser = require("zombie");

require("../lib/base");
        
describe("Headless Application", function() {
  before(function(done) {
    this.browser = new Browser();
    this.browser
      .visit(BASE_URL)
      .then(done, done);
  });

  it("should produce a valid index", function() {
         var b = this.browser,
             doc = b.document,
             container = b.query("#main");
         
         b.location.pathname.should.equal("/");
                 
         // Check that the yui-app styles have been added to the expected 
         // elements
         container.getAttribute("id").should.equal("main");
         container.getAttribute("class").should.eql("container");
         
  });
});