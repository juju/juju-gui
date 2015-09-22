;
/*
Copyright (C) 2015 Canonical Ltd.

XXX jcssackett 2015-09-18: Licensing for juju.js? It's different then the
licensing for the GUI.
*/

'use strict';

var module = module;

/**
 * jujulib provides API access for microservices used by juju.
 *
 * jujulib provies access to the APIs for the Juju Environment
 * Manager (JEM), the juju charmstore, and the juju identity
 * manager (IdM).
 */
(function (exports) {

    /**
     * Environment object for jujulib.
     *
     * Provides access to the JEM API.
     */

    /**
     * Initializer
     *
     * @function environment
     * @param url {String} The URL, including scheme and port, of the JEM instance.
     * @param bakery {Object} A bakery object for communicating with the JEM instance.
     * @returns {Object} A client object for making JEM API calls.
     */
    function environment(url, bakery) {
        this.jemUrl = url + '/v1';
        this.bakery = bakery;
    };

    /**
     * Wrapper for making requests via the bakery.
     *
     * @private _makeRequest
     * @param path {String} The JEM endpoint to make the request from,
     *     e.g. '/env'
     * @param success {function} A callback to be called on success. Takes
     *     an xhr object as its only parameter.
     * @param failure {function} A callback to be called on failure. Takes
     *     an xhr object as its only parameter.
    */
    environment.prototype._makeRequest = function(path, success, failure) {
        this.bakery.sendGetRequest(path, function(xhr) {
            var data = JSON.parse(xhr.target.responseText);
            success(data);
        }, failure);
    };

    /**
     * Lists the available environments on the JEM.
     *
     * @public listEnvironments
     * @param success {function} A callback to be called on success. Should
     *     take an array of objects containing Juju environment data as its
     *     one parameter.
     * @param failure {function} A callback to be called on failure. Should
     *     take an error message as its one parameter.
     */
    environment.prototype.listEnvironments = function(success, failure) {
        this._makeRequest(this.jemUrl + '/env', function(data) {
            success(data.environments);
        }, failure);
    };

    /**
     * Provides the data for a particular environment.
     *
     * @public getEnvironment
     * @param username {String} The username for the given environment.
     * @param envName {String} The name of the given environment.
     * @param success {function} A callback to be called on success. Should
     *     take an object with environment data as its one parameter.
     * @param failure {function} A callback to be called on failure. Should
     *     take an error message as its one parameter.
     */
    environment.prototype.getEnvironment = function (
            username, envName, success, failure) {
        var url = [this.jemUrl, 'env', username, envName].join('/');
        this._makeRequest(url, success, failure);
    };

    /**
     * The jujulib object, returned by this library.
     */
    var jujulib = {
        charmstore: function() {},
        environment: environment,
        identity: function() {}
    };

    exports.jujulib = jujulib;

}((module && module.exports) ? module.exports : this));
