/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../basic-table/basic-table');
const ProfileCharmList = require('./charm-list');
const ProfileExpandedContent = require('../expanded-content/expanded-content');
const Spinner = require('../../spinner/spinner');

const jsTestUtils = require('../../../utils/component-test-utils');

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

  function renderComponent(options={}) {
    const charmstoreList = (user, cb) => {
      assert.equal(user, 'hatch@external');
      cb(null, charms);
    };
    let isActiveUsersProfile = true;
    if (options.isActiveUsersProfile !== undefined) {
      isActiveUsersProfile = options.isActiveUsersProfile;
    }
    return jsTestUtils.shallowRender(
      <ProfileCharmList
        acl={options.acl || acl}
        addNotification={sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          list: options.charmstoreList || charmstoreList,
          url: '/charmstore'
        }}
        deployTarget={options.deployTarget || sinon.stub()}
        getModelName={options.getModelName || sinon.stub()}
        isActiveUsersProfile={isActiveUsersProfile}
        user="hatch@external" />, true);
  }
  let acl;

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
  });

  it('can render', () => {
    const renderer = renderComponent();
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-charm-list">
        <div>
          <h2 className="profile__title">
            My charms
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
                  acl={instance.props.acl}
                  changeState={sinon.stub()}
                  deployTarget={instance.props.deployTarget}
                  entity={charms[0]}
                  getModelName={instance.props.getModelName}
                  topRow={(
                    <div>
                      <div className="six-col profile-expanded-content__top-row">
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/precise/failtester-7/icon.svg"
                          title="failtester" /> failtester
                      </div>
                      <div className="three-col profile-expanded-content__top-row">
                        precise
                      </div>
                      <div className="three-col last-col profile-expanded-content__top-row">
                        #7
                      </div>
                    </div>)} />),
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
                  acl={instance.props.acl}
                  changeState={sinon.stub()}
                  deployTarget={instance.props.deployTarget}
                  entity={charms[1]}
                  getModelName={instance.props.getModelName}
                  topRow={(
                    <div>
                      <div className="six-col profile-expanded-content__top-row">
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/xenial/ghost-3/icon.svg"
                          title="ghost" /> ghost
                      </div>
                      <div className="three-col profile-expanded-content__top-row">
                        xenial
                      </div>
                      <div className="three-col last-col profile-expanded-content__top-row">
                        #3
                      </div>
                    </div>)} />),
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
                  acl={instance.props.acl}
                  changeState={sinon.stub()}
                  deployTarget={instance.props.deployTarget}
                  entity={charms[2]}
                  getModelName={instance.props.getModelName}
                  topRow={(
                    <div>
                      <div className="six-col profile-expanded-content__top-row">
                        <img className="profile-charm-list__icon"
                          src="/charmstore/~hatch/privghost-1/icon.svg"
                          title="privghost" /> privghost
                      </div>
                      <div className="three-col profile-expanded-content__top-row">
                        xenial, trusty
                      </div>
                      <div className="three-col last-col profile-expanded-content__top-row">
                        #1
                      </div>
                    </div>)} />),
              key: 'cs:~hatch/privghost-1'
            }]} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('updates the header if it is not your profile', () => {
    const renderer = renderComponent({isActiveUsersProfile: false});
    const output = renderer.getRenderOutput();
    assert.equal(output.props.children.props.children[0].props.children[0], 'Their');
  });

  it('shows the spinner when loading', () => {
    const renderer = renderComponent({
      charmstoreList: sinon.stub()
    });
    const instance = renderer.getMountedInstance();
    instance.componentWillMount();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-charm-list">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
