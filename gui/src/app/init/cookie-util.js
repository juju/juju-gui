/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Notification = require('../components/notification/notification');

/**
  Check that the user accepted cookie usage, and if not display a cookie
  usage warning.
  @param {Object} doc Reference to the window.document.
  @param {Object} state Reference to the app state.
*/
function check(doc, state) {
  if (shouldShowNotification(doc)) {
    return _renderNotification(doc, state);
  } else {
    return null;
  }
}

/**
  Check whether the cookie notice should be visible.
  @param {Object} doc Reference to the window.document.
  @returns {Boolean} Whether the notification should be showed.
*/
function shouldShowNotification(doc) {
  return _getCookie(doc, '_cookies_accepted') !== 'true' &&
    !localStorage.getItem('disable-cookie');
}

/**
  Close the cookie usage warning and set a cookie to denote user agreement.
  @param {Object} doc Reference to the window.document.
  @param {Object} state Reference to the app state.
*/
function close(doc, state) {
  _setCookie(doc, '_cookies_accepted', 'true', new Date('January 12, 2025'));
  // Dispatch the state so that the check is done again and the notice no longer displayed.
  state.dispatch();
}

/**
  Get the value for a cookie.
  @param {Object} doc Reference to the window.document.
  @param cookie {String} The name of the cookie.
  @param {Object} document Reference to the window.document.
  @return {String} The value of the cookie.
*/
function _getCookie(doc, cookie) {
  let value = null;
  doc.cookie.split(';').some(pair => {
    const parts = pair.split('=');
    if (parts[0].trim() === cookie) {
      value = parts.length == 2 && parts[1].trim() || '';
      return true;
    }
  });
  return value;
}

/**
  Set the value for a cookie.
  @param {Object} doc Reference to the window.document.
  @param cookie {String} The name of the cookie.
  @param value {String} The value of the cookie.
  @param expiry {String} The expiry for the cookie.
*/
function _setCookie(doc, cookie, value, expiry) {
  const pairs = [`${cookie}=${value}`];
  if (expiry) {
    pairs.push(`expiry=${expiry}`);
  }
  doc.cookie = pairs.join('; ');
}

/**
  Render the notification.
  @param {Object} doc Reference to the window.document.
  @param {Object} state Reference to the app state.
*/
function _renderNotification(doc, state) {
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
      dismiss={close.bind(this, doc, state)}
      extraClasses="p-notification--center-bottom" />);
}

module.exports = {check, close, shouldShowNotification};
