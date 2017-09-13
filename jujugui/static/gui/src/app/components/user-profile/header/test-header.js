/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const GenericButton = require('../../generic-button/generic-button');
const UserProfileHeader = require('./header');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('UserProfileHeader', () => {
  var links;

  beforeEach(() => {
    const action = sinon.stub();
    links = [{
      action: action,
      label: 'a link'
    }, {
      type: 'testClass',
      label: 'some text'
    }];
  });

  it('renders', () => {
    const interactiveLogin = sinon.stub();
    const userInfo = {profile: 'who'};
    const output = jsTestUtils.shallowRender(
      <UserProfileHeader
        avatar="avatar.png"
        interactiveLogin={interactiveLogin}
        links={links}
        userInfo={userInfo}
      />);
    const expected = (
      <div className="user-profile-header twelve-col">
        <GenericButton
          type="inline-neutral"
          action={interactiveLogin}>
          Log in to the charm store
        </GenericButton>
        <img alt="who"
          className="user-profile-header__avatar"
          src="avatar.png" />
        <h1 className="user-profile-header__username">
          who
        </h1>
        <ul className="user-profile-header__links">
          <li className={
            'user-profile-header__link user-profile-header__link--is-link'}
          key="a link"
          onClick={links[0].action}
          role="button"
          tabIndex="0">
            a link
          </li>
          <li className={
            'user-profile-header__link user-profile-header__link--testClass'}
          key="some text">
            some text
          </li>
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('hides the login button when authenticated to charm store', () => {
    const userInfo = {external: 'who-ext', profile: 'who'};
    const output = jsTestUtils.shallowRender(
      <UserProfileHeader
        avatar="avatar.png"
        interactiveLogin={sinon.stub()}
        links={links}
        userInfo={userInfo}
      />);
    assert.isUndefined(output.props.children[0]);
  });

  it('shows the login button when no external user', () => {
    const interactiveLogin = sinon.stub();
    const userInfo = {profile: 'who'};
    const output = jsTestUtils.shallowRender(
      <UserProfileHeader
        avatar="avatar.png"
        interactiveLogin={interactiveLogin}
        links={links}
        userInfo={userInfo}
      />);
    const expected = (
      <GenericButton
        type="inline-neutral"
        action={interactiveLogin}>
        Log in to the charm store
      </GenericButton>
    );
    expect(output.props.children[0]).toEqualJSX(expected);
  });

  it('can render with a default avatar', () => {
    const userInfo = {external: 'who-ext', profile: 'who'};
    const output = jsTestUtils.shallowRender(
      <UserProfileHeader
        avatar=""
        interactiveLogin={undefined}
        links={links}
        userInfo={userInfo}
      />);
    const expected = (
      <span className={
        'user-profile-header__avatar user-profile-header__avatar--default'}>
        <span className="avatar-overlay"></span>
      </span>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

});
