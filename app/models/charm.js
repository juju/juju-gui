'use strict';

YUI.add('juju-charm-models', function(Y) {

  var models = Y.namespace('juju.models');

  // This is how the charm_id_re regex works for various inputs.  The first
  // element is always the initial string, which we have elided in the
  // examples.
  // 'cs:~marcoceppi/precise/word-press-17' ->
  // [..."cs", "marcoceppi", "precise", "word-press", "17"]
  // 'cs:~marcoceppi/precise/word-press' ->
  // [..."cs", "marcoceppi", "precise", "word-press", undefined]
  // 'cs:precise/word-press' ->
  // [..."cs", undefined, "precise", "word-press", undefined]
  // 'cs:precise/word-press-17'
  // [..."cs", undefined, "precise", "word-press", "17"]
  var charm_id_re = /^(?:(\w+):)?(?:~(\S+)\/)?(\w+)\/(\S+?)(?:-(\d+))?$/,
      parse_charm_id = function(id) {
        var parts = charm_id_re.exec(id),
            result = {};
        if (parts) {
          parts.shift();
          Y.each(
              Y.Array.zip(
                  ['scheme', 'owner', 'series', 'package_name', 'revision'],
                  parts),
              function(pair) { result[pair[0]] = pair[1]; });
          if (!Y.Lang.isValue(result.scheme)) {
            result.scheme = 'cs'; // This is the default.
          }
          return result;
        }
        // return undefined;
      },
      _calculate_full_charm_name = function(elements) {
        var tmp = [elements.series, elements.package_name];
        if (elements.owner) {
          tmp.unshift('~' + elements.owner);
        }
        return tmp.join('/');
      },
      _calculate_charm_store_path = function(elements) {
        return [(elements.owner ? '~' + elements.owner : 'charms'),
                elements.series, elements.package_name, 'json'].join('/');
      },
      _calculate_base_charm_id = function(elements) {
        return elements.scheme + ':' + _calculate_full_charm_name(elements);
      },
      _reconsititute_charm_id = function(elements) {
        return _calculate_base_charm_id(elements) + '-' + elements.revision;
      },
      _clean_charm_data = function(data) {
        data.is_subordinate = data.subordinate;
        Y.each(['subordinate', 'name', 'revision', 'store_revision'],
               function(nm) { delete data[nm]; });
        return data;
      };
  // This is exposed for testing purposes.
  models.parse_charm_id = parse_charm_id;

  // For simplicity and uniformity, there is a single Charm class and a
  // single CharmList class. Charms, once instantiated and loaded with data
  // from their respective sources, are immutable and read-only. This reflects
  // the reality of how we interact with them.

  // Charm instances can represent both environment charms and charm store
  // charms.  A charm id is reliably and uniquely associated with a given
  // charm only within a given context--the environment or the charm store.

  // Therefore, the database keeps these charms separate in two different
  // CharmList instances.  One is db.charms, representing the environment
  // charms.  The other is maintained by and within the persistent charm panel
  // instance. As you'd expect, environment charms are what to use when
  // viewing or manipulating the environment.  Charm store charms are what we
  // can browse to select and deploy new charms to the environment.

  // Environment charms begin their lives with full charm ids, as provided by
  // services in the environment:

  // [SCHEME]:(~[OWNER]/)?[SERIES]/[PACKAGE NAME]-[REVISION].

  // With an id, we can instantiate a charm: typically we use
  // "db.charms.add({id: [ID]})".  Finally, we load the charm's data from the
  // environment using the standard YUI Model method "load," providing an
  // object with a get_charm callable, and an optional callback (see YUI
  // docs).  The env has a get_charm method, so, by design, it works nicely:
  // "charm.load(env, optionalCallback)".  The get_charm method is expected to
  // return what the env version does: either an object with a "result" object
  // containing the charm data, or an object with an "err" attribute.

  // The charms in the charm store have a significant difference, beyond the
  // source of their data: they are addressed in the charm store by a path
  // that does not include the revision number, and charm store searches do
  // not include revision numbers in the results.  Therefore, we cannot
  // immediately instantiate a charm, because it requires a full id in order
  // to maintain the idea of an immutable charm associated with a unique charm
  // id.  However, the charm information that returns does have a revision
  // number (the most recent); moreover, over time the charm may be updated,
  // leading to a new charm revision.  We model this by creating a new charm.

  // Since we cannot create or search for charms without a revision number
  // using the normal methods, the charm list has a couple of helpers for this
  // story.  The workhorse is "loadOneByBaseId".  A "base id" is an id without
  // a revision.

  // The arguments to "loadOneById" are a base id and a hash of other options.
  // The hash must have a "charm_store" attribute, that itself loadByPath
  // method, like the one in app/store/charm.js.  It may have zero or more of
  // the following: a success callback, accepting the fully loaded charm with
  // the newest revision for the given base id; a failure callback, accepting
  // the Y.io response object after a failure; and a "force" attribute that,
  // if it is a Javascript boolean truth-y value, forces a load even if a
  // charm with the given id already is in the charm list.

  // "getOneByBaseId" simply returns the charm with the highest revision and
  // "the given base id from the charm list, without trying to load
  // "information.

  // In both cases, environment charms and charm store charms, a charm's
  // "loaded" attribute is set to true once it has all the data from its
  // environment.

  var Charm = Y.Base.create('charm', Y.Model, [], {
    initializer: function() {
      this.loaded = false;
      this.on('load', function() { this.loaded = true; });
    },
    sync: function(action, options, callback) {
      if (action !== 'read') {
        throw (
            'Only use the "read" action; "' + action + '" not supported.');
      }
      if (!Y.Lang.isValue(options.get_charm)) {
        throw 'You must supply a get_charm function.';
      }
      options.get_charm(
          this.get('id'),
          // This is the success callback, or the catch-all callback for
          // get_charm.
          function(response) {
            // Handle the env.get_charm response specially, for ease of use.  If
            // it doesn't match that pattern, pass it through.
            if (response.err) {
              callback(true, response);
            } else if (response.result) {
              callback(false, response.result);
            } else { // This would typically be a string.
              callback(false, response);
            }
          },
          // This is the optional error callback.
          function(response) {
            callback(true, response);
          }
      );
    },
    parse: function() {
      return _clean_charm_data(Charm.superclass.parse.apply(this, arguments));
    }
  }, {
    ATTRS: {
      id: {
        lazyAdd: false,
        setter: function(val) {
          if (!val) {
            return val;
          }
          var parts = parse_charm_id(val),
              self = this;
          parts.revision = parseInt(parts.revision, 10);
          Y.each(parts, function(value, key) {
            self._set(key, value);
          });
          this._set(
              'charm_store_path', _calculate_charm_store_path(parts));
          this._set('full_name', _calculate_full_charm_name(parts));
          return _reconsititute_charm_id(parts);
        },
        validator: function(val) {
          var parts = parse_charm_id(val);
          return (parts && Y.Lang.isValue(parts.revision));
        }
      },
      // All of the below are loaded except as noted.
      bzr_branch: {writeOnce: true},
      charm_store_path: {readOnly: true}, // calculated
      config: {writeOnce: true},
      description: {writeOnce: true},
      full_name: {readOnly: true}, // calculated
      is_subordinate: {writeOnce: true},
      last_change:
          { writeOnce: true,
            setter: function(val) {
              // Normalize created value from float to date object.
              if (val && val.created) {
                // Mutating in place should be fine since this should only
                // come from loading over the wire.
                val.created = new Date(val.created * 1000);
              }
              return val;
            }
          },
      maintainer: {writeOnce: true},
      metadata: {writeOnce: true},
      package_name: {readOnly: true}, // calculated
      owner: {readOnly: true}, // calculated
      peers: {writeOnce: true},
      proof: {writeOnce: true},
      provides: {writeOnce: true},
      requires: {writeOnce: true},
      revision: {readOnly: true}, // calculated
      scheme: {readOnly: true}, // calculated
      series: {readOnly: true}, // calculated
      summary: {writeOnce: true},
      url: {writeOnce: true}
    }
  });
  models.Charm = Charm;

  var CharmList = Y.Base.create('charmList', Y.ModelList, [], {
    model: Charm,

    initializer: function() {
      this._baseIdHash = {}; // base id (without revision) to array of charms.
    },

    _addToBaseIdHash: function(charm) {
      var baseId = charm.get('scheme') + ':' + charm.get('full_name'),
          matches = this._baseIdHash[baseId];
      if (!matches) {
        matches = this._baseIdHash[baseId] = [];
      }
      matches.push(charm);
      // Note that we don't handle changing baseIds or removed charms because
      // that should not happen.
      // Sort on newest charms first.
      matches.sort(function(a, b) {
        var revA = parseInt(a.get('revision'), 10),
            revB = parseInt(b.get('revision'), 10);
        return revB - revA;
      });
    },

    add: function() {
      var result = CharmList.superclass.add.apply(this, arguments);
      if (Y.Lang.isArray(result)) {
        Y.each(result, this._addToBaseIdHash, this);
      } else {
        this._addToBaseIdHash(result);
      }
      return result;
    },

    getOneByBaseId: function(id) {
      var match = parse_charm_id(id),
          baseId = match && _calculate_base_charm_id(match),
          charms = baseId && this._baseIdHash[baseId];
      return charms && charms[0];
    },

    loadOneByBaseId: function(id, options) {
      var match = parse_charm_id(id);
      if (match) {
        if (!options.force) {
          var charm = this.getOneByBaseId(_calculate_base_charm_id(match));
          if (charm) {
            if (options.success) {
              options.success(charm);
            }
            return;
          }
        }
        var path = _calculate_charm_store_path(match),
            self = this;
        options.charm_store.loadByPath(
            path,
            { success: function(data) {
              // We fall back to 0 for revision.  Some records do not have one
              // still in the charm store, such as
              // http://jujucharms.com/charms/precise/appflower/json (as of this
              // writing).
              match.revision = data.store_revision || 0;
              id = _reconsititute_charm_id(match);
              charm = self.getById(id);
              if (!charm) {
                charm = self.add({id: id});
                charm.setAttrs(_clean_charm_data(data));
                charm.loaded = true;
              }
              if (options.success) {
                options.success(charm);
              }
            },
            failure: options.failure });
      } else {
        throw id + ' is not a valid base charm id';
      }
    }
  }, {
    ATTRS: {}
  });
  models.CharmList = CharmList;

}, '0.1.0', {
  requires: [
    'model',
    'model-list'
  ]
});
