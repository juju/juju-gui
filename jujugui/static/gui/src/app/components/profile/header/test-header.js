/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Profile Header', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('profile-header', function() { done(); });
  });

  it('can render', () => {
    const output = jsTestUtils.shallowRender(
      <juju.components.ProfileHeader />);
    const expected = (
      <div className="profile-header">
        <div className="content"></div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

});
