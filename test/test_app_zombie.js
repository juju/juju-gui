    
// var Browser = require("zombie");
// require("../lib/base");

describe("Application", function() {
  it("should produce a valid index", function() {
      // Check that the yui-app styles have been added to the expected 
      // elements
      container.getAttribute("id").should.equal("main");
      container.getAttribute("class").should.eql("container");
         
  });
});