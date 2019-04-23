/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const cookie = require('js-cookie');

const Notification = require('../components/notification/notification');

/**
  Check that the user accepted cookie usage, and if not display a cookie
  usage warning.
  @param {Object} doc Reference to the window.document.
  @param {Object} state Reference to the app state.
*/
function check(state) {
  if (shouldShowNotification()) {
    return _renderNotification(state);
  } else {
    return null;
  }
}

/**
  Check whether the cookie notice should be visible.
  @returns {Boolean} Whether the notification should be showed.
*/
function shouldShowNotification() {
  return cookie.get('_cookies_accepted') !== 'true' &&
    !localStorage.getItem('disable-cookie');
}

/**
  Close the cookie usage warning and set a cookie to denote user agreement.
  @param {Object} state Reference to the app state.
*/
function close(state) {
  cookie.set('_cookies_accepted', true, {expiry: new Date('January 12, 2025')});
  // Dispatch the state so that the check is done again and the notice no longer displayed.
  state.dispatch();
}

/**
  Render the notification.
  @param {Object} state Reference to the app state.
*/
function _renderNotification(state) {
  const content = (
    <span>
      We use cookies to improve your experience. By your continued use
      of this application you accept such use. To change your settings
      please&nbsp;
      <a
        href="http://www.ubuntu.com/privacy-policy#cookies"
        target="_blank">
        see our policy
      </a>
    </span>);
  return (
    <Notification
      content={content}
      dismiss={close.bind(this, state)}
      extraClasses="p-notification--center-bottom" />);
}

module.exports = {check, close, shouldShowNotification};
