/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var module = module;

(function (exports) {

  const jujulib = exports.jujulib;
  const macaroonlib = require('js-macaroon');

  // Define the bakery protocol version used by the GUI.
  const PROTOCOL_VERSION = 1;
  // Define the HTTP content type for JSON and encoded form requests.
  const JSON_CONTENT_TYPE = 'application/json';
  const WWW_FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded';
  // Define HTTP statuses.
  const STATUS_UNAUTHORIZED = 401;
  const STATUS_PROXY_AUTH_REQUIRED = 407;
  // Define bakery specific errors.
  const ERR_DISCHARGE_REQUIRED = 'macaroon discharge required';
  const ERR_INTERACTION_REQUIRED = 'interaction required';

  /**
    Serialize the given macaroons.

    @param {Array} macaroons The macaroons to be serialized.
    @return {string} The resulting serialized string.
  */
  const serialize = macaroons => {
    return btoa(JSON.stringify(macaroons));
  };

  /**
    De-serialize the given serialized macaroons.

    @param {string} serialized The serialized macaroons.
    @return {Array} The resulting macaroon slice.
  */
  const deserialize = serialized => {
    return JSON.parse(atob(serialized));
  };

  /**
    A macaroon bakery implementation.

    The bakery implements the protocol used to acquire and discharge macaroons
    over HTTP.
  */
  const Bakery = class Bakery {

    /**
      Initialize a bakery with the given HTTP client (used to make requests)
      and storage (used to persist macaroons).

      @param {Object} httpClient The client used to send HTTP requests. It must
        implement a "send{Method}Request" method for every HTTP method. An
        instance of WebHandler is usually provided.
      @param {Object} storage The storage used to persist macaroons. It must
        implement the following interface:
          - get(key) -> value;
          - set(key, value, callback): the callback is called without arguments
            when the set operation has been performed.
      @param {Object} params Optional parameters including:
        - onSuccess: a function to be called when the request completes
          properly. It defaults to a no-op function.
        - visitPage: the function used to visit the identity provider page when
          required, receiving the URL. It defaults to opening a pop up window.
    */
    constructor(httpClient, storage, params={}) {
      this._client = httpClient;
      this.storage = storage;
      this._onSuccess = params.onSuccess || (() => {});
      this._visitPage = params.visitPage || (visitURL => {
        window.open(visitURL, 'Login');
      });
      this._dischargeDisabled = false;
    }

    /**
      Return a new bakery instance from the current one, in which the discharge
      functionality is disabled.

      Discharge required responses are just returned without executing the
      macaroon acquisition process.

      @return {Object} The new bakery instance.
    */
    withoutDischarge() {
      const bakery = new Bakery(this._client, this.storage, {
        onSuccess: this._onSuccess,
        visitPage: this._visitPage
      });
      bakery._dischargeDisabled = true;
      return bakery;
    }

    /**
      Send an HTTP request to the given URL with the given HTTP method, headers
      and body. The given callback receives an error and a response when the
      request is complete.

      @param {String} url The URL to which to send the request.
      @param {String} method The HTTP method, like "get" or "POST".
      @param {Object} headers Headers that must be included in the request.
        Note that bakery specific headers are automatically added internally.
      @param {String} body The request body if it applies, or null.
      @param {Function} callback A function called when the response is
        received from the remote URL. It receives a tuple (error, response).
        If the request succeeds the error is null.
      @return {Object} the XHR instance.
    */
    sendRequest(url, method, headers, body, callback) {
      method = method.toLowerCase();
      // Prepare the send method and wrap the provided callback.
      const methodStr = method.charAt(0).toUpperCase() + method.slice(1);
      const send = this._client[`send${methodStr}Request`].bind(this._client);
      const wrappedCallback = this._wrapCallback(
        url, method, headers, body, callback);
      // Prepare the header. Include already stored macaroons in the header if
      // present for the current URL.
      const allHeaders = {'Bakery-Protocol-Version': PROTOCOL_VERSION};
      const macaroons = this.storage.get(url);
      if (macaroons) {
        allHeaders['Macaroons'] = macaroons;
      }
      Object.keys(headers || {}).forEach(key => {
        const value = headers[key];
        allHeaders[key] = value;
      });
      // Prepare the parameters for sending the HTTP request.
      const username = null;
      const password = null;

      // The only time we need the with credentials header is for cookie auth;
      // it's not pretty, but special casing here is the most direct solution.
      // Another option is to implement a factory method on bakery, e.g.
      // bakery.withCredentials(), which would return a bakery that sets the
      // withCredentials param to true rather than false.
      let withCredentials = false;
      if (method === 'put' && url.indexOf('/set-auth-cookie') !== -1) {
        withCredentials = true;
      }
      const progressCallback = null;
      // Send the request.
      if (method === 'post' || method === 'put' || method === 'patch') {
        return send(
          url, allHeaders, body, username, password, withCredentials,
          progressCallback, wrappedCallback);
      }
      return send(
        url, allHeaders, username, password, withCredentials,
        progressCallback, wrappedCallback);
    }

    /**
      Send an HTTP GET request to the given URL with the given headers.
      The given callback receives an error and a response when the request is
      complete.

      See the "sendRequest" method above for a description of the parameters.
    */
    get(url, headers, callback) {
      return this.sendRequest(url, 'get', headers, null, callback);
    }

    /**
      Send an HTTP DELETE request to the given URL with the given headers and
      body. The given callback receives an error and a response when the
      request is complete.

      See the "sendRequest" method above for a description of the parameters.
    */
    delete(url, headers, body, callback) {
      return this.sendRequest(url, 'delete', headers, body, callback);
    }

    /**
      Send an HTTP POST request to the given URL with the given headers and
      body. The given callback receives an error and a response when the
      request is complete.

      See the "sendRequest" method above for a description of the parameters.
    */
    post(url, headers, body, callback) {
      return this.sendRequest(url, 'post', headers, body, callback);
    }

    /**
      Send an HTTP PUT request to the given URL with the given headers and
      body. The given callback receives an error and a response when the
      request is complete.

      See the "sendRequest" method above for a description of the parameters.
    */
    put(url, headers, body, callback) {
      return this.sendRequest(url, 'put', headers, body, callback);
    }

    /**
      Send an HTTP PATCH request to the given URL with the given headers and
      body. The given callback receives an error and a response when the
      request is complete.

      See the "sendRequest" method above for a description of the parameters.
    */
    patch(url, headers, body, callback) {
      return this.sendRequest(url, 'patch', headers, body, callback);
    }

    /**
      Discharge the given macaroon. Acquire any third party discharges.

      @param {Object} macaroon The decoded macaroon to be discharged.
      @param {Function} onSuccess The function to be called if the
        discharge succeeds. It receives the resulting macaroons array.
      @param {Function} onFailure The function to be called if the
        discharge fails. It receives an error message.
    */
    discharge(macaroon, onSuccess, onFailure) {
      try {
        macaroonlib.dischargeMacaroon(
          macaroonlib.generateMacaroons(macaroon),
          this._getThirdPartyDischarge.bind(this),
          discharges => {
            onSuccess(discharges.map(m => m.exportAsObject()));
          },
          onFailure
        );
      } catch (exc) {
        onFailure(`discharge failed: ${exc.message}`);
      }
    }

    /**
      Wrap the given callback function so that "discharge required" and
      "interaction required" errors in the response are internally handled.

      See the "sendRequest" method above for a description of the parameters.

      @return {Function} A callable accepting an HTTP response.
    */
    _wrapCallback(url, method, headers, body, callback) {
      return response => {
        // This is the bakery exit point when everything goes well there is
        // nothing to be done further.
        const exitSuccessfully = resp => {
          callback(null, resp);
          this._onSuccess();
        };
        const error = this._getError(response.target);
        if (!error) {
          // No discharge or interaction required.
          exitSuccessfully(response);
          return;
        }
        // At this point we must either discharge or make the user interact.
        let onSuccess;
        const onFailure = msg => {
          callback(msg, null);
        };
        switch (error.Code) {
          case ERR_INTERACTION_REQUIRED:
            onSuccess = resp => {
              // Once the interaction is done, store any resulting macaroons
              // and then exit successfully. From now on, the stored macaroons
              // will be reused and included in all requests to the same URL.
              const jsonResponse = JSON.parse(resp.target.responseText);
              const macaroons =
                macaroonlib.generateMacaroons(jsonResponse.Macaroon);
              this.storage.set(url, serialize(macaroons), () => {
                if (jsonResponse.DischargeToken) {
                  const token = serialize(jsonResponse.DischargeToken);
                  this.storage.set('identity', token, () => {
                    exitSuccessfully(resp);
                  });
                  return;
                }
                exitSuccessfully(resp);
              });
            };
            const info = error.Info;
            this._interact(info.VisitURL, info.WaitURL, onSuccess, onFailure);
            break;
          case ERR_DISCHARGE_REQUIRED:
            // In the case discharge has been disabled in this bakery instance
            // (see the withoutDischarge method above) just return here.
            if (this._dischargeDisabled) {
              callback('discharge required but disabled', response);
              return;
            }
            onSuccess = macaroons => {
              // Once the discharge is acquired, store any resulting macaroons
              // and then retry the original requests again. This time the
              // resulting macaroons will be properly included in the request
              // header.
              this.storage.set(url, serialize(macaroons), () => {
                this.sendRequest(url, method, headers, body, callback);
              });
            };
            this.discharge(error.Info.Macaroon, onSuccess, onFailure);
            break;
          default:
            // An unexpected error has been encountered.
            callback(this._getErrorMessage(error), null);
            break;
        }
      };
    }

    /**
      Obtain a discharge macaroon for the given third party location.

      @param {String} location The origin location.
      @param {String} thirdPartyLocation The third party location where to
        discharge.
      @param {String} condition The caveat to be discharged.
      @param {Function} onSuccess A function that will be called with the
        discharge macaroon when the acquisition is successfully completed.
      @param {Function} onFailure A function that will be called with an error
        message when the third party discharge fails.
    */
    _getThirdPartyDischarge(
      location, thirdPartyLocation, condition, onSuccess, onFailure) {
      const url = thirdPartyLocation + '/discharge';
      const headers = {'Content-Type': WWW_FORM_CONTENT_TYPE};
      const encodedCondition = encodeURIComponent(condition);
      const encodedLocation = encodeURIComponent(location);
      const body = `id=${encodedCondition}&location=${encodedLocation}`;
      const callback = (err, response) => {
        if (err) {
          onFailure(err);
          return;
        }
        const jsonResponse = JSON.parse(response.target.responseText);
        const macaroons = macaroonlib.generateMacaroons(jsonResponse.Macaroon);
        onSuccess(macaroons);
      };
      // Use the bakery itself to get the third party discharge, so that we
      // support recursive discharge requests.
      this.post(url, headers, body, callback);
    }

    /**
      Interact to be able to acquire authentication macaroons.

      @param {String} visitURL The URL that must be visited to authenticate.
      @param {String} waitURL The URL where to wait for the authentication to
        be completed, and that will eventually provide the authentication
        macaroons and the discharge token.
      @param {Function} onSuccess The function that will be called with the
        macaroon when the acquisition succeeds.
      @param {Function} onFailure The function that will be called with an
        error string when the acquisition fails.
    */
    _interact(visitURL, waitURL, onSuccess, onFailure) {
      this._visitPage(visitURL);
      const generateRequest = callback => {
        const headers = {'Content-Type': JSON_CONTENT_TYPE};
        const username = null;
        const password = null;
        const withCredentials = false;
        const progressCallback = null;
        return this._client.sendGetRequest(
          waitURL, headers, username, password, withCredentials,
          progressCallback, callback);
      };
      // When performing a "wait" request for the user logging into identity
      // it is possible that they take longer than the server timeout of
      // 1 minute: when this happens the server just closes the connection.
      let retryCounter = 0;
      const retryCallback = response => {
        const target = response.target;
        if (
          target.status === 0 &&
          target.response === '' &&
          target.responseText === ''
        ) {
          // Server closed the connection, retry and increment the counter.
          if (retryCounter < 5) {
            retryCounter += 1;
            generateRequest(retryCallback);
            return;
          }
          // We have retried 5 times so fall through to call handler.
        }
        const error = this._getError(target);
        if (error) {
          // The interaction failed.
          onFailure('cannot interact: ' + this._getErrorMessage(error));
          return;
        }
        // The interaction succeeded.
        onSuccess(response);
      };
      generateRequest(retryCallback);
    }

    /**
      Return any error present in the given response.

      @param {Object} target The XHR response.target.
      @return {Object or String} The error as found in the request.
    */
    _getError(target) {
      // Check bakery statuses.
      if (
        target.status !== STATUS_UNAUTHORIZED &&
        target.status !== STATUS_PROXY_AUTH_REQUIRED
      ) {
        return null;
      }
      // Bakery protocol errors always have JSON payloads.
      if (target.getResponseHeader('Content-Type') !== JSON_CONTENT_TYPE) {
        return null;
      }
      // At this point it should be possible to decode the error response.
      let error;
      try {
        error = JSON.parse(target.responseText);
      } catch(err) {
        return 'cannot parse error response';
      }
      return error;
    }

    /**
      Try to parse the given JSON decoded response in order to retrieve a
      human friendly error.

      @param {Object} jsonResponse The JSON decoded response text.
      @return {String} The error message.
    */
    _getErrorMessage(jsonResponse) {
      return (
        jsonResponse.Message ||
        jsonResponse.message ||
        jsonResponse.Error ||
        jsonResponse.error ||
        'unexpected error: ' + JSON.stringify(jsonResponse)
      );
    }

  };

  /**
    A storage for the macaroon bakery.

    The storage is used to persist macaroons.
  */
  const BakeryStorage = class BakeryStorage {

    /**
      Initialize a bakery storage with the given underlaying store and params.

      @param {Object} store A store object implement the following interface:
        - getItem(key) -> value;
        - setItem(key, value);
        - clear().
      @param {Object} params Optional parameters including:
        - initial: a map of key/value pairs that must be initially included in
          the storage;
        - services: a map of service names (like "charmstore" or "terms") to
          the base URL of their corresponding API endpoints. This is used to
          simplify and reduce the URLs passed as keys to the storage;
        - charmstoreCookieSetter: a function that can be used to register
          macaroons to the charm store service. The function accepts a value
          and a callback, which receives an error and a response.
    */
    constructor(store, params) {
      this._store = store;
      this._services = params.services || {};
      this._charmstoreCookieSetter = params.charmstoreCookieSetter || null;
      const initial = params.initial || {};
      Object.keys(initial).forEach(key => {
        const value = initial[key];
        if (value) {
          this.set(key, value);
        }
      });
    }

    /**
      Retrieve and return the value for the provided key.

      @param {String} key The storage key, usually a URL.
      @return {String} The corresponding value, usually a serialized macaroon.
    */
    get(key) {
      key = this._getKey(key);
      return this._store.getItem(key);
    }

    /**
      Store the given value in the given storage key.

      Call the callback when done.

      @param {String} key The storage key, usually a URL.
      @param {String} value The value, usually a serialized macaroon.
      @param {Function} callback A function called without arguments when the
        value is properly stored.
    */
    set(key, value, callback) {
      key = this._getKey(key);
      this._store.setItem(key, value);
      if (key === 'charmstore' && this._charmstoreCookieSetter) {
        // Set the cookie so that images can be retrieved from the charm store.
        const macaroons = deserialize(value);
        this._charmstoreCookieSetter(macaroons, (err, resp) => {
          if (err) {
            console.error('cannot set charm store cookie:', err);
          }
          callback();
        });
        return;
      }
      callback();
    }

    /**
      Remove all key/value pairs from the storage.
    */
    clear() {
      this._store.clear();
    }

    /**
      Turn the given key (usually a URL) into a more friendly service name,
      when possible. This also means that different endpoints of the same
      service are reduced to the same service name key, which is ok given that
      all our services use the same macaroon root id for all endpoints.

      If the given key is not a URL, then return it untouched, so that it is
      still possible to set arbitrary keys in the storage. For instance, it is
      surely useful to be able to set or retrieve a service macaroon by using
      its corresponding service name (and not necessarily a URL).

      @param {String} key The original key.
      @return {String} A possibly simplified/reduced key.
    */
    _getKey(key) {
      // This is an ugly special case, required because it is possible to
      // provide an initial discharge token from outside the GUI, and because
      // the GUI doesn't (and shouldn't) know the identity service location.
      // So here we are just guessing how an identity endpoint URL should be,
      // but there is surely area of improvement.
      if (key.indexOf('/identity/') !== -1) {
        return 'identity';
      }
      let result = key;
      const services = this._services;
      Object.keys(services).forEach(service => {
        const baseURL = services[service];
        if (key.indexOf(baseURL) === 0) {
          result = service;
        }
      });
      return result;
    }

  };

  jujulib.Bakery = Bakery;
  jujulib.BakeryStorage = BakeryStorage;

}((module && module.exports) ? module.exports : this));
