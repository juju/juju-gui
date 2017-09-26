/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');

const ProfileCharmList = require('./charm-list');

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

  function renderComponent(options={}) {
    const charmstoreList = (user, cb) => {
      assert.equal(user, 'hatch@external');
      cb(null, JSON.parse(rawCharmData));
    };
    return jsTestUtils.shallowRender(
      <ProfileCharmList
        addNotification={sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          list: charmstoreList,
          url: '/charmstore'
        }}
        user="hatch@external" />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const list = output.props.children.props.children[1];
    const expected = (
      <div className="profile-charm-list">
        <ul>
          <li className="profile-charm-list__table-header">
            <span>Name</span>
            <span>Series</span>
            <span>Owner</span>
            <span>Visibility</span>
          </li>
          <li className="profile-charm-list__row">
            <span>
              <img
                className="profile-charm-list__icon"
                src="/charmstore/~hatch/precise/failtester-7/icon.svg"
                title="failtester"/>
              <a
                href="/gui/u/hatch/failtester/precise/7"
                onClick={list[0].props.children[0].props.children[1].props.onClick}>
                failtester
              </a>
            </span>
            <span>precise</span>
            <span>hatch@external</span>
            <span>public</span>
          </li>
          <li className="profile-charm-list__row">
            <span>
              <img
                className="profile-charm-list__icon"
                src="/charmstore/~hatch/xenial/ghost-3/icon.svg"
                title="ghost"/>
              <a
                href="/gui/u/hatch/ghost/xenial/3"
                onClick={list[1].props.children[0].props.children[1].props.onClick}>
                ghost
              </a>
            </span>
            <span>xenial</span>
            <span>hatch@external</span>
            <span>public</span>
          </li>
          <li className="profile-charm-list__row">
            <span>
              <img
                className="profile-charm-list__icon"
                src="/charmstore/~hatch/privghost-1/icon.svg"
                title="privghost"/>
              <a
                href="/gui/u/hatch/privghost/1"
                onClick={list[2].props.children[0].props.children[1].props.onClick}>
                privghost
              </a>
            </span>
            <span>xenial trusty</span>
            <span>hatch@external</span>
            <span>private</span>
          </li>
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
