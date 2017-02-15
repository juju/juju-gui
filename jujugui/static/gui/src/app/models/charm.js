/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/**
 * Provide the Charm and CharmList classes.
 *
 * @module models
 * @submodule models.charm
 */

YUI.add('juju-charm-models', function(Y) {

  var models = Y.namespace('juju.models');
  var charmIdRe = /^(?:(\w+):)?(?:~([\w-\.]+)\/)?(?:(\w+)\/)?([\w-\.]+?)(?:-(\d+|HEAD))?$/;  // eslint-disable-line max-len
  var idElements = ['scheme', 'owner', 'series', 'package_name', 'revision'];
  var simpleCharmIdRe = /^(?:(\w+):)?(?!:~)(\w+)$/;
  var simpleIdElements = ['scheme', 'package_name'];

  var parseCharmId = models.parseCharmId = function(charmId, defaultSeries) {
    if (typeof charmId === 'string') {
      var parts = charmIdRe.exec(charmId);
      var pairs;
      if (parts) {
        parts.shift(); // Get rid of the first, full string.
        pairs = Y.Array.zip(idElements, parts);
      } else if (defaultSeries) {
        parts = simpleCharmIdRe.exec(charmId);
        if (parts) {
          parts.shift(); // Get rid of the first, full string.
          pairs = Y.Array.zip(simpleIdElements, parts);
          pairs.push(['series', defaultSeries]);
        }
      }
      if (parts) {
        var result = {},
            storeId = [];
        pairs.forEach(pair => result[pair[0]] = pair[1]);
        if (result.series) {
          storeId.push(result.series);
        }
        storeId.push(
          result.package_name + (result.revision ? '-' + result.revision : ''));
        if (result.owner) {
          storeId.unshift('~' + result.owner);
        }
        result.storeId = storeId.join('/');
        return result;
      }
    }
  };

  /**
   * Helper to use a setter so that we can set null when the api returns an
   * empty object.
   *
   * @method unsetIfNoValue
   * @param {Object} val the Object to check if it's empty.
   *
   */
  var unsetIfNoValue = function(val) {
    if (!val || Object.keys(val).length === 0) {
      return null;
    } else {
      return val;
    }
  };


  models.charmIdRe = charmIdRe;

  /**
   * Model to represent the Charms from the Charmworld API.
   *
   * Charms, once instantiated and loaded with data from their respective
   * sources, are immutable and read-only. This reflects the reality of how
   * we interact with them.
   *
   * Charm instances can represent both environment charms and charm store
   * charms.  A charm id is reliably and uniquely associated with a given
   * charm only within a given context: the environment or the charm store.
   *
   * Charms begin their lives with full charm ids, as provided by
   * services in the environment and the charm store:
   *
   *   `[SCHEME]:(~[OWNER]/)?[SERIES]/[PACKAGE NAME]-[REVISION]`
   *
   * With an id, we can instantiate a charm: typically we use
   * `db.charms.add({id: [ID]})`.  Finally, we load the charm's data over the
   * network using the standard YUI Model method `load`, providing an object
   * with a get_charm callable, and an optional callback (see YUI docs). The env
   * has a `get_charm` method, so, by design, it works easily:
   * `charm.load(env, optionalCallback)` The `get_charm` method must either
   * callback using the default YUI approach for this code, a boolean indicating
   * failure, and a result; or it must return what the env version does: an
   * object with a `result` object containing the charm data, or an object with
   * an `err` attribute.
   *
   * A charm's `loaded` attribute is set to true once it has all the data from
   * its environment.
   *
   * @class Charm
   * @extends {Y.Model}
   *
   */
  models.Charm = Y.Base.create('browser-charm', Y.Model, [
    models.EntityExtension
  ], {
    /**
     * Parse the relations ATTR from the api into specific provides/requires
     * information.
     *
     * @method _parseRelations
     * @param {String} attr the attribute to load from the relations object.
     *
     */
    _parseRelations: function(attr) {
      var relations = this.get('relations');
      if (relations && relations[attr]) {
        return relations[attr];
      } else {
        return null;
      }
    },

    /**
     * Initializer
     *
     * @method initializer
     * @param {Object} cfg The configuration object.
     */
    initializer: function(cfg) {
      if (cfg) {
        if (cfg.downloads_in_past_30_days) {
          this.set('recent_download_count', cfg.downloads_in_past_30_days);
        }
        if (cfg.id) {
          this.set('storeId', cfg.id);
        }
        if (cfg.url) {
          this.set('id', cfg.url);
        }
      }
      var id = this.get('id'),
          parts = parseCharmId(id);
      if (!parts) {
        throw 'Developers must initialize charms with a well-formed id.';
      }
      this.loaded = false;
      this.on('load', function() { this.loaded = true; });
      Object.keys(parts).forEach(key => {
        var value = parts[key];
        if (value) {
          // With multi-series charms it is possible that the parsed values
          // from the ID are undefined, especially the series which has
          // already been set as an array. It would in that case overwrite
          // the series list with undefined.
          this.set(key, value);
        }
      });
    },

    sync: function(action, options, callback) {
      if (action !== 'read') {
        throw (
            'Only use the "read" action; "' + action + '" not supported.');
      }
      if (Y.Lang.isValue(options.get_charm)) {
        // This is an env.
        options.get_charm(this.get('id'), function(response) {
          if (response.err) {
            callback(true, response);
          } else if (response.result) {
            callback(false, response.result);
          } else {
            // What's going on?  This does not look like either of our
            // expected signatures.  Declare a loading error.
            callback(true, response);
          }
        });
      } else {
        throw 'You must supply a get_charm function.';
      }
    },

    parse: function(response) {
      var data = models.Charm.superclass.parse.apply(this, arguments),
          self = this;

      //Data can come from two places; a Charm being deployed into the
      //environment, or a charm already in the environment. They have slightly
      //different attributes.
      if (data.config) {
        // If data has a 'config' attribute, we're dealing with data from the
        // environment.
        data.options = data.config.options;
        data.relations = {
          requires: data.requires,
          provides: data.provides
        };
        data.is_subordinate = data.subordinate;
        delete data.config;
        delete data.subordinate;
        delete data.requires;
        delete data.provides;
      }
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (!Y.Lang.isValue(value) ||
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
    },

    /**
      Removes all of the duplicate versions of the same charm from the related
      charms lists keeping the highest revision.

      @method _dedupeRelatedCharms
      @param {Object} charmList The interface delimited list from the provides
        or requires objects.
      @return {Object} The interface delimited list without duplicates.
    */
    _dedupeRelatedCharms: function(charmList) {
      // Loop through all of the interfaces.
      var names = Object.keys(charmList);
      var collection = {};
      names.forEach(function(name) {
        // Loop through all of the charms.
        var indexes = Object.keys(charmList[name]);
        var charms = this._splitIntoCharmCollections(indexes, name, charmList);
        charms = this._keepLatestRevision(charms);
        collection[name] = charms;
      }, this);
      return collection;
    },

    /**
      Splits charm list into a key value delimited list of charms.

      @method _splitIntoCharmCollections
      @param {Array} indexes The list of id's for the charm list. It's an
        integer list.
      @param {String} name The interface name that the charms are sorted under.
      @param {Object} charmList The full requires or provides interfact ordered
        charmlist.
      @return {Object} The top three charm id collections from the supplied
        collection.
    */
    _splitIntoCharmCollections: function(indexes, name, charmList) {
      var charms = {};
      indexes.forEach(function(index) {
        var id = charmList[name][index].id;
        var charm = id.replace('cs:', '').split('-').slice(0, -1).join('-');
        if (charms[charm]) {
          charms[charm].push(id);
        } else {
          charms[charm] = [id];
        }
      });
      return this._keepTopThreeCharms(charms);
    },

    /**
      Keeps only the top three charm collections in the object, discarding the
      others.

      @method _keepTopTheeCharms
      @param {Object} charms The charm collections from
        _splitIntoCharmCollections.
      @return {Object} An object in the same format that was passed in but with
        a maximum of three charms.
    */
    _keepTopThreeCharms: function(charms) {
      var keys = Object.keys(charms);
      var length = keys.length;
      if (length > 3) {
        for (var i = 3; i < keys.length; i += 1) {
          delete charms[keys[i]];
        }
      }
      return charms;
    },

    /**
      We only want to keep the latest revision in the list so this sorts out
      anything but.

      @method _keepLatestRevision
      @param {Object} charms The object charm collection.
      @return {Array} An array of only the latest revisions from the collection.
    */
    _keepLatestRevision: function(charms) {
      var keys = Object.keys(charms);
      var ids = {};
      keys.forEach(function(key) {
        var keepId = '';
        var keepRevno;
        // Loop through each Id
        charms[key].forEach(function(id) {
          var revno = parseInt(id.split('-').pop(), 10);
          if (keepRevno === undefined || revno > keepRevno) {
            keepId = id;
            keepRevno = revno;
          }
        });
        ids[key] = keepId;
      });
      return ids;
    },

    /**
      Returns whether or not the charm has metrics. If the charm metadata does
      not have the metrics value listed then check to see if a metrics file
      is in the asset list.

      @method hasMetrics
      @return {Boolean} Whether the charm has metrics or not.
    */
    hasMetrics: function() {
      return !!this.get('metrics');
    }

  }, {
    /**
      Static to indicate the type of entity so that other code
      does not need to 'guess' by the entities content

      @property entityType
      @type {String}
      @default 'charm'
      @static
    */
    entityType: 'charm',
    ATTRS: {
      id: {
        validator: function(val) {
          return typeof val === 'string' && !!charmIdRe.exec(val);
        }
      },
      /**
       * "id" for use with the charmworld datastore
       *
       * @attribute storeId
       * @default Undefined
       * @type {String}
       */
      storeId: {
        validator: function(val) {
          return typeof val === 'string' && !!charmIdRe.exec(val);
        }
      },
      bzr_branch: {},
      categories: {
        value: []
      },
      changelog: {
        value: {}
      },
      //XXX jcsackett Aug 7 2013 This attribute is only needed until we turn
      // on the service inspector. It's just used by the charm view you get when
      // inspecting a service, and should be ripped out (along with tests) when
      // we remove that view.
      charm_path: {
        /**
         * Generate the charm store path from the attributes of the charm.
         *
         * @method getter
         *
         */
        getter: function() {
          var owner = this.get('owner');
          var revision = this.get('revision');
          revision = Y.Lang.isValue(revision) ? '-' + revision : '';
          return [
            (owner ? '~' + owner : 'charms'),
            this.get('series'),
            (this.get('package_name') + revision),
            'json'
          ].filter(function(val) { return val; }).join('/');
        }
      },
      /**
       * Object of data about the source for this charm including bugs link,
       * log, revisions, etc.
       *
       * @attribute code_source
       * @default undefined
       * @type {Object}
       *
       */
      code_source: {},
      commitCount: {
        /**
         * @method commitCount.valueFn
         * @return {Integer} the revno of the branch.
         *
         */
        valueFn: function() {
          var revisions = this.get('revisions');
          if (revisions) {
            return Object.keys(revisions).length;
          }
        }
      },
      date_created: {},
      description: {},
      'providers': {
        /**
         * @method providers.valueFn
         * @return {Array} the list of failing provider names.
         *
         */
        valueFn: function() {
          var failures = [],
              successes = [],
              providers = this.get('tested_providers') || {};
          Object.keys(providers).forEach(key => {
            if (providers[key] !== 'SUCCESS') {
              failures.push(key);
            }
            else {
              successes.push(key);
            }
          });

          if (failures.length > 0 || successes.length > 0) {
            return {successes: successes, failures: failures};
          } else {
            return null;
          }
        }
      },
      /**
        @attribute downloads
        @default 0
        @type {Integer}

       */
      downloads: {
        value: 0
      },

      files: {
        value: [],
        /**
         * Sort files when they are set.
         *
         * @method files.setter
         */
        setter: function(value) {
          if (Array.isArray(value)) {
            // This sort has several properties that are different than a
            // standard lexicographic sort.
            // * Filenames in the root are grouped together, rather than
            //   sorted along with the names of directories.
            // * Sort ignores case, unless case is the only way to
            //   distinguish between values, in which case it is honored
            //   per-directory. For example, this is sorted: "a", "b/c",
            //   "b/d", "B/b", "B/c", "e/f".  Notice that "b" directory values
            //   and "B" directory values are grouped together, where they
            //   would not necessarily be in a simpler case-insensitive
            //   lexicographic sort.
            // If you rip this out for something different and simpler, that's
            // fine; just don't tell me about it. :-)  This seemed like a good
            // approach at the time.
            value.sort(function(a, b) {
              var segments = [a, b].map(function(path) {
                var segs = path.split('/');
                if (segs.length === 1) {
                  segs.unshift('');
                }
                return segs;
              });
              var maxLength = Math.max(segments[0].length, segments[1].length);
              for (var i = 0; i < maxLength; i += 1) {
                var segmentA = segments[0][i];
                var segmentB = segments[1][i];
                if (segmentA === undefined) {
                  return -1;
                } else if (segmentB === undefined) {
                  return 1;
                } else {
                  var result = (
                      // Prefer case-insensitive sort, but honor case when
                      // string match in a case-insensitive comparison.
                      segmentA.localeCompare(
                          segmentB, undefined, {sensitivity: 'accent'}) ||
                      segmentA.localeCompare(segmentB));
                  if (result) {
                    return result;
                  }
                }
              }
              return 0;
            });
          }
        }
      },
      full_name: {
        /**
         * Generate the full name of the charm from its attributes.
         *
         * @method full_name.getter
         *
         */
        getter: function() {
          const series = this.get('series');
          const parts = [];
          const owner = this.get('owner');
          if (owner) {
            parts.push(`~${owner}`);
          }
          if (!Array.isArray(series)) {
            // We do not want to have the series list in the url if it is a
            // multi-series charm.
            parts.push(series);
          }
          parts.push(this.get('package_name'));
          return parts.join('/');
        }
      },
      shouldShowIcon: {
        /**
          Should this charm display its icon. Helper used for template
          rendering decisions.

          @method shouldShowIcon.valueFn
          @return {Boolean} Does the charm have an icon that should be shown?

         */
        valueFn: function() {
          var files = this.get('files') || [];
          if (!Array.isArray(files)) {
            // On some codepaths files is the list of objects and on
            // others its a mapping of filename to content.
            // XXX: Normalize handling here (without resolving root issue).
            files = Object.keys(files);
          }
          if (files.indexOf('icon.svg') !== -1 &&
              this.get('is_approved')) {
            return true;
          } else {
            return false;
          }
        }
      },
      is_approved: {},
      is_subordinate: {},
      maintainer: {},
      /*
        API related metadata information for this charm object.

        This includes information such as related charms calculated by the
        back end, but are not directly part of the charms representation.

      */
      metadata: {},
      name: {},
      /**
       * options is the parsed YAML object from config.yaml in a charm. Do not
       * set a value if there are no options to be had.
       *
       * @attribute options
       * @default undefined
       * @type {Object}
       *
       */
      options: {
        setter: unsetIfNoValue
      },
      owner: {},
      peers: {},
      proof: {},
      /**
       * This attr is a mapper to the relations ATTR in the new API. It's
       * provided for backwards compatibility with the original Charm model.
       *
       * This can be removed when juju.charmworld is the one true provider of
       * models used in all Juju Gui code.
       *
       * @attribute provides
       * @default undefined
       * @type {Object}
       *
       */
      provides: {
        /**
         * provides is a subcomponent of relations in the new api.
         *
         * @method provides.getter
         *
         */
        getter: function(value, key) {
          return this._parseRelations(key);
        }
      },
      rating_numerator: {},
      rating_denominator: {},
      /**
       * Mapped from the downloads_in_past_30_days in the API.
       *
       * @attribute recent_download_count
       * @default 0
       * @type {Int} number of downloads in 'recent' time.
       *
       */
      recent_download_count: {
        value: 0
      },

      /**
        The relations object is two parts for use in our situations.
        The keys are
        - provides: a nested object of the related charms for each provide
                    interface
        - requires: a nested object of the related charms for each require
                    interface
        @attribute relations
        @default undefined
        @type {Object}
       */
      relations: {},

      /**
       * This attr is a mapper to the relations ATTR in the new API. It's
       * provided for backwards compatibility with the original Charm model.
       *
       * This can be removed when juju.charmworld is the one true provider of
       * models used in all Juju Gui code.
       *
       * @attribute requires
       * @default undefined
       * @type {Object}
       *
       */
      requires: {
        /**
         * requires is a subcomponent of relations in the new api.
         *
         * @method requires.getter
         *
         */
        getter: function(value, key) {
          return this._parseRelations(key);
        }
      },
      revision: {
        /**
         * Parse the revision number out of a string.
         *
         * @method revision.setter
         */
        setter: function(val) {
          if (val) {
            return parseInt(val, 10);
          }
        }
      },
      scheme: {
        value: 'cs',
        /**
         * If no value is given, "cs" is used as the default.
         *
         * @method scheme.setter
         */
        setter: function(val) {
          if (!Y.Lang.isValue(val)) {
            val = 'cs';
          }
          return val;
        }
      },
      series: {},

      summary: {},
      tested_providers: {},
      url: {},
      iconPath: {
        /**
         * Provides the URL path to the icon image.
         *
         * @method iconUrl.getter
         *
         */
        getter: function() {
          var owner = this.get('owner');
          var revision = this.get('revision');
          revision = Y.Lang.isValue(revision) ? '-' + revision : '';
          return [
            (owner ? '~' + owner : ''),
            this.get('series'),
            (this.get('package_name') + revision),
            'icon.svg'
          ].join('/');
        }
      },
      /**
        The plans for the charm.

        @attribute plans
        @type {Array}
        @default undefined
      */
      plans: {},
      /**
        The metrics for the charm.
        @attribute metrics
        @type {Object}
        @default undefined
      */
      metrics: {}
    }
  });


  /**
   * CharmList is set of Charms.
   *
   * @class CharmList
   */
  models.CharmList = Y.Base.create('browserCharmList', Y.ModelList, [], {
    model: models.Charm,
    /**
      Search charms for ids in various formats. This defaults to doing a
      getById but when no match is found this will parse the charmId argument
      and attempt to match without scheme and with the default series of the
      environment (if provided.)

      @method find
      @param {String} charmId to find.
      @param {String} defaultSeries optional series to search.
      @return {Object} charm.
    */
    find: function(charmId, defaultSeries) {
      var result = this.getById(charmId);
      var partial = charmId;
      if (result) { return result; }

      if (/^(cs:|local:)/.exec(partial) !== null) {
        partial = partial.slice(partial.indexOf(':') + 1);
      }
      if (charmId.indexOf('/') === -1 && defaultSeries) {
        partial = defaultSeries + '/' + partial;
      }
      if (/\-\d+$/.exec(partial)) {
        partial = partial.slice(0, partial.indexOf('-'));
      }
      result = this.filter(function(charm) {
        return charm.get('full_name') === partial;
      });
      if (result.length === 1) {
        return result[0];
      }
      return null;
    },

    /**
      Add a charm to this model list building the model instance from the
      provided charm data.

      @method addFromCharmData
      @param {Object} metadata The charm's metadata as a YAML decoded object.
      @param {String} series The Ubuntu series for this charm.
      @param {Int} revision The charm revision number.
      @param {String} scheme The charm scheme (e.g. "cs" or "local").
      @param {Object} options Optional YAML decoded charm's config options.
      @return {Object} The resulting charm model instance.
    */
    addFromCharmData: function(metadata, series, revision, scheme, options) {
      // The id is the store identifier for the charm.
      var id = series + '/' + metadata.name + '-' + revision;
      // The URL is used as primary id for charms in the model list.
      var url = scheme + ':' + id;
      var data = {
        categories: metadata.categories,
        description: metadata.description,
        distro_series: series,
        is_subordinate: metadata.subordinate,
        name: metadata.name,
        options: options,
        relations: {
          provides: metadata.provides,
          requires: metadata.requires,
          peers: metadata.peers
        },
        revision: revision,
        summary: metadata.summary
      };
      var charm = this.getById(url);
      if (charm) {
        // The charm already exists, update the model instance.
        charm.setAttrs(data);
        return charm;
      }
      // Create and return the model instance.
      data.id = id;
      data.url = url;
      return this.add(data);
    }

  }, {
    ATTRS: {}
  });

  /**
    Validate the given charm metadata.
    Ensure the metadata at least includes the charm name, summary and
    description.

    @method validateCharmMetadata
    @param {Object} metadata The charm's metadata as a YAML decoded object.
    @return {Array} A list of errors in the metadata. An empty list if the
      metadata is valid.
  */
  models.validateCharmMetadata = function(metadata) {
    var errors = [];
    // According to https://jujucharms.com/docs/authors-charm-metadata,
    // name, summary and description are the only required fields.
    ['name', 'summary', 'description'].forEach(function(name) {
      var value = metadata[name] || '';
      var stringValue = value + '';
      if (!stringValue.trim()) {
        errors.push('missing ' + name);
      }
    });
    return errors;
  };

}, '0.1.0', {
  requires: [
    'model',
    'model-list',
    'entity-extension'
  ]
});
