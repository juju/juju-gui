/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const GenericButton = require('../../generic-button/generic-button');
const ProfileCharmstoreLogin = require('./charmstore-login');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('ProfileCharmstoreLogin ', function() {
  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <ProfileCharmstoreLogin
        addNotification={options.addNotification || sinon.stub()}
        bakery={options.bakery || {}}
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          getMacaroon: options.getMacaroon || sinon.stub()
        }}
        storeUser={options.storeUser || sinon.stub()}
        type={options.type || 'charms'} />, true);
  }

  it('can render for a charm', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-charmstore-login">
        <div className="profile-charmstore-login__button">
          <GenericButton
            action={sinon.stub()}
            type="neutral">
            Login to the charm store
          </GenericButton>
        </div>
        <h2 className="profile__title">
          No {'charms'}
        </h2>
        <p className="profile-charmstore-login__notice">
          You must&nbsp;
          <span className="link"
            role="button"
            tabIndex="0">
            login
          </span>&nbsp;
          to the&nbsp;
          <span className="link"
            role="button"
            tabIndex="0">
            charm store
          </span>&nbsp;
          using an Ubuntu One identity (USSO) to view your charms and bundles.
        </p>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render for a bundle', () => {
    const renderer = renderComponent({type: 'bundles'});
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-charmstore-login">
        <div className="profile-charmstore-login__button">
          <GenericButton
            action={sinon.stub()}
            type="neutral">
            Login to the charm store
          </GenericButton>
        </div>
        <h2 className="profile__title">
          No {'bundles'}
        </h2>
        <p className="profile-charmstore-login__notice">
          You must&nbsp;
          <span className="link"
            role="button"
            tabIndex="0">
            login
          </span>&nbsp;
          to the&nbsp;
          <span className="link"
            role="button"
            tabIndex="0">
            charm store
          </span>&nbsp;
          using an Ubuntu One identity (USSO) to view your charms and bundles.
        </p>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can log in', () => {
    const bakery = {
      storage: {
        get: sinon.stub().withArgs('charmstore').returns(null)
      }
    };
    const getMacaroon = sinon.stub().callsArgWith(0, null, 'new macaroon');
    const storeUser = sinon.stub();
    const renderer = renderComponent({
      bakery,
      getMacaroon,
      storeUser
    });
    const output = renderer.getRenderOutput();
    output.props.children[0].props.children.props.action();
    assert.equal(getMacaroon.callCount, 1);
    assert.equal(storeUser.callCount, 1);
  });

  it('can log in when there is an existing macaroon', () => {
    const bakery = {
      storage: {
        get: sinon.stub().withArgs('charmstore').returns('fake macaroon')
      }
    };
    const getMacaroon = sinon.stub();
    const storeUser = sinon.stub();
    const renderer = renderComponent({
      bakery,
      getMacaroon,
      storeUser
    });
    const output = renderer.getRenderOutput();
    output.props.children[0].props.children.props.action();
    assert.equal(getMacaroon.callCount, 0);
    assert.equal(storeUser.callCount, 1);
    assert.equal(bakery.storage.get.callCount, 1);
  });

  it('can handle errors when trying to log in', () => {
    const addNotification = sinon.stub();
    const bakery = {
      storage: {
        get: sinon.stub().withArgs('charmstore').returns(null)
      }
    };
    const getMacaroon = sinon.stub().callsArgWith(0, 'Uh oh!', null);
    const storeUser = sinon.stub();
    const renderer = renderComponent({
      addNotification,
      bakery,
      getMacaroon,
      storeUser
    });
    const output = renderer.getRenderOutput();
    output.props.children[0].props.children.props.action();
    assert.equal(getMacaroon.callCount, 1);
    assert.equal(storeUser.callCount, 0);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Cannot retrieve charm store macaroon',
      message: 'Cannot retrieve charm store macaroon: Uh oh!',
      level: 'error'
    });
  });
});
