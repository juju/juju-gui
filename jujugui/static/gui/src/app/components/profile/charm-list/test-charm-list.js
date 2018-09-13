/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const BasicTable = require('../../shared/basic-table/basic-table');
const ProfileCharmList = require('./charm-list');
const ProfileExpandedContent = require('../expanded-content/expanded-content');

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
        getModelName={options.getModelName || sinon.stub()}
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
    const wrapper = renderComponent();
    const expected = (
      <div className="profile-charm-list">
        <div>
          <h2 className="profile__title">
            {'My'} charms
            <span className="profile__title-count">
              ({3})
            </span>
          </h2>
          <BasicTable
            headerClasses={['profile__entity-table-header-row']}
            headerColumnClasses={['profile__entity-table-header-column']}
            headers={[{
              content: 'Name',
              columnSize: 6
            }, {
              content: 'Series',
              columnSize: 3
            }, {
              content: 'Release',
              columnSize: 3
            }]}
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={[{
              columns: [{
                content: (
                  <div>
                    <div className="profile-charm-list__item">
                      <div>
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/precise/failtester-7/icon.svg"
                          title="failtester" />
                      </div>
                      <div>
                        <a href="/gui/u/hatch/failtester/precise/7"
                          onClick={sinon.stub()}>
                          failtester
                        </a>
                      </div>
                    </div>
                  </div>),
                columnSize: 6
              }, {
                content: 'precise',
                columnSize: 3
              }, {
                content: '#7',
                columnSize: 3
              }],
              expandedContent: (
                <ProfileExpandedContent
                  acl={acl}
                  addToModel={sinon.stub()}
                  changeState={sinon.stub()}
                  entity={charms[0]}
                  generatePath={sinon.stub()}
                  getModelName={sinon.stub()}
                  topRow={(
                    <div>
                      <div className="six-col profile-expanded-content__top-row">
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/precise/failtester-7/icon.svg"
                          title="failtester" />
                        <a href="/gui/u/hatch/failtester/precise/7"
                          onClick={sinon.stub()}>
                          failtester
                        </a>
                      </div>
                      <div className="three-col profile-expanded-content__top-row">
                        precise
                      </div>
                      <div className="three-col last-col profile-expanded-content__top-row">
                        #7
                      </div>
                    </div>)} />),
              extraData: 'failtester',
              key: 'cs:~hatch/precise/failtester-7'
            }, {
              columns: [{
                content: (
                  <div>
                    <div className="profile-charm-list__item">
                      <div>
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/xenial/ghost-3/icon.svg"
                          title="ghost" />
                      </div>
                      <div>
                        <a href="/gui/u/hatch/ghost/xenial/3"
                          onClick={sinon.stub()}>
                          ghost
                        </a>
                        <ul className="profile-charm-list__tags">
                          <li className="link profile-charm-list__tag"
                            onClick={sinon.stub()}
                            role="button"
                            tabIndex="0">
                            misc
                          </li>
                          <li className="link profile-charm-list__tag"
                            onClick={sinon.stub()}
                            role="button"
                            tabIndex="0">
                            ops
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>),
                columnSize: 6
              }, {
                content: 'xenial',
                columnSize: 3
              }, {
                content: '#3',
                columnSize: 3
              }],
              expandedContent: (
                <ProfileExpandedContent
                  acl={acl}
                  addToModel={sinon.stub()}
                  changeState={sinon.stub()}
                  entity={charms[1]}
                  generatePath={sinon.stub()}
                  getModelName={sinon.stub()}
                  topRow={(
                    <div>
                      <div className="six-col profile-expanded-content__top-row">
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/xenial/ghost-3/icon.svg"
                          title="ghost" />
                        <a href="/gui/u/hatch/ghost/xenial/3"
                          onClick={sinon.stub()}>
                          ghost
                        </a>
                      </div>
                      <div className="three-col profile-expanded-content__top-row">
                        xenial
                      </div>
                      <div className="three-col last-col profile-expanded-content__top-row">
                        #3
                      </div>
                    </div>)} />),
              extraData: 'ghost',
              key: 'cs:~hatch/xenial/ghost-3'
            }, {
              columns: [{
                content: (
                  <div>
                    <div className="profile-charm-list__item">
                      <div>
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/privghost-1/icon.svg"
                          title="privghost" />
                      </div>
                      <div>
                        <a href="/gui/u/hatch/privghost/1"
                          onClick={sinon.stub()}>
                          privghost
                        </a>
                      </div>
                    </div>
                  </div>),
                columnSize: 6
              }, {
                content: 'xenial, trusty',
                columnSize: 3
              }, {
                content: '#1',
                columnSize: 3
              }],
              expandedContent: (
                <ProfileExpandedContent
                  acl={acl}
                  addToModel={sinon.stub()}
                  changeState={sinon.stub()}
                  entity={charms[2]}
                  generatePath={sinon.stub()}
                  getModelName={sinon.stub()}
                  topRow={(
                    <div>
                      <div className="six-col profile-expanded-content__top-row">
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/privghost-1/icon.svg"
                          title="privghost" />
                        <a href="/gui/u/hatch/privghost/1"
                          onClick={sinon.stub()}>
                          privghost
                        </a>
                      </div>
                      <div className="three-col profile-expanded-content__top-row">
                        xenial, trusty
                      </div>
                      <div className="three-col last-col profile-expanded-content__top-row">
                        #1
                      </div>
                    </div>)} />),
              extraData: 'privghost',
              key: 'cs:~hatch/privghost-1'
            }]}
            sort={wrapper.find('BasicTable').prop('sort')} />
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render when there are no charms', () => {
    const wrapper = renderComponent({
      charmstoreList: sinon.stub().callsArgWith(1, null, null)
    });
    const expected = (
      <p className="profile-charm-list__onboarding">
        Learn about&nbsp;
        <a href="https://jujucharms.com/docs/stable/developer-getting-started"
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

  it('updates the header if it is not your profile', () => {
    const wrapper = renderComponent({isActiveUsersProfile: false});
    assert.equal(
      wrapper.find('.profile__title').html().includes('Their charms'), true);
  });

  it('shows the spinner when loading', () => {
    const wrapper = renderComponent({
      charmstoreList: sinon.stub()
    });
    assert.equal(wrapper.find('Spinner').length, 1);
  });
});
