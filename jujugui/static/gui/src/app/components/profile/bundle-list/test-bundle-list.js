/* Copyright (C) 2017 Canonical Ltd. */

'use strict';
const React = require('react');

const BasicTable = require('../../basic-table/basic-table');
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
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

  function renderComponent(options={}) {
    const charmstoreList = (user, cb) => {
      assert.equal(user, 'lazypower@external');
      cb(null, JSON.parse(rawBundleData));
    };
    return jsTestUtils.shallowRender(
      <ProfileBundleList
        addNotification={sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          getDiagramURL: options.getDiagramURL || sinon.stub().returns('diagram.svg'),
          list: options.charmstoreList || charmstoreList,
          url: '/charmstore'
        }}
        user="lazypower@external" />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-bundle-list">
        <BasicTable
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
              <div className="profile-bundle-list__expanded">
                <div className="eight-col profile-bundle-list__expanded-leading">
                  logstash-core
                </div>
                <div className="two-col profile-bundle-list__expanded-leading">
                  2
                </div>
                <div className="one-col profile-bundle-list__expanded-leading">
                  3
                </div>
                <div className="one-col last-col profile-bundle-list__expanded-leading">
                  #1
                </div>
                <div className="seven-col">
                  <p>logstash-core description</p>
                  <EntityContentDiagram
                    diagramUrl="diagram.svg" />
                </div>
                <div className="five-col last-col">
                  <div>
                    <a href="example.com/bugs"
                      onClick={sinon.stub()}
                      target="_blank">
                      Bugs
                    </a>
                  </div>
                  <div>
                    <a href="example.com/"
                      onClick={sinon.stub()}
                      target="_blank">
                      Homepage
                    </a>
                  </div>
                  <p className="profile-bundle-list__permissions-title">
                    Writeable:
                  </p>
                  <ul className="profile-bundle-list__permissions">
                    <li className="profile-bundle-list__permission link"
                      onClick={sinon.stub()}
                      role="button"
                      tabIndex="0">
                      lazypower
                    </li>
                  </ul>
                  <p className="profile-bundle-list__permissions-title">
                    Readable:
                  </p>
                  <ul className="profile-bundle-list__permissions">
                    <li className="profile-bundle-list__permission">
                      everyone
                    </li>
                  </ul>
                </div>
              </div>),
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
              <div className="profile-bundle-list__expanded">
                <div className="eight-col profile-bundle-list__expanded-leading">
                  swarm-core
                </div>
                <div className="two-col profile-bundle-list__expanded-leading">
                  5
                </div>
                <div className="one-col profile-bundle-list__expanded-leading">
                  5
                </div>
                <div className="one-col last-col profile-bundle-list__expanded-leading">
                  #1
                </div>
                <div className="seven-col">
                  <p>swarm-core description</p>
                  <EntityContentDiagram
                    diagramUrl="diagram.svg" />
                </div>
                <div className="five-col last-col">
                  <div>
                    <a href="example.com/bugs"
                      onClick={sinon.stub()}
                      target="_blank">
                      Bugs
                    </a>
                  </div>
                  <div>
                    <a href="example.com/"
                      onClick={sinon.stub()}
                      target="_blank">
                      Homepage
                    </a>
                  </div>
                  <p className="profile-bundle-list__permissions-title">
                    Writeable:
                  </p>
                  <ul className="profile-bundle-list__permissions">
                    <li className="profile-bundle-list__permission link"
                      onClick={sinon.stub()}
                      role="button"
                      tabIndex="0">
                      lazypower
                    </li>
                  </ul>
                  <p className="profile-bundle-list__permissions-title">
                    Readable:
                  </p>
                  <ul className="profile-bundle-list__permissions">
                    <li className="profile-bundle-list__permission link"
                      onClick={sinon.stub()}
                      role="button"
                      tabIndex="0">
                      lazypower
                    </li>
                    <li className="profile-bundle-list__permission">
                      everyone
                    </li>
                  </ul>
                </div>
              </div>),
            key: 'cs:~lazypower/bundle/swarm-core-1'
          }]} />
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
        <BasicTable
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
          rows={[]} />
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
