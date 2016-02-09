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
        this.macaroonName = 'Macaroons-' + cfg.serviceName;
        this.staticMacaroonPath = cfg.staticMacaroonPath;
        this.setCookiePath = cfg.setCookiePath;
        this.nonceLen = 24;
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
        var savedMacaroon = this._getMacaroon();
        if (savedMacaroon !== null) {
          callback(null, savedMacaroon);
          return;
        }
        if (!this.staticMacaroonPath) {
          callback('Static macaroon path was not defined.');
          return;
        }
        this.webhandler.sendGetRequest(
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
          callback(null, this._getMacaroon());
        }.bind(this), callback);
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
       @return {Object} The asynchronous request instance.
       */
      sendGetRequest: function (path, successCallback, failureCallback) {
        var macaroons = this._getMacaroon();
        var headers = {'Bakery-Protocol-Version': 1};
        if (macaroons !== null) {
          headers['Macaroons'] = macaroons;
        }

        return this.webhandler.sendGetRequest(
          path, headers, null, null, false, null,
          this._requestHandlerWithInteraction.bind(
            this,
            path,
            successCallback,
            failureCallback
          )
        );
      },

      /**
       Takes the path supplied by the caller and makes a get request to the
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
       @param {Object} response The XHR response object from initial request.
       */
      sendPostRequest: function (path, data, successCallback, failureCallback) {
        var macaroons = this._getMacaroon();
        var headers = {
          'Bakery-Protocol-Version': 1,
          'Content-type': 'application/json'
        };
        if (macaroons !== null) {
          headers['Macaroons'] = macaroons;
        }

        return this.webhandler.sendPostRequest(
          path, headers, data, null, null, false, null,
          this._requestHandlerWithInteraction.bind(
            this,
            path,
            successCallback,
            failureCallback)
        );
      },

      /**
       Handles the request response from the _makeRequest method, calling the
       supplied failure callback if the response status was >= 400 or passing
       the response object to the supplied success callback. For 407/401
       response it will request authentication through the macaroon provided in
       the 401/407 response.

       @method _requestHandlerWithInteraction
       @param {String} The path to make the api request to.
       @param {Function} successCallback Called when the api request completes
              successfully.
       @param {Function} failureCallback Called when the api request fails
              with a response of >= 40  0 (except 401/407).
       @param {Object} response The XHR response object.
       @return {undefined} Nothing.
       */
      _requestHandlerWithInteraction: function (path, successCallback,
                                                failureCallback, response) {
        var target = response.target;
        if (target.status === 401 &&
          target.getResponseHeader('Www-Authenticate') === 'Macaroon') {
          var jsonResponse = JSON.parse(target.responseText);
          this._authenticate(
            jsonResponse.Info.Macaroon,
            this._sendOriginalRequest.bind(
              this, path, successCallback, failureCallback
            ),
            failureCallback
          );
        } else {
          this._requestHandler(successCallback, failureCallback, response);
        }
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
       Used to resend the original request without any interaction this time.

       @method _sendOriginalRequest
       @param {String} The path to make the api request to.
       @param {Function} successCallback Called when the api request completes
              successfully.
       @param {Function} failureCallback Called when the api request fails
              with a response of >= 400 (except 401/407).
       @return {Object} The asynchronous request instance.
       */
      _sendOriginalRequest: function(path, successCallback, failureCallback) {
        var macaroons = this._getMacaroon();
        var headers = {'Bakery-Protocol-Version': 1};
        if (macaroons !== null) {
          headers['Macaroons'] = macaroons;
        }
        return this.webhandler.sendGetRequest(
          path, headers, null, null, false, null,
          this._requestHandler.bind(
            this, successCallback, failureCallback
          )
        );
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
      _authenticate: function (m, requestFunction, failureCallback) {
        try {
          macaroon.discharge(
            macaroon.import(m),
            this._obtainThirdPartyDischarge.bind(this),
            this._processDischarges.bind(
              this,
              requestFunction,
              failureCallback
            ),
            failureCallback
          );
        } catch (ex) {
          failureCallback(ex.message);
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
      _processDischarges: function (requestFunction, failureCallback,
                                    discharges) {
        var jsonMacaroon;
        try {
          jsonMacaroon = macaroon.export(discharges);
        } catch (ex) {
          failureCallback(ex.message);
        }
        var content = JSON.stringify({'Macaroons': jsonMacaroon});
        if (this.setCookiePath === undefined) {
          this._successfulDischarges(requestFunction, jsonMacaroon);
          return;
        }
        return this.webhandler.sendPutRequest(
          this.setCookiePath,
          null, content, null, null, true, null,
          this._requestHandler.bind(
            this,
            this._successfulDischarges.bind(
                this, requestFunction, jsonMacaroon),
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
        var prefix = this.macaroonName + '=';
        document.cookie = prefix + btoa(JSON.stringify(jsonMacaroon));
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
        var headers = {
          'Bakery-Protocol-Version': 1,
          'Content-Type': 'application/x-www-form-urlencoded'
        };
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
          var dm = macaroon.import(
            JSON.parse(response.target.responseText).Macaroon
          );
          successCallback(dm);
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
            null, null, null, false, null,
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
        var acceptHeaders = {'Accept': 'application/json'};
        var contentHeaders = {'Content-Type': 'application/json'};
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

       @method _getMacaroon
       @return {String} Macaroon that was set in local cookie.
       */
      _getMacaroon: function() {
        var name = this.macaroonName + '=';
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) === ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) === 0) {
            return c.substring(name.length,c.length);
          }
        }
        return null;
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
