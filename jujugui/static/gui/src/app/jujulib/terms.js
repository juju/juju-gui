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
          owner: terms.owner,
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
        content: term.content,
        createdAt: new Date(milliseconds),
        name: term.name,
        owner: term.owner,
        revision: term.revision,
        term: term.term,
        user: term.user
      };
    },

    /**
      Creates a record of the authenticated user's agreement to a revision of
      a Terms and Conditions document.

      @public addAgreement
      @param terms {Array} A list of terms to agree to. Each term should be an
        object with the following parameters:
        - name {String} The terms name.
        - owner {String} The terms owner.
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
        const args = {
          termname: term.name,
          termrevision: term.revision
        };
        if (term.owner) {
          args.termowner = term.owner;
        }
        return args;
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
    },

    /**
      Calls to check if the supplied terms have been agreed to. If they have
      it returns null, else it'll return the terms which need to be
      agreed to.
      @param termList {Array} A list of agreement names that you'd like to
        check if the user has
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the agreements data as its second. The agreements
        data includes the following fields:
        - content: the content of the term.
        - createdAt: a date object with the terms creation time.
        - name: the name of the term
        - owner: the owner of the term.
        - revision: the terms revision, as a positive number;
        If no terms are left to agree to then the second argument is null.
    */
    getAgreementsByTerms: function(termList, callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        if (!response.length) {
          callback(null, null);
          return;
        }
        const terms = response.map(term => this._formatTerm(term));
        callback(null, terms);
      };
      const terms = termList.reduce(
        (acc, val, idx) => `${acc}${idx === 0 ? '' : '&'}Terms=${val}`, '');
      return jujulib._makeRequest(
        this.bakery, `${this.url}/agreement?${terms}`, 'GET', null, handler);
    }

  };

  // Populate the library with the API client and supported version.
  jujulib.terms = terms;
  jujulib.termsAPIVersion = termsAPIVersion;

}((module && module.exports) ? module.exports : this));
