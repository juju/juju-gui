'use strict';

YUI.add('ns-routing-app-extension', function(Y) {

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

      parts = url.split(this._fragment);
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
    url: function(components, options) {
      var base = Y.mix({}, components);
      var url = '/';
      options = options || {};

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
        if (!(base[ns] === '/' && options.excludeRootPaths)) {
          url += ':' + ns + ':' + base[ns];
        }
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
        // A value for the default namespace was not supplied in the incoming
        // url, which means we should use the default namespace's "orig"
        // value. (The "parse" method will set the default namespace's value
        // to "/" if no value is provided, but this should not override the
        // original value).
        delete incoming[this.defaultNamespace];
      }
      url = this.url(Y.mix(orig, incoming, true, Y.Object.keys(incoming)),
        true); // excludeRootPaths
      return url;

    }
  };

  /**
    Add namespaced routing functionality to a Y.App instance.

    @class NSRouter
    @extension App
  */
  function NSRouter() {
    // nsRouter is a juju.Router.  It provides a lot of utility methods for
    // working with namespaced URLs.
    this.nsRouter = Y.namespace('juju').Router(this.defaultNamespace);
  }

  NSRouter.ATTRS = {};

  NSRouter.prototype = {

    /**
      The applications default namespace

      @property defaultNamespace
      @type {string}
    */
    defaultNamespace: '',

    /**
     * Internal state tracker. This makes sure a given route
     * dispatches once per any dispatch call with regard to
     * namespace components.  This is important for routes registered
     * without namespaces.
     *
     * @method _routeStateTracker
     **/
    _routeStateTracker: function(req, res, next) {
      var seen = this._routeSeen,
          callbackId = req.callbackId;

      if (callbackId && seen[callbackId]) {
        // Calling next with a route error aborts
        // further callbacks in _this_ array (remember
        // route.callbacks is an array per route).
        // But it can allow continued processing.
        next('route');
      }
      next();
      seen[callbackId] = true;
    },

    /*
      Y.Router override methods to enable namespace routing
    */

    /**
     * NS aware navigate wrapper. This has the feature
     * of preserving existing namespaces in the URL.  In other words, you can
     * provide only a single namespace value, and all other namespaces are
     * maintained, unless you pass the overrideAllNamespaces option in the
     * options object, in which case the other namespaces are removed.
     *
     * @method _navigate
     **/
    _navigate: function(url, options) {
      var result;
      if (options && options.overrideAllNamespaces) {
        result = url;
        delete options.overrideAllNamespaces;
      } else {
        var loc = Y.getLocation();
        var qs = this.nsRouter.getQS(url);
        result = this.nsRouter.combine(loc.pathname, url);
        if (qs) {
          result += '?' + qs;
        }
      }
      if (Y.App.prototype._navigate.call(this, url, options)) {
        // Queue/Save the entire URL, not just the new fragment.
        this._queue(result, true);
        return true;
      }
      return false;
    },

    /**
     * Null-queue for NS routing. The 1ms delay in the queue presents problems
     * and is unnecessary for our supported browsers, so we save URLs as they
     * come.
     *
     * Overrides superclass, formalizes dependency on HTML5 paths.
     * @method _queue
     **/
    _queue: function() {
      // Sync Invocation
      this._save.apply(this, arguments);
    },

    /**
    Dispatches to the first route handler that matches the specified _path_.

    If called before the `ready` event has fired, the dispatch will be aborted.
    This ensures normalized behavior between Chrome (which fires a `popstate`
    event on every pageview) and other browsers (which do not).

    @method _dispatch
    @param {String} path URL path.
    @param {String} url Full URL.
    @param {String} src What initiated the dispatch.
    @chainable
    @protected
    **/
    _dispatch: function(path, url, src) {
      var self = this,
          routes,
          callbacks = [],
          namespaces = [],
          matches, req, res, parts;

      // These are used by underlying YUI machinery.
      self._dispatching = self._dispatched = true;

      parts = this.nsRouter.split(path);
      namespaces = this.nsRouter.parse(parts.pathname);
      // Clear out the "seen" stash because we are starting a new URL
      // dispatch.  This data structure helps us from processing the same non-
      // namespaced route multiple times for each URL.
      this._routeSeen = {};

      Y.each(namespaces, function(fragment, namespace) {
        routes = self.match(fragment, namespace);
        if (!routes || !routes.length) {
          self._dispatching = false;
          return self;
        }

        req = self._getRequest(fragment, url, src);
        res = self._getResponse(req);

        // This method is a recursive closure, which mutates a number of
        // variables in the enclosing scope, most notably the callbacks and
        // routes.  Read carefully!
        req.next = function(err) {
          var subApp, callback, route, callingContext;

          if (err) {
            // Special case "route" to skip to the next route handler
            // avoiding any additional callbacks for the current route.
            if (err === 'route') {
              callbacks = [];
              req.next();
            } else {
              Y.error(err);
            }

          } else if ((callback = callbacks.shift())) {

            if (typeof callback === 'string') {
              subApp = self.get('subApps')[namespace];

              if (subApp && typeof subApp[callback] === 'function') {
                callback = subApp[callback];
                callingContext = subApp;
                subApp.verifyRendered();
              } else if (typeof self[callback] === 'function') {
                callback = self[callback];
                callingContext = self;
              } else {
                console.error('Callback function `', callback,
                    '` does not exist under the namespace `', namespace,
                    '` at the path `', path, '`.');
              }
            }

            // Allow access to the num or remaining callbacks for the route.
            req.pendingCallbacks = callbacks.length;
            // Attach the callback id to the request.
            req.callbackId = Y.stamp(callback, true);
            callback.call(callingContext, req, res, req.next);

          } else if ((route = routes.shift())) {
            // Make a copy of this route's `callbacks` and find its matches.
            callbacks = route.callbacks.concat();
            matches = route.regex.exec(fragment);

            // Use named keys for parameter names if the route path contains
            // named keys. Otherwise, use numerical match indices.
            if (matches.length === route.keys.length + 1) {
              req.params = Y.Array.hash(route.keys, matches.slice(1));
            } else {
              req.params = matches.concat();
            }

            // Allow access tot he num of remaining routes for this request.
            req.pendingRoutes = routes.length;

            // Execute this route's `callbacks`.
            req.next();
          }
        };

        req.next();
      });


      self._dispatching = false;
      return self._dequeue();
    },

    /** Overridden Y.Route.match to support namespaced routes.
     *
     * @method match
     * @param {String} path to match.
     * @param {String} namespace (optional) return route to have a matching
     *                 namespace attribute. If no namespace was specified
     *                 routes will match in the default namespace only.
     **/
    match: function(path, namespace) {
      var defaultNS = this.defaultNamespace;
      if (!namespace) {
        namespace = defaultNS;
      }

      return Y.Array.filter(this._routes, function(route) {
        var routeNS = route.namespace || defaultNS;
        if (path.search(route.regex) > -1) {
          if (routeNS === namespace) {
            return true;
          }
        }
        return false;
      }, this);
    },

    /**
     * Override Y.Router.route (and setter) to allow inclusion of additional
     * routing params.
     *
     * @method _setRoutes
     * @private
     */
    _setRoutes: function(routes) {
      this._routes = [];
      Y.Array.each(routes, function(route) {
        // Additionally pass route as options. This is needed to pass through
        // the attribute setter.
        // Callback can be an array. We push a state tracker to the head of
        // each callback chain.
        var callbacks = route.callbacks || route.callback;
        if (!Y.Lang.isArray(callbacks)) {
          callbacks = [callbacks];
        }
        // Tag each callback such that we can resolve it in
        // the state tracker.
        Y.Array.each(callbacks, function(cb) {Y.stamp(cb);});
        // Inject our state tracker.
        if (callbacks[0] !== '_routeStateTracker') {
          callbacks.unshift('_routeStateTracker');
        }
        route.callbacks = callbacks.concat();
        // Additionally pass the route with its extended
        // attribute set.
        this.route(route.path, route.callbacks, route);
      }, this);
      return this._routes.concat();
    },

    /**
     * Override the App route builder. This method adds the ability to
     * send multiple callbacks, and the ability to specify arbitrary
     * additional attributes in the options argument.
     *
     * @method route
     */
    route: function(path, callbacks, options) {
      callbacks = Y.Array(callbacks);
      var keys = [];
      var routeData = Y.mix({
        callbacks: callbacks,
        keys: keys,
        path: path,
        regex: this._getRegex(path, keys),

        // For back-compat.
        // This may no longer be required but is being left here until
        // proper tests are written to guarantee there are no side effects
        callback: callbacks[0]
      }, options);
      this._routes.push(routeData);
      return this;
    }


  };

  Y.namespace('juju').Router = function(defaultNamespace) {
    var r = Object.create(_Router);
    r.defaultNamespace = defaultNamespace;
    return r;
  };

  Y.namespace('juju').NSRouter = NSRouter;

}, '0.1.0', {
  requires: ['oop']
});
