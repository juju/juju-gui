/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

/**
  Helper functions for creating and working with the bakery.
*/
const React = require('react');
const ReactDOM = require('react-dom');

const Notification = require('../../components/notification/notification');

/**
  Implement the bakery storage store interface by using the user local
  storage in order to persist macaroons.
*/
const UserStore = class UserStore {

  /**
    Creates the user store.

    @param {Object} user An instance of "jujulib.User".
  */
  constructor(user) {
    this._user = user;
  }

  getItem(key) {
    return this._user.getMacaroon(key);
  }

  setItem(key, value) {
    this._user.setMacaroon(key, value);
  }

  clear() {
    this._user.clearMacaroons();
  }

};

/**
  Create and return a new bakery instance.

  @param {Object} config The app configuration.
  @param {Object} user The app user as an instance of "jujulib.User".
  @param {Object} stateGetter A callable that can be called to retrieve the
    current state of the GUI.
  @param {Function} cookieSetter A function that can be used to send
    macaroons to the charm store so that they are stored as cookies.
  @param {Object} webHandler The HTTP client that will be used by the bakery.
  @return {Object} A bakery instance ready to be used.
*/
const newBakery = (config, user, stateGetter, cookieSetter, webHandler) => {
  // Use the user object to persist macaroons.
  const userStore = new UserStore(user);
  const storage = new jujulib.BakeryStorage(userStore, {
    charmstoreCookieSetter: cookieSetter,
    // Some initial macaroons may be provided in the GUI configuration.
    initial: {
      charmstore: config.charmstoreMacaroons,
      identity: config.dischargeToken
    },
    // Set the services so that it's possible to get human readable keys from
    // service URLs.
    services: {
      charmstore: config.charmstoreURL,
      payment: config.paymentURL,
      plans: config.plansURL,
      terms: config.termsURL
    }
  });
  const interactiveVisit = error => {
    // Add to the page a notification about accepting the pop up window
    // for logging into USSO.
    const url = error.Info.VisitURL;
    const holder = document.getElementById('login-notification');
    const content = (
      <span>
        To proceed with the authentication, please accept the pop up
      window or&nbsp;
        <a href={url} target="_blank">click here</a>.
      </span>);
    let dismiss = null;
    if (stateGetter().root !== 'login') {
      dismiss = () => {
        ReactDOM.unmountComponentAtNode(holder);
      };
    }
    ReactDOM.render(
      <Notification
        content={content}
        dismiss={dismiss}
        extraClasses="four-col"
        isBlocking={true}
      />, holder);
    // Open the pop up (default behavior for the time being).
    window.open(url, 'Login');
  };

  const nonInteractiveVisit = error => {
    const JSON_CONTENT_TYPE = 'application/json';
    const acceptHeaders = {'Accept': JSON_CONTENT_TYPE};
    const contentHeaders = {'Content-Type': JSON_CONTENT_TYPE};
    const login = function(response) {
      const method = error.jujugui;
      const data = JSON.stringify({login: config.auth});
      return webHandler.sendPostRequest(
        method, contentHeaders, data, null, null, false, null, null);
    };

    return webHandler.sendGetRequest(
      error.Info.VisitURL, acceptHeaders, null, null, false, null, login);
  };

  let params = {};

  if (config.interactiveLogin) {
    params.visitPage = interactiveVisit;
    params.onSuccess = () => {
      // Remove the pop up notification from the page.
      ReactDOM.unmountComponentAtNode(
        document.getElementById('login-notification')
      );
    };
  } else {
    params.visitPage = nonInteractiveVisit;
  }

  return new jujulib.Bakery(webHandler, storage, params);
};

module.exports = newBakery;
