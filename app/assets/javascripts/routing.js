'use strict';

YUI.add('juju-routing', function(Y) {

  function _trim(s, char, leading, trailing) {
    // remove leading, trailing char.
    while (leading && s && s.indexOf(char) === 0) {
      s = s.slice(1, s.length);
    }
    while (trailing && s && s.lastIndexOf(char) === (s.length - 1)) {
      s = s.slice(0, s.length - 1);
    }
    return s;
  }

  function trim(s, char) { return _trim(s, char, true, true); }
  function rtrim(s, char) { return _trim(s, char, false, true); }
  function ltrim(s, char) { return _trim(s, char, true, false); }


  /**
   * Return a sorted array of namespace, url pairs.
   *
   * @method pairs
   * @return {Object} [[namespace, url]].
   **/
  function pairs(o) {
    var result = [],
        keys = Y.Object.keys(o).sort();

    Y.each(keys, function(k) {
      result.push([k, o[k]]);
    });
    return result;
  }

  var Routes = {
    pairs: function() {return pairs(this);},
    defaultNamespace: 'default'
  };

  // Multi dimensional router (TARDIS).
  var _Router = {
    // Regex to parse namespace, url fragment pairs.
    fragment: /\/?(:\w+\:)/,

    /**
     * normalize a url w/o its qs.
     * @method _normalize
     * @return {Object} {url: string, qs: querystring}.
     **/
    _normalize: function(url) {
      return url.split('?')[0];
    },

    getQS: function(url) {
      return url.split('?')[1];
    },

    /**
     * @method parse
     * @param {String} url to parse.
     * @return {Object} result is {ns: url fragment {String}}.
     **/
    parse: function(url) {
      var result = Object.create(Routes);
      url = this._normalize(url);

      var parts = url.split(this.fragment);
      if (parts[0]) {
        // This is a URL fragment w/o a namespace
        //  > '/foo/bar'.split(/\/?(:\w+\:)/)
        //    ["/foo/bar"]
        //  > :baz:/foo/bar'.split(/\/?(:\w+\:)/)
        //    ["", ":baz:", "/foo/bar"]
        result[this.defaultNamespace] = parts[0];
      } else {
        result[this.defaultNamespace] = '/'; // A sane default.
      }
      // Now scan each pair after [0] for ns/route elements
      for (var i = 1; i < parts.length; i += 2) {
        var ns = trim(parts[i], ':'),
            val = '/';

        if ((i + 1) > parts.length) {
          console.log('URL namespace without path');
        } else {
          val = rtrim(parts[i + 1], '/');
        }

        if (result[ns] !== undefined) {
          console.log('URL has more than one refernce to same namespace');
        }
        result[ns] = val;
      }
      return result;
    },

    /**
     * Given an object with ns:url_fragment pairs
     * produce a properly ordered url.
     *
     * @method url
     * @param {Object} componets is the result of a parse(url) call.
     * @return {String} url.
     **/
    url: function(components) {
      var base = Y.mix(components);
      var u = '/';

      function slash(u) {
        if (u.lastIndexOf('/') !== u.length - 1) {
          u += '/';
        }
        return u;
      }

      if (base[this.defaultNamespace]) {
        u += trim(base[this.defaultNamespace], '/');
        delete base[this.defaultNamespace];
      }

      // Sort base properties such
      // that output ordering is uniform.
      var keys = Y.Object.keys(base).sort();
      Y.each(keys, function(ns) {
        u = slash(u);
        u += ':' + ns + ':' + base[ns];
      });

      u = slash(u);
      return u;
    }
  };

  Y.namespace('juju').Router = function(defaultNamespace) {
    var r = Object.create(_Router);
    r.defaultNamespace = defaultNamespace;
    return r;
  };


}, '0.0.1', {
  requires: ['oop']
});
