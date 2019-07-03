/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const cookie = require('js-cookie');

const cookieUtil = require('./cookie-util');
const Notification = require('../components/notification/notification');

describe('CookieUtil', () => {
  let state;

  beforeEach(() => {
    state = {
      dispatch: sinon.stub()
    };
  });

  afterEach(() => {
    localStorage.removeItem('disable-cookie');
    cookie.remove('_cookies_accepted');
  });

  it('calling check returns the notification', () => {
    // Wrap the output so we can check what is returned, not render the containing
    // Notification component.
    const wrapper = enzyme.shallow(
      <div>
        {cookieUtil.check(state)}
      </div>);
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
    const expected = (
      <Notification
        content={content}
        dismiss={wrapper.find('Notification').prop('dismiss')}
        extraClasses="p-notification--center-bottom" />);
    assert.compareJSX(wrapper.find('Notification'), expected);
  });

  it('closing the banner sets the cookie', () => {
    assert.equal(cookie.get('_cookies_accepted'), undefined);
    cookieUtil.close(state);
    assert.equal(cookie.get('_cookies_accepted'), 'true');
  });

  it('the cookie prevents the node from being made visible', () => {
    cookie.set('_cookies_accepted', 'true');
    assert.strictEqual(cookieUtil.check(state), null);
  });

  it('the custom setting prevents the node from being made visible', () => {
    localStorage.setItem('disable-cookie', 'true');
    cookieUtil.check(state);
    assert.strictEqual(cookieUtil.check(state), null);
  });
});
