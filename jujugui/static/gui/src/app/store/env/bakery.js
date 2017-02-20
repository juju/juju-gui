/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2015 Canonical Ltd.

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
 * Bakery holds the context for making HTTP requests
 * that automatically acquire and discharge macaroons.
 *
 * @module env
 * @submodule env.bakery
 */

YUI.add('juju-env-bakery', function(Y) {

  var module = Y.namespace('juju.environments.web');
  var macaroon = Y.namespace('macaroon');

  // Define the discharge token header.
  const DISCHARGE_TOKEN = 'discharge-token';
  // Define the bakery protocol version used by the GUI.
  const PROTOCOL_VERSION = 1;
  // Define the HTTP content type for JSON requests.
  const JSON_CONTENT_TYPE = 'application/json';

  /**
   * Bakery client inspired by the equivalent GO code.
   *
   * This object exposes the ability to perform requests
   * that automatically acquire and discharge macaroons.
   *
   * @class Bakery
   */

  var Bakery = Y.Base.create('Bakery',
    Y.Base, [], {

      /**
       Initialize.

       @method initializer
       @param {Object} cfg A config object providing webhandler and visit method
           information. A visitMethod can be provided, which becomes the
           bakery's visitMethod. Alternatively, the bakery can be configured to
           non interactive mode. If neither is true, the default method is used.
           setCookiePath is a string representing the endpoint register a
           macaroon as a cookie back, can be omitted.
           webhandler is an Y.juju.environments.web.WebHandler handling all the
           xhr requests.
           {visitMethod: fn, interactive: boolean, webhandler: obj,
           serviceName: string, setCookiePath: string}
       @return {undefined} Nothing.
       */
      initializer: function (cfg) {
        this.webhandler = cfg.webhandler;
        if (cfg.visitMethod) {
          this.visitMethod = cfg.visitMethod;
        } else if (cfg.interactive !== undefined && !cfg.interactive) {
          this.visitMethod = this._nonInteractiveVisitMethod;
        } else {
          this.visitMethod = this._defaultVisitMethod;
        }
        // If there is a cookie that may already be set, such as when coming
        // from the storefront, use that cookie name instead of the generated
        // one.
        if (cfg.existingCookie) {
          this.macaroonName = cfg.existingCookie;
        } else {
          this.macaroonName = 'Macaroons-' + cfg.serviceName;
        }
        this.staticMacaroonPath = cfg.staticMacaroonPath;
        this.setCookiePath = cfg.setCookiePath;
        this.nonceLen = 24;
        this.cookieStore = cfg.cookieStore;
        if (cfg.macaroon) {
          if (this.cookieStore) {
            this.cookieStore.setItem(this.macaroonName, cfg.macaroon);
          } else {
            var prefix = this.macaroonName + '=';
            document.cookie = prefix + cfg.macaroon + ';path=/';
          }
        }
        this.dischargeStore = cfg.dischargeStore;
        if (!this.dischargeStore) {
          console.error('bakery instantiated without a discharge store');
          return;
        }
        if (cfg.dischargeToken) {
          this.dischargeStore.setItem(DISCHARGE_TOKEN, cfg.dischargeToken);
        }
      },


      /**
        Returns a macaroon for this bakery instance. If a macaroon has already
        been stored it will return that. If not, it makes a request to the
        staticMacaroonPath to fetch and discharge and store a new macaroon for
        later use.

        @method fetchMacaroonFromStaticPath
        @param {Function} callback The callback that gets called for success
          or failure at any point in the macaroon chain.
        @return {undefined}
      */
      fetchMacaroonFromStaticPath: function(callback) {
        var savedMacaroon = this.getMacaroon();
        if (savedMacaroon !== null) {
          callback(null, savedMacaroon);
          return;
        }
        if (!this.staticMacaroonPath) {
          callback('Static macaroon path was not defined.');
          return;
        }
        return this.webhandler.sendGetRequest(
          this.staticMacaroonPath, null, null, null, false, null,
          this._interactivePrefetch.bind(this, callback));
      },

      /**
        Handler for the interactive macaroon prefetch.

        @method _interactivePrefetch
        @param {Function} callback The callback to be called after success
          or failure.
        @param {Object} The response object from the staticMacaroonPath fetch.
        @return {undefined}
      */
      _interactivePrefetch: function(callback, res) {
        var macaroon = {};
        try {
          macaroon = JSON.parse(res.target.responseText);
        } catch(e) {
          callback(e);
          return;
        }
        this._authenticate(macaroon, function() {
          callback(null, this.getMacaroon());
        }.bind(this), callback);
      },

      /**
       Prepare and return HTTP request headers for macaraq requests.

       @param {Object} overrides Any additional headers.
       @return {Object} The resulting request headers.
      */
      _prepareHeaders: function(overrides) {
        const headers = {'Bakery-Protocol-Version': PROTOCOL_VERSION};
        Object.keys(overrides || {}).forEach(key => {
          headers[key] = overrides[key];
        });
        const macaroons = this.getMacaroon();
        if (macaroons !== null) {
          headers['Macaroons'] = macaroons;
        }
        return headers;
      },

      /**
       Takes the path supplied by the caller and makes a get request to the
       requestHandlerWithInteraction instance. If setCookiePath is set then
       it is used to set a cookie back to the ui after authentication.

       @param {String} The path to make the api request to.
       @param {Function} successCallback Called when the api request completes
              successfully.
       @param {Function} failureCallback Called when the api request fails
              with a response of >= 400 except 401 and a WWW-Authenticate
              header will trigger authentication.
       @param {Boolean} redirect Whether the handler should redirect if there
              is a 401 on the request.
       @return {Object} The asynchronous request instance.
      */
      sendGetRequest: function(
        path, successCallback, failureCallback, redirect) {
        const onAuthDone = this._requestHandler.bind(
          this, successCallback, failureCallback);
        const onAuthRequired = function() {
          return this.webhandler.sendGetRequest(
            path, this._prepareHeaders(null), null, null, false, null,
            onAuthDone);
        }.bind(this);
        return this.webhandler.sendGetRequest(
          path, this._prepareHeaders(null), null, null, false, null,
          this._requestHandlerWithInteraction.bind(
            this, onAuthRequired, onAuthDone, failureCallback, redirect)
        );
      },

      /**
       Takes the path supplied by the caller and makes a delete request to the
       requestHandlerWithInteraction instance. If setCookiePath is set then
       it is used to set a cookie back to the ui after authentication.

       @param {String} The path to make the api request to.
       @param {Function} successCallback Called when the api request completes
              successfully.
       @param {Function} failureCallback Called when the api request fails
              with a response of >= 400 except 401 and a WWW-Authenticate
              header will trigger authentication.
       @param {Boolean} redirect Whether the handler should redirect if there
              is a 401 on the request.
       @return {Object} The asynchronous request instance.
      */
      sendDeleteRequest: function(
        path, successCallback, failureCallback, redirect) {
        const onAuthDone = this._requestHandler.bind(
          this, successCallback, failureCallback);
        const onAuthRequired = function() {
          return this.webhandler.sendDeleteRequest(
            path, this._prepareHeaders(null), null, null, false, null,
            onAuthDone);
        }.bind(this);
        return this.webhandler.sendDeleteRequest(
          path, this._prepareHeaders(null), null, null, false, null,
          this._requestHandlerWithInteraction.bind(
            this, onAuthRequired, onAuthDone, failureCallback, redirect)
        );
      },

      /**
       Takes the path supplied by the caller and makes a post request to the
       requestHandlerWithInteraction instance. If setCookiePath is set then
       it is used to set a cookie back to the ui after authentication.

       @param path {String} The path to make the api request to.
       @param data {String} Stringified JSON of parameters to send to the POST
              endpoint.
       @param successCallback {Function} Called when the api request completes
              successfully.
       @param failureCallback {Function} Called when the api request fails
              with a response of >= 400 except 401/407 where it does
              authentication.
       @param {Boolean} redirect Whether the handler should redirect if there
              is a 401 on the request.
       @param {Object} response The XHR response object from initial request.
      */
      sendPostRequest: function(
        path, data, successCallback, failureCallback, redirect) {
        const onAuthDone = this._requestHandler.bind(
          this, successCallback, failureCallback);
        const onAuthRequired = function() {
          return this.webhandler.sendPostRequest(
            path, this._prepareHeaders({'Content-type': JSON_CONTENT_TYPE}),
            data, null, null, false, null, onAuthDone);
        }.bind(this);
        return this.webhandler.sendPostRequest(
          path, this._prepareHeaders({'Content-type': JSON_CONTENT_TYPE}),
          data, null, null, false, null,
          this._requestHandlerWithInteraction.bind(
            this, onAuthRequired, onAuthDone, failureCallback, redirect)
        );
      },

      /**
       Takes the path supplied by the caller and makes a put request to the
       requestHandlerWithInteraction instance. If setCookiePath is set then
       it is used to set a cookie back to the ui after authentication.

       @param path {String} The path to make the api request to.
       @param data {String} Stringified JSON of parameters to send to the POST
              endpoint.
       @param successCallback {Function} Called when the api request completes
              successfully.
       @param failureCallback {Function} Called when the api request fails
              with a response of >= 400 except 401/407 where it does
              authentication.
       @param {Boolean} redirect Whether the handler should redirect if there
              is a 401 on the request.
       @param {Object} response The XHR response object from initial request.
      */
      sendPutRequest: function(
        path, data, successCallback, failureCallback, redirect) {
        const onAuthDone = this._requestHandler.bind(
          this, successCallback, failureCallback);
        const onAuthRequired = function() {
          return this.webhandler.sendPutRequest(
            path, this._prepareHeaders({'Content-type': JSON_CONTENT_TYPE}),
            data, null, null, false, null, onAuthDone);
        }.bind(this);
        return this.webhandler.sendPutRequest(
          path, this._prepareHeaders({'Content-type': JSON_CONTENT_TYPE}),
          data, null, null, false, null,
          this._requestHandlerWithInteraction.bind(
            this, onAuthRequired, onAuthDone, failureCallback, redirect)
        );
      },

      /**
       Takes the path supplied by the caller and makes a patch request to the
       requestHandlerWithInteraction instance. If setCookiePath is set then
       it is used to set a cookie back to the ui after authentication.

       @param path {String} The path to make the api request to.
       @param data {String} Stringified JSON of parameters to send to the PATCH
              endpoint.
       @param successCallback {Function} Called when the api request completes
              successfully.
       @param failureCallback {Function} Called when the api request fails
              with a response of >= 400 except 401/407 where it does
              authentication.
       @param {Boolean} redirect Whether the handler should redirect if there
              is a 401 on the request.
       @param {Object} response The XHR response object from initial request.
      */
      sendPatchRequest: function(
        path, data, successCallback, failureCallback, redirect) {
        const onAuthDone = this._requestHandler.bind(
          this, successCallback, failureCallback);
        const onAuthRequired = function() {
          return this.webhandler.sendPatchRequest(
            path, this._prepareHeaders({'Content-type': JSON_CONTENT_TYPE}),
            data, null, null, false, null, onAuthDone);
        }.bind(this);
        return this.webhandler.sendPatchRequest(
          path, this._prepareHeaders({'Content-type': JSON_CONTENT_TYPE}),
          data, null, null, false, null,
          this._requestHandlerWithInteraction.bind(
            this, onAuthRequired, onAuthDone, failureCallback, redirect)
        );
      },

      /**
        Handle sending requests after authenticating using macaroons.

        @method _requestHandlerWithInteraction
        @param {Function} onAuthRequired The original request to be performed
          after authenticating.
        @param {Function} onAuthDone Called when the response is finally
          available.
        @param {Function} onFailure Called when there are errors in the
          authentication process.
        @param {Boolean} redirect Whether the handler should redirect if there
          is a 401 on the request.
        @param {Object} response The XHR response object.
      */
      _requestHandlerWithInteraction: function (
        onAuthRequired, onAuthDone, onFailure, redirect=true, response) {
        const target = response.target;
        // XXX I reliably recieve a 401 when signing in for the first time.
        // This may not be the best path forward. Makyo 2016-04-25
        if (
          target.status === 401 &&
          target.getResponseHeader('Www-Authenticate') === 'Macaroon' &&
          redirect === true
        ) {
          const jsonResponse = JSON.parse(target.responseText);
          this._authenticate(
            jsonResponse.Info.Macaroon, onAuthRequired, onFailure);
          return;
        }
        onAuthDone(response);
      },

      /**
       Handles the request response from the _makeRequest method, calling the
       supplied failure callback if the response status was >= 400 or passing
       the response object to the supplied success callback.

       @method _requestHandler
       @param {Function} successCallback Called when the api request completes
              successfully.
       @param {Function} failureCallback Called when the api request fails
              with a response of >= 400.
       @param {Object} response The XHR response object.
       @return {undefined} Nothing.
       */
      _requestHandler: function (successCallback, failureCallback, response) {
        var target = response.target;
        if (target.status >= 400) {
          failureCallback(response);
          return;
        }
        successCallback(response);
      },

      /**
       Authenticate by discharging the macaroon and
       then set the cookie by calling the authCookiePath provided.

       @method authenticate
       @param {Macaroon} The macaroon to be discharged.
       @param {Function} The request to be sent again in case of
              successful authentication.
       @param {Function} The callback failure in case of wrong authentication.
       @return {undefined} Nothing.
       */
      _authenticate: function (m, requestFunc, failureCallback) {
        var successCallback = this._processDischarges.bind(
          this, requestFunc, failureCallback);
        this.discharge(m, successCallback, failureCallback);
      },

      /**
        Discharge the macaroon.

        @method discharge
        @param {Macaroon} m The macaroon to be discharged.
        @param {Function} successCallback The callable to be called if the
          discharge succeeds. It receives the resulting macaroons array.
        @param {Function} failureCallback The callable to be called if the
          discharge fails. It receives an error message.
      */
      discharge: function(m, successCallback, failureCallback) {
        try {
          macaroon.discharge(
            macaroon.import(m),
            this._obtainThirdPartyDischarge.bind(this),
            function(discharges) {
              successCallback(macaroon.export(discharges));
            },
            failureCallback
          );
        } catch (exc) {
          failureCallback('discharge failed: ' + exc.message);
        }
      },

      /**
       Process the discharged macaroon and call the end point to be able to set
       a cookie for the origin domain only when an auth cookie path is
       provided, then call the original function.

       @method _processDischarges
       @param {Function} The request to be sent again in case of
              successful authentication.
       @param {Function} The callback failure in case of wrong authentication.
       @param {[Macaroon]} The macaroons being discharged.
       @return {Object} The asynchronous request instance.
       */
      _processDischarges: function (requestFunc, failureCallback, macaroons) {
        var content = JSON.stringify({'Macaroons': macaroons});
        if (this.setCookiePath === undefined) {
          this._successfulDischarges(requestFunc, macaroons);
          return;
        }
        return this.webhandler.sendPutRequest(
          this.setCookiePath,
          null, content, null, null, true, null,
          this._requestHandler.bind(
            this,
            this._successfulDischarges.bind(this, requestFunc, macaroons),
            failureCallback
          )
        );
      },

      /**
       Process successful discharge by setting Macaroons Cookie
       and invoke the original request.

       @method _successfulDischarges
       @param {Function} The path where to send put request
              to set the cookie back.
       @param {Object} an exported Macaroon.
       @return {undefined} Nothing.
       */
      _successfulDischarges: function (originalRequest, jsonMacaroon) {
        if (this.cookieStore) {
          this.cookieStore.setItem(this.macaroonName,
            btoa(JSON.stringify(jsonMacaroon)));
        } else {
          var prefix = this.macaroonName + '=';
          document.cookie = prefix + btoa(JSON.stringify(jsonMacaroon))
            + ';path=/';
        }
        originalRequest();
      },

      /**
       Go to the discharge endpoint to obtain the third party discharge.

       @method obtainThirdPartyDischarge
       @param {String} The origin location.
       @param {String} The third party location where to discharge.
       @param {Function} The macaroon to be discharge.
       @param {Function} The request to be sent again in case of
              successful authentication.
       @param {Function} The callback failure in case of wrong authentication.
       @return {Object} The asynchronous request instance.
       */
      _obtainThirdPartyDischarge: function (location,
                                            thirdPartyLocation, condition,
                                            successCallback, failureCallback) {
        thirdPartyLocation += '/discharge';

        var dischargeToken = this.dischargeStore.getItem(DISCHARGE_TOKEN);
        var headers = {
          'Bakery-Protocol-Version': 1,
          'Content-Type': 'application/x-www-form-urlencoded'
        };
        if (dischargeToken) {
          headers['Macaroons'] = dischargeToken;
        }
        var content = 'id=' + encodeURIComponent(condition) +
          '&location=' + encodeURIComponent(location);
        return this.webhandler.sendPostRequest(
          thirdPartyLocation,
          headers, content, null, null, false, null,
          this._requestHandler.bind(
            this,
            this._exportMacaroon.bind(this, successCallback, failureCallback),
            this._interact.bind(this, successCallback, failureCallback)
          )
        );
      },

      /**
       Get a JSON response from authentication either trusted or with
       interaction that contains a macaroon.

       @method _exportMacaroon
       @param {Function} The callback function to be sent in case of
              successful authentication
       @param {Function} The callback function failure in case of
              wrong authentication
       @param {Object} response The XHR response object from initial request.
      */
      _exportMacaroon: function (successCallback, failureCallback, response) {
        try {
          var json = JSON.parse(response.target.responseText);
          if (json.DischargeToken !== undefined &&
              json.DischargeToken !== '') {
            this.dischargeStore.setItem(DISCHARGE_TOKEN,
              btoa(JSON.stringify(json.DischargeToken)));
          }
          successCallback(macaroon.import(json.Macaroon));
        } catch (ex) {
          failureCallback(ex.message);
        }
      },

      /**
       Interact to be able to sign-in to get authenticated.

       @method _interact
       @param {Function} The callback function to be sent in case of
              successful authentication.
       @param {Function} The callback function failure in case of
              wrong authentication.
       @param {Function} The callback function failure in case of
              wrong authentication.
       @param {Object} response The XHR response object from initial request.
       @return {Object} The asynchronous request instance.
       */
      _interact: function(successCallback, failureCallback, e) {
        var response = JSON.parse(e.target.responseText);
        if (response.Code !== 'interaction required') {
          failureCallback(response.Code);
          return;
        }

        this.visitMethod(response);

        return this.webhandler.sendGetRequest(
            response.Info.WaitURL,
            {'Content-Type': JSON_CONTENT_TYPE},
            null, null, false, null,
            this._requestHandler.bind(
              this,
              this._exportMacaroon.bind(this, successCallback, failureCallback),
              failureCallback
            )
        );
      },

      /**
       Non interactive visit method which sends the jujugui "auth" blob
       to the IdM to login.

       @method _nonInteractiveVisitMethod
       @param {Object} response The XHR response object from initial request.
       @return {Object} The asynchronous request instance.
      */
      _nonInteractiveVisitMethod: function(response) {
        var acceptHeaders = {'Accept': JSON_CONTENT_TYPE};
        var contentHeaders = {'Content-Type': JSON_CONTENT_TYPE};
        var login = function(response) {
          var method = JSON.parse(response.target.responseText).jujugui;
          var data = JSON.stringify({login: window.juju_config.auth});
          return this.webhandler.sendPostRequest(
              method, contentHeaders, data,
              null, null, false, null, null);
        };

        return this.webhandler.sendGetRequest(
            response.Info.VisitURL,
            acceptHeaders, null, null, false, null, login.bind(this));
      },

      /**
       Adds a public-key encrypted third party caveat.

       @method addThirdPartyCaveat
       @param {macaroon object} The macaroon to add the caveat to.
       @param {String} The condition for the third party to verify.
       @param {String} The URL of the third party.
       @param {Uint8Array} The third party public key to use (as returned
              by nacl.box.keyPair().publicKey.
       @param {Object} The encoding party's key pair (as returned
              by nacl.box.keyPair()).
       @return {undefined} Nothing.
       */
      addThirdPartyCaveat: function(m, condition, location,
                                    thirdPartyPublicKey, myKeyPair) {
        var nonce = nacl.randomBytes(this.nonceLen);
        var rootKey = nacl.randomBytes(this.nonceLen);
        var plain = JSON.stringify({
          RootKey: nacl.util.encodeBase64(rootKey), Condition: condition
        });
        var sealed = nacl.box(nacl.util.decodeUTF8(plain), nonce,
                              thirdPartyPublicKey, myKeyPair.secretKey);
        var caveatIdObj = {
          ThirdPartyPublicKey: nacl.util.encodeBase64(thirdPartyPublicKey),
          FirstPartyPublicKey: nacl.util.encodeBase64(myKeyPair.publicKey),
          Nonce:               nacl.util.encodeBase64(nonce),
          Id:                  nacl.util.encodeBase64(sealed),
        };
        var caveatId = JSON.stringify(caveatIdObj);

        m.addThirdPartyCaveat(rootKey, caveatId, location);
      },

      /**
       Discharges a public-key encrypted third party caveat.

       @param {String} The third party caveat id to check.
       @param {Object} The third party's key pair (as returned
              by nacl.box.keyPair()).
       @param {function} A function that is called to check the condition.
              It should throw an exception if the condition is not met.
       @return {macaroon} The macaroon that discharges the caveat.
       */
      dischargeThirdPartyCaveat: function(caveatId, myKeyPair, check) {
        var caveatIdObj = {};
        try {
          caveatIdObj = JSON.parse(caveatId);
        } catch(ex) {
          throw new Exception('Unable to parse caveatId');
        }
        if(nacl.util.encodeBase64(myKeyPair.publicKey) !==
           caveatIdObj.ThirdPartyPublicKey) {
          throw new Exception('public key mismatch');
        }
        var nonce = nacl.util.decodeBase64(caveatIdObj.Nonce);
        var firstPartyPub = nacl.util.decodeBase64(
          caveatIdObj.FirstPartyPublicKey
        );
        if(nonce.length !== this.nonceLen) {
          throw new Exception('bad nonce length');
        }
        var sealed = nacl.util.decodeBase64(caveatIdObj.Id);
        var unsealed = nacl.box.open(sealed, nonce, firstPartyPub,
                                     myKeyPair.secretKey);

        var unsealedStr = nacl.util.encodeUTF8(unsealed);
        var plain = JSON.parse(unsealedStr);
        if(plain.Condition === undefined){
          throw new Exception('empty condition in third party caveat');
        }
        // Check that the condition actually holds.
        check(plain.Condition);
        return macaroon.newMacaroon(
            nacl.util.decodeBase64(plain.RootKey), caveatId, '');
      },

      /**
       Non interactive visit method which sends the jujugui "auth" blob
       to the IdM to login.

       @method _nonInteractiveVisitMethod
       @param {Object} response The XHR response object from initial request.
       @return {undefined} Nothing.
      */
      _defaultVisitMethod: function(response) {
        window.open(response.Info.VisitURL, 'Login');
      },

      /**
       Get macaroon from local cookie.

       @method getMacaroon
       @return {String} Macaroon that was set in local cookie.
       */
      getMacaroon: function() {
        if (this.cookieStore) {
          return this.cookieStore.getItem(this.macaroonName);
        } else {
          var name = this.macaroonName + '=',
              macaroon = null;
          document.cookie.split(';').some(cookie => {
            cookie = cookie.trim();
            if (cookie.indexOf(name) === 0) {
              macaroon = cookie.substring(name.length, cookie.length);
              return true;
            }
            return false;
          });
          return macaroon;
        }
      },

      /**
        Clears the cookies saved for macaroons.

        @method clearCookie
      */
      clearCookie: function() {
        var name = this.macaroonName;
        var pathParts = '/profile'.split('/');
        var currentPath = ' path=';

        if (this.cookieStore) {
          this.cookieStore.removeItem(this.macaroonName);
        } else {
          // Delete the / cookie first
          document.cookie = `${name}=; expires=Thu, 01-Jan-1970 00:00:01 GMT;`;
          pathParts.forEach(part => {
            currentPath += ((currentPath.substr(-1) !== '/') ? '/' : '') + part;
            document.cookie =
              `${name}=; expires=Thu, 01-Jan-1970 00:00:01 GMT;${currentPath};`;
          });
        }
        this.dischargeStore.removeItem(DISCHARGE_TOKEN);
      }
    }
  );

  module.Bakery = Bakery;

}, '0.1.0', {
  requires: [
    'base',
    'cookie',
    'node',
    'juju-env-base',
    'juju-env-web-handler',
    'macaroon'
  ]
});
