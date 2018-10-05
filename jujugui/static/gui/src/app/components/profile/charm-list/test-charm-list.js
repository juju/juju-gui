/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const ProfileCharmList = require('./charm-list');

describe('Profile Charm List', function() {
  const rawCharmData = `[{
    "id": "cs:~hatch/precise/failtester-7",
    "series": ["precise"],
    "perm": {
      "read": ["everyone", "hatch"],
      "write": ["hatch"]
    },
    "name": "failtester"
  }, {
    "id": "cs:~hatch/xenial/ghost-3",
    "series": ["xenial"],
    "perm": {
      "read": ["everyone", "hatch"],
      "write": ["hatch"]
    },
    "tags": ["misc", "ops"],
    "name": "ghost"
  }, {
    "id": "cs:~hatch/privghost-1",
    "series": ["xenial", "trusty"],
    "perm": {
      "read": ["hatch"],
      "write": ["hatch"]
    },
    "name": "privghost"
  }]`;
  const charms = JSON.parse(rawCharmData);

  const renderComponent = (options = {}) => {
    const charmstoreList = (user, cb) => {
      assert.equal(user, 'hatch@external');
      cb(null, charms);
    };
    let isActiveUsersProfile = true;
    if (options.isActiveUsersProfile !== undefined) {
      isActiveUsersProfile = options.isActiveUsersProfile;
    }
    return enzyme.shallow(
      <ProfileCharmList
        acl={options.acl || acl}
        addNotification={sinon.stub()}
        addToModel={options.addToModel || sinon.stub()}
        bakery={{}}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          getMacaroon: options.getMacaroon || sinon.stub(),
          list: options.charmstoreList || charmstoreList,
          url: '/charmstore'
        }}
        generatePath={options.generatePath || sinon.stub()}
        generatePermissions={options.generatePermissions || sinon.stub()}
        getModelName={options.getModelName || sinon.stub()}
        handleDeploy={options.handleDeploy || sinon.stub()}
        isActiveUsersProfile={isActiveUsersProfile}
        storeUser={options.storeUser || sinon.stub()}
        user={
          options.user !== undefined ? options.user : 'hatch@external'} />, true);
  };
  let acl;

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
  });

  it('can render', () => {
    const wrapper = renderComponent({gisf: true});
    expect(wrapper).toMatchSnapshot();
  });

  it('can render when there are no charms', () => {
    const wrapper = renderComponent({
      charmstoreList: sinon.stub().callsArgWith(1, null, null)
    });
    const expected = (
      <p className="profile-charm-list__onboarding">
        Learn about&nbsp;
        <a
          href="https://jujucharms.com/docs/stable/developer-getting-started"
          target="_blank">
          writing your own charm
        </a>.
      </p>);
    assert.equal(wrapper.find('.profile__title-count').html().includes('(0)'), true);
    assert.compareJSX(wrapper.find('.profile-charm-list__onboarding'), expected);
  });

  it('can display a login message', () => {
    const wrapper = renderComponent({
      charmstoreList: sinon.stub().callsArgWith(1, null, null),
      user: null
    });
    assert.equal(wrapper.find('ProfileCharmstoreLogin').length, 1);
  });

  // it('updates the header if it is not your profile', () => {
  //   const wrapper = renderComponent({isActiveUsersProfile: false});
  //   assert.equal(
  //     wrapper.find('.profile__title').html().includes('Their charms'), true);
  // });

  it('shows the spinner when loading', () => {
    const wrapper = renderComponent({
      charmstoreList: sinon.stub()
    });
    assert.equal(wrapper.find('Spinner').length, 1);
  });
});
