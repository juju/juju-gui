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
    pairs: function() {return pairs(this);}
  };

  // Multi dimensional router (TARDIS).
  var _Router = {
    // Regex to parse namespace, url fragment pairs.
    _fragment: /\/?(:\w+\:)/,
    _regexUrlOrigin: /^(?:[^\/#?:]+:\/\/|\/\/)[^\/]*/,
    defaultNamespace: 'default',

    /**
     * Return the query string portion of a URL.
     * @method getQS
     **/
    getQS: function(url) {
      return url.split('?')[1];
    },

    /**
     * Split a URL into components, a subset of the
     * Location Object.
     *
     * @method split
     * @param {String} url to split.
     * @return {Object} hash of URL parts.
     **/
    split: function(url) {
      var result = {
        href: url
      };
      var origin = this._regexUrlOrigin.exec(url);
      result.search = this.getQS(url);

      if (origin) {
        // Take the match.
        result.origin = origin = origin[0];
        // And remove it from the url.
        result.pathname = url.substr(origin.length);
     } else {
       result.pathname = url;
     }

     if (result.search) {
       result.pathname = result.pathname.substr(0,
                           (result.pathname.length - result.search.length) - 1);
     }

      return result;
    },

    /**
     * Parse a url into an Object with namespaced url fragments for values.
     * Each value will be normalized to include a trailing slash
     * ('/').
     *
     * @method parse
     * @param {String} url to parse.
     * @return {Object} result is {ns: url fragment {String}}.
     **/
    parse: function(url) {
      var result = Object.create(Routes, {
        defaultNamespacePresent: {
          enumerable: false,
          writable: true
        }
      });
      var parts = this.split(url);
      url = parts.pathname;

      var parts = url.split(this._fragment);
      //  > '/foo/bar'.split(this._fragment)
      //    ["/foo/bar"]
      //  > :baz:/foo/bar'.split(this._fragment)
      //    ["", ":baz:", "/foo/bar"]
      if (parts[0]) {
       // This is a URL fragment without a namespace.
       parts[0] = rtrim(parts[0], '/') + '/';
       result[this.defaultNamespace] = parts[0];
       result.defaultNamespacePresent = true;
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
          val = parts[i + 1];
        }

        if (result[ns] !== undefined) {
          console.log('URL has more than one reference to same namespace');
        }
        if (ns === this.defaultNamespace) {
          result.defaultNamespacePresent = true;
        }
        result[ns] = rtrim(val, '/') + '/';
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
      var base = Y.mix({}, components);
      var url = '/';

      function slash(u) {
        if (u.lastIndexOf('/') !== u.length - 1) {
          u += '/';
        }
        return u;
      }

      if (base[this.defaultNamespace]) {
        url += trim(base[this.defaultNamespace], '/');
        delete base[this.defaultNamespace];
      }

      // Sort base properties such
      // that output ordering is uniform.
      var keys = Y.Object.keys(base).sort();
      Y.each(keys, function(ns) {
        url = slash(url);
        url += ':' + ns + ':' + base[ns];
      });

      url = slash(url);
      return url;
    },

    /**
     * Smartly combine new namespaced url components with old.
     *
     * @method combine
     * @param {Object} orig url.
     * @param {Object} incoming new url.
     * @return {String} a new namespaced url.
     **/
    combine: function(orig, incoming) {
      var url;

      if (Y.Lang.isString(orig)) {
        orig = this.parse(orig);
      }
      if (Y.Lang.isString(incoming)) {
        incoming = this.parse(incoming);
      }

      if (!incoming.defaultNamespacePresent) {
        // The default namespace was supplied (rather
        // than defaulting to /) in the incoming url,
        // this means we can safely override it.
        delete incoming[this.defaultNamespace];
      }
      url = this.url(
        Y.mix(orig, incoming, true, Y.Object.keys(incoming)));
      return url;

    }
  };

  Y.namespace('juju').Router = function(defaultNamespace) {
    var r = Object.create(_Router);
    r.defaultNamespace = defaultNamespace;
    return r;
  };


}, '0.1.0', {
  requires: ['oop']
});
