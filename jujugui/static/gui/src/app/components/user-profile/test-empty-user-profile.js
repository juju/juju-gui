/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('EmptyUserProfile', () => {
  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('empty-user-profile', () => { done(); });
  });

  it('renders the empty state', () => {
    var staticURL = 'test-url';
    var component = jsTestUtils.shallowRender(
      <juju.components.EmptyUserProfile
       switchModel={sinon.stub()}
       staticURL={staticURL} />, true);
    var src = staticURL + '/static/gui/build/app'
              + '/assets/images/non-sprites/empty_profile.png';
    var output = component.getRenderOutput();
    var instance = component.getMountedInstance();
    var expected = (
      <div className="user-profile__empty twelve-col no-margin-bottom">
        <img alt="Empty profile"
          className="user-profile__empty-image"
          src={src} />
        <h2 className="user-profile__empty-title">
          Your profile is currently empty
        </h2>
        <p className="user-profile__empty-text">
          Your models, bundles, and charms will appear here when you create
          them.
        </p>
        <juju.components.CreateModelButton
          switchModel={instance.switchModel}
          title="Start building"
          type="inline-positive" />
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('displays the empty_profile asset with a staticURL provided', () => {
    var output = jsTestUtils.shallowRender(
      <juju.components.EmptyUserProfile
        switchModel={sinon.stub()}
        staticURL='test' />);
    assert.equal(
      output.props.children[0].props.src,
      'test/static/gui/build/app/assets/images/non-sprites/empty_profile.png');
  });
});
