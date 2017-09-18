/* Copyright (C) 2017 Canonical Ltd. */

'use strict';
const React = require('react');

const ProfileBundleList = require('./bundle-list');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile Bundle List', function() {

  const rawBundleData = `[{
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
    "unitCount": 3
  }, {
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
          list: charmstoreList,
          url: '/charmstore'
        }}
        user="lazypower@external" />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const list = output.props.children.props.children[1];
    const expected = (
      <div className="profile-bundle-list">
        <ul>
          <li className="profile-bundle-list__table-header">
            <span>Name</span>
            <span>Units</span>
            <span>Owner</span>
            <span>Visibility</span>
          </li>
          <li className="profile-bundle-list__row">
            <span>
              <img
                className="profile-bundle-list__icon"
                src="/charmstore/~lazypower/trusty/elasticsearch/icon.svg"
                title="logstash-core"/>
              <a
                href="/gui/u/lazypower/logstash-core/bundle/1"
                onClick={list[0].props.children[0].props.children[1].props.onClick}>
                logstash-core
              </a>
            </span>
            <span>3</span>
            <span>lazypower@external</span>
            <span>public</span>
          </li>
          <li className="profile-bundle-list__row">
            <span>
              <img
                className="profile-bundle-list__icon"
                src="/charmstore/~containers/trusty/consul/icon.svg"
                title="swarm-core"/>
              <a
                href="/gui/u/lazypower/swarm-core/bundle/1"
                onClick={list[1].props.children[0].props.children[1].props.onClick}>
                swarm-core
              </a>
            </span>
            <span>5</span>
            <span>lazypower@external</span>
            <span>public</span>
          </li>
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
