'use strict';


describe('search view', function() {
  var Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['subapp-browser-searchview'], function(Y) {
          done();
        });
  });

  beforeEach(function() {
  });

  afterEach(function() {
  });

  it('exists');
});
