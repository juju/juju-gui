'use strict';

(function() {

  /**
    Feature flags support in URL routing.

    This allows us to use the :flags: NS to set either boolean or string
    feature flags to control various features in the app.  A simple /<flag>/
    will set that flag as true in the global flags variable.  A
    /<flag>=<val>/ will set that flag to that value in the global flags
    variable. An example usage would be to turn on the ability to drag-and-
    drop a feature by wrapping that feature code in something like:

      if (flags['gui.featuredrag.enable']) { ... }

    From the LaunchPad feature flags documentation:

    > As a general rule, each switch should be checked only once or only a
    > few time in the codebase. We don't want to disable the same thing in
    > the ui, the model, and the database.
    >
    > The name looks like dotted python identifiers, with the form
    > APP.FEATURE.EFFECT. The value is a Unicode string.

    A shortened version of key can be used if they follow this pattern:
    - The feature flag applies to the gui.
    - The presence of the flag indicates Boolean enablement
    - The (default) absence of the flag indicates the feature will be
    unavailable.

    If those conditions are met then you may simply use the descriptive name
    of the feature taking care it uniquely defines the feature. An example is
    rather than specifying gui.dndexport.enable you can specify dndexport as a
    flag.

    @method featureFlags
    @param {object} url The request object.
    @param {object} configFlags The response object.
  */
  var featureFlags = function(url, configFlags) {
    var flags = configFlags || {},
        flagsRegex = new RegExp(/:flags:\/([^:])*/g);

    var found = url.match(flagsRegex);

    // Sometimes it matches a trailing / as a second item.
    if (found.length) {
      found = found[0];
    }

    // Check if the :flags: namespace is in the url.
    if (found) {
      // Make sure we trim a trailing / to prevent extra data in the split
      var urlFlags = found.replace(/\/+$/, '').split('/');

      // remove the first :flags: match from the split results.
      urlFlags = urlFlags.slice(1);

      urlFlags.forEach(function(flag) {
          var key = flag;
          var value = true;

          // Allow setting a specific value other than true.
          var equals = flag.indexOf('=');
          if (equals !== -1) {
            key = flag.slice(0, equals);
            // Add one to the index to make sure we drop the first equals from
            // the string.
            value = flag.slice((equals + 1));
          }

          flags[key] = value;
      });
    }

    return flags;

    // TODO sticking it on the window object is the job of the caller from
    // index.html here.
  };



  describe.only('window feature flag tests', function() {
    // var ;

    before(function(done) {
      done();
    });

    beforeEach(function() {
    });

    afterEach(function() {
      if (window.juju_config) {
        delete window.juju_config;
      }
    });

    it('picks up there are flags in the url', function() {
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

