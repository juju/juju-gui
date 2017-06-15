/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

/**
  A mixin for the JujuGUI class.
  Temporarily holds the Charmstore user storage methods. This logic should
  either become part of the charmstore instance or part of the user instance.
*/
const CharmstoreUserMixin = (superclass) => class extends superclass {

  /**
    Takes a macaroon and stores the user info (if any) in the app.
    @param {String} service The service the macaroon comes from.
    @param {String} macaroon The base64 encoded macaroon.
    @param {Boolean} rerenderProfile Rerender the user profile.
    @param {Boolean} rerenderBreadcrumb Rerender the breadcrumb.
   */
  storeUser(service, rerenderProfile, rerenderBreadcrumb) {
    const callback = (error, auth) => {
      if (error) {
        console.error('Unable to query user information', error);
        return;
      }
      if (auth) {
        this.users[service] = auth;
        // If the profile is visible then we want to rerender it with the
        // updated username.
        if (rerenderProfile) {
          this._renderUserProfile(this.state.current, ()=>{});
        }
      }
      if (rerenderBreadcrumb) {
        this._renderBreadcrumb();
      }
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
