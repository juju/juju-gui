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

  var models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  /**
   * Model to represent the Bundles from the Charmworld API.
   *
   * @class Bundle
   * @extends {Y.Model}
   *
   */
  models.Bundle = Y.Base.create('browser-bundle', Y.Model, [
    models.EntityExtension
  ], {

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
      // Because of a bug in Y.Attribute https://github.com/yui/yui3/issues/1859
      // Attribute setters are not called when values are passed in in the
      // constructors. This checks if a value is being passed in via the
      // constructor and calls the setter manually.
      var id = cfg && cfg.id;
      if (id) {
        this.idSetter(id);
      }
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
      if (!parts) {
        parts = [null, author, 'n/a'];
      }
      return [parts[1], parts[2]];
    },

    /**
      Populate data about bundled applications; provides display data for each
      service.
      @method parseBundleServices
      @param {Object} applications more of a hash or dict than an object;
        contains service names as keys to their service objects.
      @return {Object} a service display object.
    */
    parseBundleServices: function(applications) {
      var parsedServices = [];
      for (var name in applications) {
        var service = applications[name],
            id = service.charm.replace(/^cs:/, '');
        parsedServices.push({
          id: id,
          iconPath: utils.getIconPath(id, false),
          url: '',  // XXX implement once determined how to handle links
          displayName: name.replace('-', ' ')
        });
      }
      return parsedServices;
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
    },

    /**
      Called when the id value is set. It parses the id and sets the `stateId`
      value to match what the value will be for the id's passed in from the
      state metadata.

      @method idSetter
      @param {String} id The bundles id
      @return {String} The id that was passed in.
    */
    idSetter: function(id) {
      if (id === undefined) { return id; }
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
    },
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
          // This is called like this because of a bug in YUI see initializer.
          this.idSetter(id);
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
        getter: function(val) {
          var promulgated = this.get('promulgated');
          // Set the value from the promulgated flag otherwise use the provided
          // value. The promulgated flag may not be used anymore, but it has
          // been left here for backwards compatibility.
          return promulgated === undefined ? val : promulgated;
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
          return !isNaN(val);
        }
      },
      /**
        The url which can be used by the deployer to deploy the bundle file.

        @attribute deployerFileUrl
        @default undefined
        @type {String}
      */
      deployerFileUrl: {},

      /**
        A collection of files in the bundle.

        @attribute files
        @default undefined
        @type {Array}
      */
      files: {},

      /**
        @attribute downloads
        @default 0
        @type {Integer}

       */
      downloads: {
        value: 0
      },

      relations: {
        /**
          The relations are parsed as a map containing the relations. This
          converts it to an array to make it easier to work with and to match
          the old apiv3 functionality.

          @method setter
        */
        setter: function(value) {
          var relations = [];
          Object.keys(value).forEach(function(key) {
            relations.push(value[key]);
          });
          return relations;
        }
      },
      series: {},
      /**
        The applications used in this bundle.

        @attribute applications
        @default undefined
        @type {Object}
      */
      applications: {},

      /**
       * @attribute serviceCount
       * @default 0
       * @type {Number}
       *
       */
      serviceCount: {
        'getter': function() {
          if (this.get('applications')) {
            return Object.keys(this.get('applications')).length;
          }
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
          const applications = this.get('applications');
          Object.keys(applications).forEach(key => {
            const service = applications[key];
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
       * Determine the number of machines the bundle will use.
       *
       * @attribute machineCount
       * @default 0
       * @type {Number}
       *
       */
      machineCount: {
        value: 0
      }
    }
  });


}, '0.0.1', {
  requires: [
    'juju-view-utils',
    'model',
    'model-list',
    'entity-extension'
  ]
});
