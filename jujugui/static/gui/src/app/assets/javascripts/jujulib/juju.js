;
/*
Copyright (C) 2015 Canonical Ltd.

XXX jcssackett 2015-09-18: Licensing for juju.js? It's different then the
licensing for the GUI.
*/

var module = module;

/**
 * jujulib provides API access for microservices used by juju.
 *
 * jujulib provies access to the APIs for the Juju Environment
 * Manager (JEM), the juju charmstore, and the juju identity
 * manager (IdM).
 */
(function (exports) {
  'use strict';

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
   * @param method {String} The type of http method to use, e.g. GET or POST.
   * @param params {Object} Optional data object to sent with e.g. POST commands.
   * @param success {function} A callback to be called on success. Takes
   *     an xhr object as its only parameter.
   * @param failure {function} A callback to be called on failure. Takes
   *     an xhr object as its only parameter.
  */
  environment.prototype._makeRequest = function(path, method, params, success, failure) {
    if (method === 'GET') {
      this.bakery.sendGetRequest(path, function(xhr) {
        var data = JSON.parse(xhr.target.responseText);
        success(data);
      }, failure);
    } else if (method === 'POST') {
      this.bakery.sendPostRequest(path, JSON.stringify(params), function(xhr) {
        var data = JSON.parse(xhr.target.responseText);
        success(data);
      }, failure);
    }
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
    this._makeRequest(this.jemUrl + '/env', 'GET', null, function(data) {
      success(data.environments);
    }, failure);
  };

  /**
   * Lists the available state servers on the JEM.
   *
   * @public listServers
   * @param success {function} A callback to be called on success. Should
   *     take an array of objects containing Juju environment data as its
   *     one parameter.
   * @param failure {function} A callback to be called on failure. Should
   *     take an error message as its one parameter.
   */
  environment.prototype.listServers = function(success, failure) {
    this._makeRequest(this.jemUrl + '/server', 'GET', null, function(data) {
      success(data['state-servers']);
    }, failure);
  };
  /**
   * Provides the data for a particular environment.
   *
   * @public getEnvironment
   * @param envOwnerName {String} The user name of the given environment's owner.
   * @param envName {String} The name of the given environment.
   * @param success {function} A callback to be called on success. Should
   *     take an object with environment data as its one parameter.
   * @param failure {function} A callback to be called on failure. Should
   *     take an error message as its one parameter.
   */
  environment.prototype.getEnvironment = function (envOwnerName, envName, success, failure) {
    var url = [this.jemUrl, 'env', envOwnerName, envName].join('/');
    this._makeRequest(url, 'GET', null, success, failure);
  };

  /**
   * Create a new environment.
   *
   * @public newEnvironment
   * @param envOwnerName {String} The name of the given environment's owner.
   * @param envName {String} The name of the given environment.
   * @param baseTemplate {String} The name of the config template to be used
   *     for creating the environment.
   * @param stateServer {String} The entityPath name of the state server to
   *     create the environment with.
   * @param password {String} The password for the new environment.
   * @param success {function} An optional callback to be called on success.
   *     Should receive a 200 OK response as its only object.
   * @param failure {function} A callback to be called on failure. Should
   *     take an error message as its one parameter.
   */
  environment.prototype.newEnvironment = function (
      envOwnerName, envName, baseTemplate, stateServer, password,
      success, failure) {
    var body = {
      name: envName,
      password: password,
      templates: [baseTemplate],
      'state-server': stateServer
    };
    var url = [this.jemUrl, 'env', envOwnerName].join('/');
    this._makeRequest(url, 'POST', body, success, failure);
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
