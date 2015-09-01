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
   * that automatically acquire and discharge macaroons
   *
   * @class Bakery
   */

  var Bakery = Y.Base.create('Bakery',
      Y.Base, [], {

      /**
       Initialize.

       @method initializer
       @return {undefined} Nothing.
       */
      initializer: function () {
        this.webhandler = new Y.juju.environments.web.WebHandler();
      },

      /**
       Send get request.

       @param {String} The path to make the api request to.
       @param {String} The path to make a request to set the cookie.
       @param {Function} successCallback Called when the api request completes
       successfully.
       @param {Function} failureCallback Called when the api request fails
       with a response of >= 400 except 401/407 where it does authentication.
       */
      sendGetRequest: function (path, setCookiePath,
                                successCallback, failureCallback) {
        var macaroons = Y.Cookie.get('Macaroons');
        var headers = {'Bakery-Protocol-Version': 1};
        if (macaroons !== null) {
          headers['Macaroons'] = macaroons;
        }

        this.webhandler.sendGetRequest(
          path, headers, null, null, false, null,
          this._requestHandlerWithInteraction.bind(
            this,
            path,
            setCookiePath,
            successCallback,
            failureCallback
          )
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
       @param {String} The path to make a request to set the cookie.
       @param {Function} successCallback Called when the api request completes
       successfully.
       @param {Function} failureCallback Called when the api request fails
       with a response of >= 400 (except 401/407).
       @param {Object} response The XHR response object.
       */
      _requestHandlerWithInteraction: function (path,
                                                setCookiePath,
                                                successCallback,
                                                failureCallback,
                                                response) {
        var target = response.target;
        if (target.status === 401 &&
          target.getResponseHeader('Www-Authenticate') === 'Macaroon') {
          var jsonResponse = JSON.parse(target.responseText);
          this._authenticate(
            jsonResponse.Info.Macaroon,
            setCookiePath,
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
       Used to resend the original request without any interaction this time..

       @method _sendOriginalRequest
       @param {String} The path to make the api request to.
       @param {Function} successCallback Called when the api request completes
       successfully.
       @param {Function} failureCallback Called when the api request fails
       with a response of >= 400 (except 401/407).
       */
      _sendOriginalRequest: function(path, successCallback, failureCallback) {
          var macaroons = Y.Cookie.get('Macaroons');
          var headers = {'Bakery-Protocol-Version': 1};
          if (macaroons !== null) {
            headers['Macaroons'] = macaroons;
          }
          this.webhandler.sendGetRequest(
            path, headers, null, null, false, null,
            this._requestHandler.bind(
              this, successCallback, failureCallback
            )
          );
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
       Authenticate  by discharging the macaroon and
       then set the cookie by calling the authCookiePath provided

       @method authenticate
       @param {Macaroon} The macaroon to be discharged
       @param {String} The path where to send put request to set the cookie back
       @param {Function} The request to be sent again in case of
       successful authentication
       @param {Function} The callback failure in case of wrong authentication
       */
      _authenticate: function (m, authCookiePath,
                               requestFunction, failureCallback) {
        try {
          macaroon.discharge(
            macaroon.import(m),
            this._obtainThirdPartyDischarge.bind(this),
            this._processDischarges.bind(
              this,
              authCookiePath,
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
       a cookie for the origin domain only when n auth cooie path i provided,
       then call the original function.

       @method _processDischarges
       @param {String} The path where to send put request to set the cookie back
       @param {Function} The request to be sent again in case of
       successful authentication
       @param {Function} The callback failure in case of wrong authentication
       @param {[Macaroon]} The macaroons being discharged
       */
      _processDischarges: function (authCookiePath, requestFunction,
                                    failureCallback, discharges) {
        var jsonMacaroon = macaroon.export(discharges);
        var content = JSON.stringify({'Macaroons': jsonMacaroon});
        if (authCookiePath === null) {
          this._setMacaroonsCookie(requestFunction, jsonMacaroon);
          return;
        }
        this.webhandler.sendPutRequest(
          authCookiePath,
          null, content, null, null, true, null,
          this._requestHandler.bind(
            this,
            this._setMacaroonsCookie.bind(this, requestFunction, jsonMacaroon),
            failureCallback
          )
        );
      },

      /**
       Process succesful discharche by setting MAcaroons Cookie
       and invoke the original request

       @method _setMacaroonsCookie
       @param {Function} The path where to send put request
              to set the cookie back
       @param {Object} an exported Macaroon
       */
      _setMacaroonsCookie: function (originalRequest, jsonMacaroon) {
        Y.Cookie.set('Macaroons', btoa(JSON.stringify(jsonMacaroon)));
        originalRequest();
      },

      /**
       Go to the discharge endpoint to obtain the third party discharge.

       @method obtainThirdPartyDischarge
       @param {String} The origin location
       @param {String} The third party location where to discharge
       @param {Function} The macaroon to be discharge
       @param {Function} The request to be sent again in case of
       successful authentication
       @param {Function} The callback failure in case of wrong authentication
       */
      _obtainThirdPartyDischarge: function (location,
                                            thirdPartyLocation, condition,
                                            successCallback, failureCallback) {
        thirdPartyLocation += '/discharge';
        var headers = {
          'Bakery-Protocol-Version': 1,
          'Content-Type': 'application/x-www-form-urlencoded'
        };
        var content = 'id=' + encodeURI(condition) +
          '&location=' + encodeURI(location);
        this.webhandler.sendPostRequest(
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
      @param {Object} response The XHR response object.
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
                        successful authentication
      @param {Function} The callback function failure in case of
                        wrong authentication
    */
    _interact: function(successCallback, failureCallback, e) {
      var response = JSON.parse(e.target.responseText);
      if (response.Code !== 'interaction required') {
        failureCallback(response.Code);
        return;
      }

      window.open(response.Info.VisitURL, 'Login');

      this.webhandler.sendGetRequest(
          response.Info.WaitURL,
          null, null, null, false, null,
          this._requestHandler.bind(
            this,
            this._exportMacaroon.bind(this, successCallback, failureCallback),
            failureCallback
          )
      );
    }
  });

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
