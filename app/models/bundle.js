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

/*
 This model replicates the data received from Charmworld.  A representative
 URL for that data is:
 http://staging.jujucharms.com/api/3/bundle/~bac/wiki/wiki
 */

'use strict';

/**
 * Provide the Bundle and BundleList classes.
 *
 * @module models
 * @submodule models.bundle
 */

YUI.add('juju-bundle-models', function(Y) {

  var models = Y.namespace('juju.models');

  /**
   * Model to represent the Bundles from the Charmworld API.
   *
   * @class Bundle
   * @extends {Y.Model}
   *
   */
  models.Bundle = Y.Base.create('browser-bundle', Y.Model, [], {

    /**
     * Initializer
     *
     * @method initializer
     * @param {Object} cfg The configuration object.
     */
    initializer: function(cfg) {
      // Map this to a name that we can change as the timeframes change
      // without having to update all users of the code.
      if (cfg && cfg.downloads_in_past_30_days) {
        this.set('recent_download_count', cfg.downloads_in_past_30_days);
      }

      this.loaded = false;
      this.on('load', function() { this.loaded = true; });
    },

    /**

     Parse a combined name-email string of the form
     "Full Name <email.example.com>".

     Any string that is not parseable has the whole string used as the name
     and the email set to 'n/a'.

     @method parseNameEmail
     @param {String} Name + email string.
     @return {Array} [name, emailAddress]
    */
    parseNameEmail: function(author) {
      var parts = /^([^<]+?) <(.+)>$/.exec(author);
      if (Y.Lang.isNull(parts)) {
        parts = [null, author, 'n/a'];
      }
      return [parts[1], parts[2]];
    },
    /**

     Extract the recent commits into a format we can use nicely.  Output matches
     the analogous function for charms.

     @method extractRecentCommits
     @param {Array} List of change objects.
     @return {Array} Commit objects.
    */
    extractRecentCommits: function(changes) {
      var commits = [];

      if (changes) {
        changes.forEach(function(change) {

          var author_parts = this.parseNameEmail(change.authors[0]);
          var date = new Date(change.created * 1000);
          commits.push({
            author: {
              name: author_parts[0],
              email: author_parts[1]
            },
            date: date,
            message: change.message,
            revno: change.revno
          });
        }, this);
      }
      return commits;
    }
  }, {
    /**
      Static to indicate the type of entity so that other code
      does not need to 'guess' by the entities content

      @property entityType
      @type {String}
      @default 'bundle'
      @static
    */
    entityType: 'bundle',
    ATTRS: {
      id: {
        'setter': function(id) {
          var charmersIndex = id.indexOf('~charmers');
          var stateId = '';
          if (charmersIndex !== -1) {
            // Remove the ~charmers/ from the url
            stateId = id.substring(charmersIndex + 10);
          } else {
            stateId = id;
          }
          stateId = 'bundle/' + stateId;
          this.set('stateId', stateId);
          // We want to set this attribute to it's actual ID;
          return id;
        }
      },
      /**
        This id is set from the setter of the real id. It is supposed to match
        the id which is passed in from the state object.

        @attribute stateId
        @type {String}
        @default undefined
      */
      stateId: {},
      name: {},
      description: {},
      /**
        For charms the api returns is_approved and we want to share that
        across our templates. This maps to the promulgated api data from the
        bundle results.

        @attribute is_approved
        @default false
        @type {Boolean}
       */
      is_approved: {
        /**
          Reach into the promulgated attr

          @method getter
         */
        getter: function() {
          return this.get('promulgated');
        }
      },
      owner: {},
      permanent_url: {},
      promulgated: false,
      title: {},
      basket_name: {},
      basket_revision: {
        /**
         Validate the basket_revision.  Must be number.

         @method validator

         */
        validator: function(val) {
          return Y.Lang.isNumber(val);
        }
      },
      data: {},
      deployer_file_url: {},

      /**
        @attribute downloads
        @default 0
        @type {Integer}

       */
      downloads: {
        value: 0
      },

      /**
        @attribute recent_download_count
        @default 0
        @type {Integer}

       */
      recent_download_count: {
        value: 0
      },

      bundleURL: {
        /**
          Return the bundle URL.
          Use the simplified form if the bundle is promulgated.

          @method getter
        */
        getter: function() {
          if (this.get('promulgated')) {
            var basket = this.get('basket_name');
            var revision = this.get('basket_revision');
            var name = this.get('name');
            return 'bundle:' + basket + '/' + revision + '/' + name;
          }
          return this.get('permanent_url');
        }
      },
      relations: {
        /**
         Return the relations data as a list of objects.

         @method getter

         */
        getter: function() {
          var data = this.get('data');
          var rels = [];
          Y.Array.each(data.relations, function(thing) {
            var map = {};
            map[thing[0]] = thing[1];
            rels.push(map);
          });
          return rels;
        }
      },
      series: {
        /**
         Return the series data directly.

         @method getter

         */
        getter: function() {
          var data = this.get('data');
          return data.series;
        }
      },
      services: {
        /**
         Return the services data as a nested object
         of the form { 'servicename': {config} }.

         @method getter

         */
        getter: function() {
          return this.get('data').services;
        }
      },

      /**
       * @attribute service_count
       * @default 0
       * @type {Number}
       *
       */
      serviceCount: {
        'getter': function() {
          return Y.Object.keys(this.get('services')).length;
        }
      },

      /**
       * Determine the number of units the bundle will use.
       *
       * Each service includes one unit by default. If a num_units is defined
       * in the service then that is added instead of the single default.
       *
       * @attribute unitCount
       * @default 0
       * @type {Number}
       *
       */
      unitCount: {
        'getter': function() {
          var count = 0;
          Y.Object.each(this.get('services'), function(service) {
            if (service.num_units) {
              count += service.num_units;
            } else {
              count += 1;
            }
          });
          return count;
        }
      },
      /**
       * @attribute recentCommits
       * @default undefined
       * @type {Array} list of objects for each commit.
       *
       */
      recentCommits: {
        /**
         * Return the commits of the charm in a format we can live with from
         * the source code data provided by the API.
         *
         * @method recentCommits.valueFn
         *
         */
        valueFn: function() {
          var changes = this.get('changes');
          return this.extractRecentCommits(changes);
        }
      }
    }
  });


}, '0.0.1', {
  requires: [
    'model',
    'model-list'
  ]
});
