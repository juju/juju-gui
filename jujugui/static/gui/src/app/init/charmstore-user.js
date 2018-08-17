/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

/**
  A mixin for the JujuGUI class.
  Temporarily holds the Charmstore user storage methods. This logic should
  either become part of the charmstore instance or part of the user instance.
*/
const CharmstoreUserMixin = superclass => class extends superclass {

  /**
    Takes a macaroon and stores the user info (if any) in the app.
    @param {String} service The service the macaroon comes from.
   */
  storeUser(service) {
    const callback = (error, auth) => {
      if (error) {
        const message = 'Unable to query user information';
        console.error(message, error);
        this.db.notifications.add({
          title: message,
          message: `${message}: ${error}`,
          level: 'error'
        });
        return;
      }
      if (auth) {
        this.users[service] = auth;
      }
      //  Dispatch to force a state update so the breadcrumbs/profile get updated.
      this.state.dispatch();
    };
    if (service === 'charmstore') {
      this.charmstore.whoami(callback);
    } else {
      console.error('Unrecognized service', service);
    }
  }
  /**
    Get the user info for the supplied service.
    @param {String} service The service the macaroon comes from.
    @return {Object} The user information.
  */
  getUser(service) {
    return this.users[service];
  }
  /**
    Clears the user info for the supplied service.
    @param {String} service The service the macaroon comes from.
  */
  clearUser(service) {
    delete this.users[service];
  }
};

const create = function() {
  return {};
};

module.exports = {create, CharmstoreUserMixin};
