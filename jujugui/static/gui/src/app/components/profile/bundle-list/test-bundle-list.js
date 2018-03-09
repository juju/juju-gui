/* Copyright (C) 2017 Canonical Ltd. */

'use strict';
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../basic-table/basic-table');
const IconList = require('../../icon-list/icon-list');
const ProfileCharmstoreLogin = require('../charmstore-login/charmstore-login');
const ProfileExpandedContent = require('../expanded-content/expanded-content');
const ProfileBundleList = require('./bundle-list');
const Spinner = require('../../spinner/spinner');

const jsTestUtils = require('../../../utils/component-test-utils');

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

  function renderComponent(options={}) {
    const charmstoreList = (user, cb) => {
      assert.equal(user, 'lazypower@external');
      cb(null, bundles);
    };
    let isActiveUsersProfile = true;
    if (options.isActiveUsersProfile !== undefined) {
      isActiveUsersProfile = options.isActiveUsersProfile;
    }
    return jsTestUtils.shallowRender(
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
        getModelName={options.getModelName || sinon.stub()}
        isActiveUsersProfile={isActiveUsersProfile}
        storeUser={options.storeUser || sinon.stub()}
        user={
          options.user !== undefined ? options.user : 'lazypower@external'} />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-bundle-list">
        <div>
          <h2 className="profile__title">
            My bundles
            <span className="profile__title-count">
              ({2})
            </span>
          </h2>
          <BasicTable
            headerClasses={['profile__entity-table-header-row']}
            headerColumnClasses={['profile__entity-table-header-column']}
            headers={[{
              content: 'Name',
              columnSize: 6
            }, {
              content: 'Machines',
              columnSize: 2,
              classes: ['u-align--right']
            }, {
              content: 'Units',
              columnSize: 1,
              classes: ['u-align--right']
            }, {
              content: 'Release',
              columnSize: 3
            }]}
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={[{
              columns: [{
                content: (
                  <a
                    href="/gui/u/lazypower/logstash-core/bundle/1"
                    onClick={sinon.stub()}>
                    logstash-core
                  </a>),
                columnSize: 3
              }, {
                content: (
                  <IconList
                    applications={[{
                      displayName: 'elasticsearch',
                      iconPath: '/charmstore/~lazypower/trusty/elasticsearch/icon.svg',
                      id: 'cs:~lazypower/trusty/elasticsearch'
                    }, {
                      displayName: 'kibana',
                      iconPath: '/charmstore/trusty/kibana-10/icon.svg',
                      id: 'cs:trusty/kibana-10'
                    }, {
                      displayName: 'logstash',
                      iconPath: '/charmstore/~lazypower/trusty/logstash-20/icon.svg',
                      id: 'cs:~lazypower/trusty/logstash-20'
                    }, {
                      displayName: 'openjdk',
                      iconPath: '/charmstore/~kwmonroe/trusty/openjdk/icon.svg',
                      id: 'cs:~kwmonroe/trusty/openjdk'
                    }]}
                    changeState={sinon.stub()}
                    generatePath={sinon.stub()} />),
                columnSize: 3
              }, {
                content: 2,
                columnSize: 2,
                classes: ['u-align--right']
              }, {
                content: 3,
                columnSize: 1,
                classes: ['u-align--right']
              }, {
                content: '#1',
                columnSize: 3
              }],
              expandedContent: (
                <ProfileExpandedContent
                  acl={instance.props.acl}
                  addToModel={instance.props.addToModel}
                  changeState={sinon.stub()}
                  entity={bundles[0]}
                  generatePath={sinon.stub()}
                  getDiagramURL={sinon.stub()}
                  getModelName={instance.props.getModelName}
                  topRow={(
                    <div>
                      <div className="six-col profile-expanded-content__top-row">
                        <a
                          href="/gui/u/lazypower/logstash-core/bundle/1"
                          onClick={sinon.stub()}>
                          logstash-core
                        </a>
                      </div>
                      <div
                        className="two-col profile-expanded-content__top-row u-align--right">
                        2
                      </div>
                      <div
                        className="one-col profile-expanded-content__top-row u-align--right">
                        3
                      </div>
                      <div className="three-col last-col profile-expanded-content__top-row">
                        #1
                      </div>
                    </div>)} />),
              extraData: 'logstash-core',
              key: 'cs:~lazypower/bundle/logstash-core-1'
            }, {
              columns: [{
                content: (
                  <a
                    href="/gui/u/lazypower/swarm-core/bundle/1"
                    onClick={sinon.stub()}>
                    swarm-core
                  </a>),
                columnSize: 3
              }, {
                content: (
                  <IconList
                    applications={[{
                      displayName: 'consul',
                      iconPath: '/charmstore/~containers/trusty/consul/icon.svg',
                      id: 'cs:~containers/trusty/consul'
                    }, {
                      displayName: 'swarm',
                      iconPath: '/charmstore/~lazypower/swarm/icon.svg',
                      id: 'cs:~lazypower/swarm'
                    }]}
                    changeState={sinon.stub()}
                    generatePath={sinon.stub()} />),
                columnSize: 3
              }, {
                content: 5,
                columnSize: 2,
                classes: ['u-align--right']
              }, {
                content: 5,
                columnSize: 1,
                classes: ['u-align--right']
              }, {
                content: '#1',
                columnSize: 3
              }],
              expandedContent: (
                <ProfileExpandedContent
                  acl={instance.props.acl}
                  addToModel={instance.props.addToModel}
                  changeState={sinon.stub()}
                  entity={bundles[1]}
                  generatePath={sinon.stub()}
                  getDiagramURL={sinon.stub()}
                  getModelName={instance.props.getModelName}
                  topRow={(
                    <div>
                      <div className="six-col profile-expanded-content__top-row">
                        <a
                          href="/gui/u/lazypower/swarm-core/bundle/1"
                          onClick={sinon.stub()}>
                          swarm-core
                        </a>
                      </div>
                      <div
                        className="two-col profile-expanded-content__top-row u-align--right">
                        5
                      </div>
                      <div
                        className="one-col profile-expanded-content__top-row u-align--right">
                        5
                      </div>
                      <div className="three-col last-col profile-expanded-content__top-row">
                        #1
                      </div>
                    </div>)} />),
              extraData: 'swarm-core',
              key: 'cs:~lazypower/bundle/swarm-core-1'
            }]}
            sort={sinon.stub()} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without any bundles', () => {
    const renderer = renderComponent({
      charmstoreList: sinon.stub().callsArgWith(1, null, null)
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-bundle-list">
        <div>
          <h2 className="profile__title">
            My bundles
            <span className="profile__title-count">
              ({0})
            </span>
          </h2>
          <p>
            Learn about&nbsp;
            <a href="https://jujucharms.com/docs/stable/charms-bundles#creating-a-bundle"
              target="_blank">
              writing your own bundle
            </a>.
          </p>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display a login message', () => {
    const renderer = renderComponent({
      charmstoreList: sinon.stub().callsArgWith(1, null, null),
      user: null
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-bundle-list">
        <ProfileCharmstoreLogin
          addNotification={sinon.stub()}
          bakery={{}}
          changeState={sinon.stub()}
          charmstore={{getMacaroon: sinon.stub()}}
          storeUser={sinon.stub()}
          type="bundles" />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('updates the header if it is not your profile', () => {
    const renderer = renderComponent({isActiveUsersProfile: false});
    const output = renderer.getRenderOutput();
    assert.equal(output.props.children.props.children[0].props.children[0], 'Their');
  });

  it('can display a spinner when loading', () => {
    const renderer = renderComponent({
      charmstoreList: sinon.stub()
    });
    const instance = renderer.getMountedInstance();
    instance.componentWillMount();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-bundle-list">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
