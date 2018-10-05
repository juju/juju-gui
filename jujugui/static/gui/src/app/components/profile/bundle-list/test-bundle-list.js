/* Copyright (C) 2017 Canonical Ltd. */

'use strict';
const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const ProfileBundleList = require('./bundle-list');

describe('Profile Bundle List', function() {
  const rawBundleData = `[{
    "bugUrl": "example.com/bugs",
    "description": "logstash-core description",
    "homepage": "example.com/",
    "id": "cs:~lazypower/bundle/logstash-core-1",
    "perm": {
      "read": ["everyone"],
      "write": ["lazypower"]
    },
    "applications": {
      "elasticsearch": {
        "charm": "cs:~lazypower/trusty/elasticsearch"
      },
      "kibana": {
        "charm": "cs:trusty/kibana-10"
      },
      "logstash": {
        "charm": "cs:~lazypower/trusty/logstash-20"
      },
      "openjdk": {
        "charm": "cs:~kwmonroe/trusty/openjdk"
      }
    },
    "name": "logstash-core",
    "machineCount": 2,
    "unitCount": 3
  }, {
    "bugUrl": "example.com/bugs",
    "description": "swarm-core description",
    "homepage": "example.com/",
    "id": "cs:~lazypower/bundle/swarm-core-1",
    "perm": {
      "read": ["lazypower", "everyone"],
      "write": ["lazypower"]
    },
    "applications": {
      "consul": {
        "charm": "cs:~containers/trusty/consul"
      },
      "swarm": {
        "charm": "cs:~lazypower/swarm"
      }
    },
    "name": "swarm-core",
    "machineCount": 5,
    "unitCount": 5
  }]`;
  const bundles = JSON.parse(rawBundleData);
  let acl;

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
  });

  const renderComponent = (options = {}) => {
    const charmstoreList = (user, cb) => {
      assert.equal(user, 'lazypower@external');
      cb(null, bundles);
    };
    let isActiveUsersProfile = true;
    if (options.isActiveUsersProfile !== undefined) {
      isActiveUsersProfile = options.isActiveUsersProfile;
    }
    return enzyme.shallow(
      <ProfileBundleList
        acl={options.acl || acl}
        addNotification={sinon.stub()}
        addToModel={options.addToModel || sinon.stub()}
        bakery={{}}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          getDiagramURL: options.getDiagramURL || sinon.stub().returns('diagram.svg'),
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
          options.user !== undefined ? options.user : 'lazypower@external'} />);
  };

  it('can render', () => {
    const wrapper = renderComponent({gisf: true});
    expect(wrapper).toMatchSnapshot();
  });

  it('can render without any bundles', () => {
    const wrapper = renderComponent({
      charmstoreList: sinon.stub().callsArgWith(1, null, null)
    });
    const expected = (
      <p className="profile-bundle-list__onboarding">
        Learn about&nbsp;
        <a
          href="https://jujucharms.com/docs/stable/charms-bundles#creating-a-bundle"
          target="_blank">
          writing your own bundle
        </a>.
      </p>);
    assert.equal(wrapper.find('.profile__title-count').html().includes('(0)'), true);
    assert.compareJSX(wrapper.find('.profile-bundle-list__onboarding'), expected);
  });

  it('can display a login message', () => {
    const wrapper = renderComponent({
      charmstoreList: sinon.stub().callsArgWith(1, null, null),
      user: null
    });
    assert.equal(wrapper.find('ProfileCharmstoreLogin').length, 1);
  });

  it('updates the header if it is not your profile', () => {
    const wrapper = renderComponent({isActiveUsersProfile: false});
    assert.equal(
      wrapper.find('.profile__title').html().includes('Their bundles'), true);
  });

  it('can display a spinner when loading', () => {
    const wrapper = renderComponent({
      charmstoreList: sinon.stub()
    });
    assert.equal(wrapper.find('Spinner').length, 1);
  });
});
