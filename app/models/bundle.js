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
      id: {},
      name: {},
      description: {},
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
