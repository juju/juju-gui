'use strict';

YUI.add('juju-charm-models', function(Y) {


  var models = Y.namespace('juju.models');

  // Charms, once instantiated and loaded with data from their respective
  // sources, are immutable and read-only. This reflects the reality of how we
  // interact with them.

  // Charm instances can represent both environment charms and charm store
  // charms.  A charm id is reliably and uniquely associated with a given
  // charm only within a given context--the environment or the charm store.

  // Therefore, the database keeps these charms separate in two different
  // CharmList instances.  One is db.charms, representing the environment
  // charms.  The other, from the charm store, is maintained by and within the
  // persistent charm panel instance. As you'd expect, environment charms are
  // what to use when viewing or manipulating the environment.  Charm store
  // charms are what we can browse to select and deploy new charms to the
  // environment.

  // Charms begin their lives with full charm ids, as provided by
  // services in the environment and the charm store:

  // [SCHEME]:(~[OWNER]/)?[SERIES]/[PACKAGE NAME]-[REVISION].

  // With an id, we can instantiate a charm: typically we use
  // "db.charms.add({id: [ID]})".  Finally, we load the charm's data over the
  // network using the standard YUI Model method "load," providing an object
  // with a get_charm callable, and an optional callback (see YUI docs).  Both
  // the env and the charm store have a get_charm method, so, by design, it
  // works easily: "charm.load(env, optionalCallback)" or
  // "charm.load(charm_store, optionalCallback)".  The get_charm method must
  // either callback using the default YUI approach for this code, a boolean
  // indicating failure, and a result; or it must return what the env version
  // does: an object with a "result" object containing the charm data, or an
  // object with an "err" attribute.

  // In both cases, environment charms and charm store charms, a charm's
  // "loaded" attribute is set to true once it has all the data from its
  // environment.

  var charm_id_re = /^(?:(\w+):)?(?:~(\S+)\/)?(\w+)\/(\S+?)-(\d+)$/,
      id_elements = ['scheme', 'owner', 'series', 'package_name', 'revision'],
      Charm = Y.Base.create('charm', Y.Model, [], {
        initializer: function() {
          var id = this.get('id'),
              parts = id && charm_id_re.exec(id),
              self = this;
          if (!Y.Lang.isValue(id) || !parts) {
            throw 'Developers must initialize charms with a well-formed id.';
          }
          this.loaded = false;
          this.on('load', function() { this.loaded = true; });
          parts.shift();
          Y.each(
              Y.Array.zip(id_elements, parts),
              function(pair) { self.set(pair[0], pair[1]); });
          // full_name
          var tmp = [this.get('series'), this.get('package_name')],
              owner = this.get('owner');
          if (owner) {
            tmp.unshift('~' + owner);
          }
          this.set('full_name', tmp.join('/'));
          // charm_store_path
          this.set(
              'charm_store_path',
              [(owner ? '~' + owner : 'charms'),
               this.get('series'),
               (this.get('package_name') + '-' + this.get('revision')),
               'json'
              ].join('/'));
        },
        sync: function(action, options, callback) {
          if (action !== 'read') {
            throw (
                'Only use the "read" action; "' + action + '" not supported.');
          }
          if (Y.Lang.isValue(options.get_charm)) {
            // This is an env.
            options.get_charm(
                this.get('id'),
                function(response) {
                  if (response.err) {
                    callback(true, response);
                  } else if (response.result) {
                    callback(false, response.result);
                  } else {
                    // What's going on?  This does not look like either of our
                    // expected signatures.  Declare a loading error.
                    callback(true, response);
                  }
                }
            );
          } else if (Y.Lang.isValue(options.loadByPath)) {
            // This is a charm store.
            options.loadByPath(
                this.get('charm_store_path'),
                { success: function(response) {
                  callback(false, response);
                },
                failure: function(response) {
                  callback(true, response);
                }
                });
          } else {
            throw 'You must supply a get_charm or loadByPath function.';
          }
        },
        parse: function() {
          var data = Charm.superclass.parse.apply(this, arguments),
              self = this;
          data.is_subordinate = data.subordinate;
          Y.each(data, function(value, key) {
            if (!value ||
                !self.attrAdded(key) ||
                Y.Lang.isValue(self.get(key))) {
              delete data[key];
            }
          });
          if (data.owner === 'charmers') {
            delete data.owner;
          }
          return data;
        },
        compare: function(other, relevance, otherRelevance) {
          // Official charms sort before owned charms.
          // If !X.owner, that means it is owned by charmers.
          var owner = this.get('owner'),
              otherOwner = other.get('owner');
          if (!owner && otherOwner) {
            return -1;
          } else if (owner && !otherOwner) {
            return 1;
          // Relevance is next most important.
          } else if (relevance && (relevance !== otherRelevance)) {
            // Higher relevance comes first.
            return otherRelevance - relevance;
          // Otherwise sort by package name, then by owner, then by revision.
          } else {
            return (
                (this.get('package_name').localeCompare(
                other.get('package_name'))) ||
                (owner ? owner.localeCompare(otherOwner) : 0) ||
                (this.get('revision') - other.get('revision')));
          }
        }
      }, {
        ATTRS: {
          id: {
            writeOnce: true,
            validator: function(val) {
              return Y.Lang.isString(val) && !!charm_id_re.exec(val);
            }
          },
          bzr_branch: {writeOnce: true},
          charm_store_path: {writeOnce: true},
          config: {writeOnce: true},
          description: {writeOnce: true},
          full_name: {writeOnce: true},
          is_subordinate: {writeOnce: true},
          last_change: {
            writeOnce: true,
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
          package_name: {writeOnce: true},
          owner: {writeOnce: true},
          peers: {writeOnce: true},
          proof: {writeOnce: true},
          provides: {writeOnce: true},
          requires: {writeOnce: true},
          revision: {
            writeOnce: true,
            setter: function(val) {
              if (Y.Lang.isValue(val)) {
                val = parseInt(val, 10);
              }
              return val;
            }
          },
          scheme: {
            value: 'cs',
            writeOnce: true,
            setter: function(val) {
              if (!Y.Lang.isValue(val)) {
                val = 'cs';
              }
              return val;
            }
          },
          series: {writeOnce: true},
          summary: {writeOnce: true},
          url: {writeOnce: true}
        }
      });
  models.Charm = Charm;

  var CharmList = Y.Base.create('charmList', Y.ModelList, [], {
    model: Charm
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
