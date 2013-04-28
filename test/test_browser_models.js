'use strict';

(function() {

  describe('browser filter model', function() {
    var browser, Filter, models, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-models', 'juju-browser-models'], function(Y) {
        models = Y.namespace('juju.models');
        browser = models.browser;
        Filter = browser.Filter;
        done();
      });
    });

    // Ensure the search results are rendered inside the container.
    it('defaults to an initial filter set', function() {
      var filter = new Filter();
      filter.get('series').should.eql(['precise']);
      filter.get('type').should.eql(['approved']);
    });

    it('constructs a valid query string based on settings.', function() {
      var filter = new Filter();
      filter.genQueryString().should.equal(
          'series=precise&text=&type=approved');

      filter.set('series', []);
      // Google and Firefox think that the string should start with the first
      // param. PhantomJS thinks it starts with a &. Removing the & if it's at
      // the start of the string and checking the rest of it for validity.
      var qstring = filter.genQueryString();
      if (qstring.charAt(0) === '&') {
        qstring = qstring.slice(1);
      }

      qstring.should.equal('text=&type=approved');
    });
  });

})();
