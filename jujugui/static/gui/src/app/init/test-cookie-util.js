/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const cookieUtil = require('./cookie-util');

describe('CookieUtil', () => {

  let container = null;
  let fakeDocument = null;

  function createContainer() {
    const container = document.createElement('div');
    container.setAttribute('id', 'cookie-container');
    document.body.appendChild(container);
    return container;
  }

  function removeContainer(container) {
    container.remove();
  }

  beforeEach(() => {
    container = createContainer();
    fakeDocument = {
      cookie: '',
      getElementById: document.getElementById.bind(document)
    };
  });

  afterEach(() => {
    removeContainer(container);
    container = null;
    fakeDocument = null;
    localStorage.removeItem('disable-cookie');
  });

  it('calling check makes the node visible', () => {
    assert.equal(container.children.length > 0, false);
    cookieUtil.check(document);
    assert.equal(container.children.length > 0, true);
  });

  it('closing the banner sets the cookie', () => {
    const date = new Date('January 12, 2025');
    assert.equal(fakeDocument.cookie, '');
    cookieUtil.close(fakeDocument);
    assert.equal(fakeDocument.cookie, `_cookies_accepted=true; expiry=${date}`);
  });

  it('the cookie prevents the node from being made visible', () => {
    const date = new Date('January 12, 2025');
    fakeDocument.cookie = `_cookies_accepted=true; expiry=${date}`;
    cookieUtil.check(fakeDocument);
    assert.equal(container.children.length, 0);
  });

  it('the custom setting prevents the node from being made visible', () => {
    localStorage.setItem('disable-cookie', 'true');
    cookieUtil.check(fakeDocument);
    assert.equal(container.children.length, 0);
  });
});
