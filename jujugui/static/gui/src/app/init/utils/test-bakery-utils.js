'use strict';

const bakery = require('macaroon-bakery');

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
    const bak = createNewBakery();
    assert.instanceOf(bak, bakery.Bakery);
  });

  it('returns a non interactive visit instance', () => {
    const bak = createNewBakery();
    assert.isDefined(bak._visitPage.name);
    assert.equal(bak._visitPage.name, 'nonInteractiveVisit');
  });

  it('returns an interactive visit instance', () => {
    const bak = createNewBakery({interactiveLogin: true});
    assert.isDefined(bak._visitPage.name);
    assert.equal(bak._visitPage.name, 'interactiveVisit');
  });
});
