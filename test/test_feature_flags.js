'use strict';

(function() {

  describe('window feature flag tests', function() {

    it('picks up there are flags in the url', function() {
      debugger;
      var url = '/:flags:/foo/bar=10',
          flags = featureFlags(url);
      flags.foo.should.eql(true);
      flags.bar.should.eql('10');
    });

    it('pulls flags from the config if available', function () {
      var url = '/:flags:/foo/bar=10',
          config = {baz: 'three'},
          flags = featureFlags(url, config);
      flags.foo.should.eql(true);
      flags.bar.should.eql('10');
      flags.baz.should.eql('three');
    });

    it('overwrites config flags with url flags', function () {
      var url = '/:flags:/foo/bar=10',
          config = {bar: 3},
          flags = featureFlags(url, config);
      flags.foo.should.eql(true);
      flags.bar.should.eql('10');
    });

    it('parses urls with and without flags', function () {
      var urls = {
        '/:flags:/': {

        },

        '/:flags:/foo/': {
          foo: true
        },

        '/:flags:/foo=10/bar=true/': {
          foo: '10',
          bar: 'true'
        },

        '/:flags:/foo=10/bar=true/:gui:/something': {
          foo: '10',
          bar: 'true'
        },

        '/:gui:/something/:flags:/foo/': {
          foo: true
        },

        '/:gui:/something/:flags:/foo=10/:charmbrowser:/fullscreen/charm/id': {
          foo: '10'
        },

        '/:flags:/foo/bar=baz=bar/': {
          foo: true,
          bar: 'baz=bar'
        }
      };

      for (var url in urls) {
        assert.deepEqual(featureFlags(url), urls[url]);
      }
    });

  });
})();

