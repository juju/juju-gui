/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');


const BasicTable = require('../../basic-table/basic-table');
const ProfileCharmList = require('./charm-list');
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
          list: options.charmstoreList || charmstoreList,
          url: '/charmstore'
        }}
        user="hatch@external" />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-charm-list">
        <BasicTable
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
          rows={[{
            columns: [{
              content: (
                <div>
                  <img className="profile-charm-list__icon"
                    src="/charmstore/~hatch/precise/failtester-7/icon.svg"
                    title="failtester" />
                  <a href="/gui/u/hatch/failtester/precise/7"
                    onClick={sinon.stub()}>
                    failtester
                  </a>
                </div>),
              columnSize: 6
            }, {
              content: 'precise',
              columnSize: 3
            }, {
              content: '#7',
              columnSize: 3
            }],
            key: 'cs:~hatch/precise/failtester-7'
          }, {
            columns: [{
              content: (
                <div>
                  <img className="profile-charm-list__icon"
                    src="/charmstore/~hatch/xenial/ghost-3/icon.svg"
                    title="ghost" />
                  <a href="/gui/u/hatch/ghost/xenial/3"
                    onClick={sinon.stub()}>
                    ghost
                  </a>
                </div>),
              columnSize: 6
            }, {
              content: 'xenial',
              columnSize: 3
            }, {
              content: '#3',
              columnSize: 3
            }],
            key: 'cs:~hatch/xenial/ghost-3'
          }, {
            columns: [{
              content: (
                <div>
                  <img className="profile-charm-list__icon"
                    src="/charmstore/~hatch/privghost-1/icon.svg"
                    title="privghost" />
                  <a href="/gui/u/hatch/privghost/1"
                    onClick={sinon.stub()}>
                    privghost
                  </a>
                </div>),
              columnSize: 6
            }, {
              content: 'xenial, trusty',
              columnSize: 3
            }, {
              content: '#1',
              columnSize: 3
            }],
            key: 'cs:~hatch/privghost-1'
          }]} />
      </div>);
    expect(output).toEqualJSX(expected);
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
