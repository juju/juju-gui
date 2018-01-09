/* Copyright (C) 2017 Canonical Ltd. */

'use strict';
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../basic-table/basic-table');
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
    return jsTestUtils.shallowRender(
      <ProfileBundleList
        acl={options.acl || acl}
        addNotification={sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          getDiagramURL: options.getDiagramURL || sinon.stub().returns('diagram.svg'),
          list: options.charmstoreList || charmstoreList,
          url: '/charmstore'
        }}
        deployTarget={options.deployTarget || sinon.stub()}
        getModelName={options.getModelName || sinon.stub()}
        user="lazypower@external" />, true);
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
              columnSize: 8
            }, {
              content: 'Machines',
              columnSize: 2
            }, {
              content: 'Units',
              columnSize: 1
            }, {
              content: 'Release',
              columnSize: 1
            }]}
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={[{
              columns: [{
                content: (
                  <a className="cold-link"
                    href="/gui/u/lazypower/logstash-core/bundle/1"
                    onClick={sinon.stub()}>
                    logstash-core
                  </a>),
                columnSize: 4
              }, {
                content: (
                  <div>
                    <img className="profile-bundle-list__icon"
                      src="/charmstore/~lazypower/trusty/elasticsearch/icon.svg"
                      title="elasticsearch" />
                    <img className="profile-bundle-list__icon"
                      src="/charmstore/trusty/kibana-10/icon.svg"
                      title="kibana" />
                    <img className="profile-bundle-list__icon"
                      src="/charmstore/~lazypower/trusty/logstash-20/icon.svg"
                      title="logstash" />
                    <img className="profile-bundle-list__icon"
                      src="/charmstore/~kwmonroe/trusty/openjdk/icon.svg"
                      title="openjdk" />
                  </div>),
                columnSize: 4
              }, {
                content: 2,
                columnSize: 2
              }, {
                content: 3,
                columnSize: 1
              }, {
                content: '#1',
                columnSize: 1
              }],
              expandedContent: (
                <ProfileExpandedContent
                  acl={instance.props.acl}
                  changeState={sinon.stub()}
                  deployTarget={instance.props.deployTarget}
                  entity={bundles[0]}
                  getDiagramURL={sinon.stub()}
                  getModelName={instance.props.getModelName}
                  topRow={(
                    <div>
                      <div className="eight-col profile-expanded-content__top-row">
                        logstash-core
                      </div>
                      <div className="two-col profile-expanded-content__top-row">
                        2
                      </div>
                      <div className="one-col profile-expanded-content__top-row">
                        3
                      </div>
                      <div className="one-col last-col profile-expanded-content__top-row">
                        #1
                      </div>
                    </div>)} />),
              key: 'cs:~lazypower/bundle/logstash-core-1'
            }, {
              columns: [{
                content: (
                  <a className="cold-link"
                    href="/gui/u/lazypower/swarm-core/bundle/1"
                    onClick={sinon.stub()}>
                    swarm-core
                  </a>),
                columnSize: 4
              }, {
                content: (
                  <div>
                    <img className="profile-bundle-list__icon"
                      src="/charmstore/~containers/trusty/consul/icon.svg"
                      title="consul" />
                    <img className="profile-bundle-list__icon"
                      src="/charmstore/~lazypower/swarm/icon.svg"
                      title="swarm" />
                  </div>),
                columnSize: 4
              }, {
                content: 5,
                columnSize: 2
              }, {
                content: 5,
                columnSize: 1
              }, {
                content: '#1',
                columnSize: 1
              }],
              expandedContent: (
                <ProfileExpandedContent
                  acl={instance.props.acl}
                  changeState={sinon.stub()}
                  deployTarget={instance.props.deployTarget}
                  entity={bundles[1]}
                  getDiagramURL={sinon.stub()}
                  getModelName={instance.props.getModelName}
                  topRow={(
                    <div>
                      <div className="eight-col profile-expanded-content__top-row">
                        swarm-core
                      </div>
                      <div className="two-col profile-expanded-content__top-row">
                        5
                      </div>
                      <div className="one-col profile-expanded-content__top-row">
                        5
                      </div>
                      <div className="one-col last-col profile-expanded-content__top-row">
                        #1
                      </div>
                    </div>)} />),
              key: 'cs:~lazypower/bundle/swarm-core-1'
            }]} />
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
          <BasicTable
            headerClasses={['profile__entity-table-header-row']}
            headerColumnClasses={['profile__entity-table-header-column']}
            headers={[{
              content: 'Name',
              columnSize: 8
            }, {
              content: 'Machines',
              columnSize: 2
            }, {
              content: 'Units',
              columnSize: 1
            }, {
              content: 'Release',
              columnSize: 1
            }]}
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={[]} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
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
