/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const CreateModelButton = require('../create-model-button/create-model-button');
const EmptyUserProfile = require('./empty-user-profile');

const jsTestUtils = require('../../utils/component-test-utils');

describe('EmptyUserProfile', () => {

  it('renders the empty state for the current user', () => {
    const staticURL = 'test-url';
    const changeState = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <EmptyUserProfile
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
        <CreateModelButton
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
      <EmptyUserProfile
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
      <EmptyUserProfile
        changeState={sinon.stub()}
        switchModel={sinon.stub()}
        staticURL='test' />);
    assert.equal(
      output.props.children[0].props.src,
      'test/static/gui/build/app/assets/images/non-sprites/empty_profile.png');
  });
});
