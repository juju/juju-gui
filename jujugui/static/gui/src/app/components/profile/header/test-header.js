/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ProfileHeader = require('./header');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile Header', function() {

  it('can render', () => {
    const output = jsTestUtils.shallowRender(
      <ProfileHeader
        changeState={sinon.stub()}
        username="spinach" />);
    const expected = (
      <div className="profile-header twelve-col">
        <div className="inner-wrapper">
          <div className="profile-header__close link"
            onClick={sinon.stub()}
            role="button"
            tabIndex="0">
            <SvgIcon
              name="close_16"
              size="20" />
          </div>
          <span className={
            'profile-header__avatar profile-header__avatar--default'}>
            <span className="profile-header__avatar-overlay"></span>
          </span>
          <h1 className="profile-header__username">
            spinach
          </h1>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can close the profile', () => {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <ProfileHeader
        changeState={changeState}
        username="spinach" />);
    output.props.children.props.children[0].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: null,
      profile: null
    });
  });
});
