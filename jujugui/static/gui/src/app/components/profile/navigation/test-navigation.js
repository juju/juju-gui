/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Profile = require('../profile');
const ProfileNavigation = require('./navigation');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile Navigation', function() {
  let sectionsMap = Profile.sectionsMap;

  function renderComponent(options) {
    return jsTestUtils.shallowRender(
      <ProfileNavigation
        activeSection="bundles"
        changeState={options.changeState || sinon.stub()}
        sectionsMap={sectionsMap}/>, true);
  }

  it('can render', () => {
    const changeState = sinon.stub();
    const output = renderComponent({
      changeState
    }).getRenderOutput();
    const list = output.props.children.props.children;
    const expected = (
      <div className="profile-navigation">
        <ul>
          <li className="profile-navigation__list-item"
            role="button" key='models' onClick={list[0].props.onClick}>
            Models
          </li>
          <li className="profile-navigation__list-item"
            role="button" key='charms' onClick={list[1].props.onClick}>
            Charms
          </li>
          <li className="profile-navigation__list-item is-active"
            role="button" key='bundles' onClick={list[2].props.onClick}>
            Bundles
          </li>
          <li className="profile-navigation__list-item" key='credentials'
            role="button"
            onClick={list[3].props.onClick}>
            Cloud Credentials
          </li>
        </ul>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('calls changeState when nav item clicked', () => {
    const changeState = sinon.stub();
    const output = renderComponent({
      changeState
    }).getRenderOutput();
    output.props.children.props.children[2].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {hash: 'bundles'});
  });

  it('updates the active nav item when re-rendered', () => {
    const changeState = sinon.stub();
    const renderer = renderComponent({
      changeState
    });
    const output = renderer.getRenderOutput();
    const list = output.props.children.props.children;
    const expected = (
      <div className="profile-navigation">
        <ul>
          <li className="profile-navigation__list-item"
            role="button" key='models' onClick={list[0].props.onClick}>
            Models
          </li>
          <li className="profile-navigation__list-item"
            role="button" key='charms' onClick={list[1].props.onClick}>
            Charms
          </li>
          <li className="profile-navigation__list-item is-active"
            role="button" key='bundles' onClick={list[2].props.onClick}>
            Bundles
          </li>
          <li className="profile-navigation__list-item"
            role="button" key='credentials'
            onClick={list[3].props.onClick}>
            Cloud Credentials
          </li>
        </ul>
      </div>
    );
    expect(output).toEqualJSX(expected);
    renderer.render(
      <ProfileNavigation
        changeState={changeState}
        sectionsMap={sectionsMap}
        activeSection="charms"/>);
    const output2 = renderer.getRenderOutput();
    const list2 = output2.props.children.props.children;
    const expected2 = (
      <div className="profile-navigation">
        <ul>
          <li className="profile-navigation__list-item"
            role="button" key='models' onClick={list2[0].props.onClick}>
            Models
          </li>
          <li className="profile-navigation__list-item is-active"
            role="button" key='charms' onClick={list2[1].props.onClick}>
            Charms
          </li>
          <li className="profile-navigation__list-item"
            role="button" key='bundles' onClick={list2[2].props.onClick}>
            Bundles
          </li>
          <li className="profile-navigation__list-item"
            key='credentials' role="button"
            onClick={list2[3].props.onClick}>
            Cloud Credentials
          </li>
        </ul>
      </div>
    );
    expect(output2).toEqualJSX(expected2);
  });

});
