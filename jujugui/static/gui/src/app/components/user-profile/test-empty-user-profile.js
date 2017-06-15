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

  it('renders the empty state for the current user', () => {
    const staticURL = 'test-url';
    const changeState = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.EmptyUserProfile
        changeState={changeState}
        isCurrentUser={true}
        switchModel={sinon.stub()}
        staticURL={staticURL} />, true);
    const src = staticURL + '/static/gui/build/app'
              + '/assets/images/non-sprites/empty_profile.png';
    const output = component.getRenderOutput();
    const instance = component.getMountedInstance();
    const expected = (
      <div className="user-profile__empty twelve-col no-margin-bottom">
        <img alt="Empty profile"
          className="user-profile__empty-image"
          src={src} />
        <h2 className="user-profile__empty-title">
          {'Your'} profile is currently empty
        </h2>
        <p className="user-profile__empty-text">
          {'Your'} models, bundles, and charms will appear here
          when {'you'} create them.
        </p>
        <juju.components.CreateModelButton
          changeState={changeState}
          switchModel={instance.props.switchModel}
          title="Start building"
          type="inline-positive" />
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders the empty state for another user', () => {
    const staticURL = 'test-url';
    const changeState = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.EmptyUserProfile
        changeState={changeState}
        isCurrentUser={false}
        switchModel={sinon.stub()}
        staticURL={staticURL} />, true);
    const src = staticURL + '/static/gui/build/app'
              + '/assets/images/non-sprites/empty_profile.png';
    const output = component.getRenderOutput();
    const expected = (
      <div className="user-profile__empty twelve-col no-margin-bottom">
        <img alt="Empty profile"
          className="user-profile__empty-image"
          src={src} />
        <h2 className="user-profile__empty-title">
          {'This user\'s'} profile is currently empty
        </h2>
        <p className="user-profile__empty-text">
          {'This user\'s'} models, bundles, and charms will appear here
          when {'they'} create them.
        </p>
        {null}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('displays the empty_profile asset with a staticURL provided', () => {
    const output = jsTestUtils.shallowRender(
      <juju.components.EmptyUserProfile
        changeState={sinon.stub()}
        switchModel={sinon.stub()}
        staticURL='test' />);
    assert.equal(
      output.props.children[0].props.src,
      'test/static/gui/build/app/assets/images/non-sprites/empty_profile.png');
  });
});
