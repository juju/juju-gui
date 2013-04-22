'use strict';

describe('api failure utility', function() {
  var Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use('subapp-browser-view-utils', function(Y) {
          done();
        });
  });

  beforeEach(function() {});

  afterEach(function() {});

  it('exists', function() {
    assert.isFunction(Y.juju.browser.views.utils.apiFailure);
  });
});
