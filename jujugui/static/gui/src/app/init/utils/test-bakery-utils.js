/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const jaaslib = require('jaaslib');

const bakeryUtils = jaaslib.bakery;
const newBakery = require('./bakery-utils');

describe('bakery utils', () => {
  function createNewBakery(
    config,
    user,
    stateGetter,
    cookieSetter,
    webHandler) {
    return newBakery(
      config || {},
      user || {},
      stateGetter || {},
      cookieSetter || sinon.stub(),
      webHandler || {}
    );
  }

  it('returns a new bakery instance', () => {
    const bakery = createNewBakery();

    assert.instanceOf(bakery, bakeryUtils.Bakery);
  });

  it('returns a non interactive visit instance', () => {
    const bakery = createNewBakery();

    assert.isDefined(bakery._visitPage.name);
    assert.equal(bakery._visitPage.name, 'nonInteractiveVisit');
  });

  it('returns an interactive visit instance', () => {
    const bakery = createNewBakery(
      {
        interactiveLogin: true
      });

    assert.isDefined(bakery._visitPage.name);
    assert.equal(bakery._visitPage.name, 'interactiveVisit');
  });
});
