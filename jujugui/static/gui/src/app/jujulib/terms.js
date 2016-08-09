/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  var jujulib = exports.jujulib;

  /**
    Romulus terms service client.

    Provides access to the Romulus terms API.
  */

  var termsAPIVersion = 'v1';

  /**
    Initializer.

    @function terms
    @param url {String} The URL of the Romulus terms instance, including
      scheme and port, and excluding the API version.
    @param bakery {Object} A bakery object for communicating with the terms
      instance.
    @returns {Object} A client object for making Romulus terms API calls.
  */
  function terms(url, bakery) {
    // Store the API URL (including version) handling missing trailing slash.
    this.url = url.replace(/\/?$/, '/') + termsAPIVersion;
    this.bakery = bakery;
  };

  terms.prototype = {
    /**
      Show details on a terms of service entity.

      @public showTerms
      @param name {String} The terms name.
      @param revision {String or Int} The optional terms revision. If not
        provided, details on the most recent revision are returned.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the terms data as its second. The terms data
        includes the following fields:
          - name: the terms name, like "canonical";
          - title: an optional more human friendly title, or an empty string;
            if the title is not present clients could fall back to the name;
          - revision: the terms revision, as a positive number;
          - content: a text describing the terms;
          - createdAt: a date object with the terms creation time.
        If the terms is not found, the second argument is null.
    */
    showTerms: function(name, revision, callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        if (!response.length) {
          callback(null, null);
          return;
        }
        var terms = response[0];
        var milliseconds = Date.parse(terms['created-on']);
        callback(null, {
          name: terms.name,
          title: terms.title,
          revision: terms.revision,
          content: terms.content,
          createdAt: new Date(milliseconds)
        });
      };
      var url = this.url + '/terms/' + name;
      if (revision === 0 || revision) {
        url += '?revision=' + revision;
      }
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Parse and format a term response into a friendly format.

      @private _formatTerm
      @param term {Object} A term response.
    */
    _formatTerm: function(term) {
      var milliseconds = Date.parse(term['created-on']);
      return {
        user: term.user,
        term: term.term,
        revision: term.revision,
        createdAt: new Date(milliseconds)
      };
    },

    /**
      Creates a record of the authenticated user's agreement to a revision of
      a Terms and Conditions document.

      @public addAgreement
      @param terms {Array} A list of terms to agree to. Each term should be an
        object with the following parameters:
        - name {String} The terms name.
        - revision {Int} The terms revision.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    addAgreement: function(terms, callback) {
      var self = this;
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        var terms = response.agreements.map(function(term) {
          return self._formatTerm(term);
        });
        callback(null, terms);
      };
      var url = this.url + '/agreement';
      var payload = terms.map(function(term) {
        return {
          termname: term.name,
          termrevision: term.revision
        };
      });
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, handler);
    },

    /**
      Retrieves all the agreements for the authenticated user.

      @public getAgreements
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the agreements data as its second. The agreements
        data includes the following fields:
          - user: the user's username.
          - term: the name of the term
          - revision: the terms revision, as a positive number;
          - createdAt: a date object with the terms creation time.
        If the agreements are not found, the second argument is null.
    */
    getAgreements: function(callback) {
      var self = this;
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        if (!response.length) {
          callback(null, null);
          return;
        }
        var terms = response.map(function(term) {
          return self._formatTerm(term);
        });
        callback(null, terms);
      };
      var url = this.url + '/agreements';
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    }

  };

  // Populate the library with the API client and supported version.
  jujulib.terms = terms;
  jujulib.termsAPIVersion = termsAPIVersion;

}((module && module.exports) ? module.exports : this));
