/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ProfileHeader = require('./header');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile Header', function() {

  it('can render', () => {
    const output = jsTestUtils.shallowRender(
      <ProfileHeader
        username="spinach" />);
    const expected = (
      <div className="profile-header twelve-col">
        <div className="inner-wrapper">
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

});
