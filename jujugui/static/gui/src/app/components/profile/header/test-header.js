/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ProfileHeader = require('./header');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile Header', function() {

  it('can render', () => {
    const output = jsTestUtils.shallowRender(
      <ProfileHeader />);
    const expected = (
      <div className="profile-header">
        <div className="profile-header__content"></div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

});
