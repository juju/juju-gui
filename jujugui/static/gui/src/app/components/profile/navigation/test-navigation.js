/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ProfileNavigation = require('./navigation');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile Navigation', function() {
  const sectionsMap = new Map([
    ['models', {label: 'Models'}],
    ['charms', {label: 'Charms'}]
  ]);

  function renderComponent(options) {
    return jsTestUtils.shallowRender(
      <ProfileNavigation
        activeSection="bundles"
        changeState={options.changeState || sinon.stub()}
        sectionsMap={sectionsMap} />, true);
  }

  it('can render', () => {
    const changeState = sinon.stub();
    const output = renderComponent({
      changeState
    }).getRenderOutput();
    const expected = (
      <div className="profile-navigation">
        <ul>
          <li className="profile-navigation__list-item"
            key='models' onClick={sinon.stub()} role="button">
            Models
          </li>
          <li className="profile-navigation__list-item"
            key='charms' onClick={sinon.stub()} role="button">
            Charms
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
    output.props.children.props.children[1].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {hash: 'charms'});
  });

  it('updates the active nav item when re-rendered', () => {
    const changeState = sinon.stub();
    const renderer = renderComponent({
      changeState
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-navigation">
        <ul>
          <li className="profile-navigation__list-item"
            key='models' onClick={sinon.stub()} role="button">
            Models
          </li>
          <li className="profile-navigation__list-item"
            key='charms' onClick={sinon.stub()} role="button">
            Charms
          </li>
        </ul>
      </div>
    );
    expect(output).toEqualJSX(expected);
    renderer.render(
      <ProfileNavigation
        activeSection="charms"
        changeState={changeState}
        sectionsMap={sectionsMap} />);
    const output2 = renderer.getRenderOutput();
    const expected2 = (
      <div className="profile-navigation">
        <ul>
          <li className="profile-navigation__list-item"
            key='models' onClick={sinon.stub()} role="button">
            Models
          </li>
          <li className="profile-navigation__list-item is-active"
            key='charms' onClick={sinon.stub()} role="button">
            Charms
          </li>
        </ul>
      </div>
    );
    expect(output2).toEqualJSX(expected2);
  });

});
