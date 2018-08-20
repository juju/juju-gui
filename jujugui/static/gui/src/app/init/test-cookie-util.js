/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const cookieUtil = require('./cookie-util');
const Notification = require('../components/notification/notification');

describe('CookieUtil', () => {
  let fakeDocument, state;

  beforeEach(() => {
    fakeDocument = {
      cookie: ''
    };
    state = {
      dispatch: sinon.stub()
    };
  });

  afterEach(() => {
    localStorage.removeItem('disable-cookie');
  });

  it('calling check returns the notification', () => {
    // Wrap the output so we can check what is returned, not render the containing
    // Notification component.
    const wrapper = enzyme.shallow(
      <div>
        {cookieUtil.check(fakeDocument, state)}
      </div>);
    const content = (
      <span>
        We use cookies to improve your experience. By your continued use
        of this application you accept such use. To change your settings
        please&nbsp;
        <a href="http://www.ubuntu.com/privacy-policy#cookies"
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
    const date = new Date('January 12, 2025');
    assert.equal(fakeDocument.cookie, '');
    cookieUtil.close(fakeDocument, state);
    assert.equal(fakeDocument.cookie, `_cookies_accepted=true; expiry=${date}`);
  });

  it('the cookie prevents the node from being made visible', () => {
    const date = new Date('January 12, 2025');
    fakeDocument.cookie = `_cookies_accepted=true; expiry=${date}`;
    assert.strictEqual(cookieUtil.check(fakeDocument, state), null);
  });

  it('the custom setting prevents the node from being made visible', () => {
    localStorage.setItem('disable-cookie', 'true');
    cookieUtil.check(fakeDocument);
    assert.strictEqual(cookieUtil.check(fakeDocument, state), null);
  });
});
