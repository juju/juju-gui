/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ProfileNavigation = require('./navigation');

describe('Profile Navigation', function() {
  const sectionsMap = new Map([
    ['models', {label: 'Models'}],
    ['charms', {label: 'Charms'}]
  ]);

  const renderComponent = (options = {}) => enzyme.shallow(
    <ProfileNavigation
      activeSection={options.activeSection || 'bundles'}
      changeState={options.changeState || sinon.stub()}
      sectionsMap={sectionsMap} />
  );

  it('can render', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({
      changeState
    });
    const expected = (
      <div className="profile-navigation">
        <ul>
          <li className="profile-navigation__list-item"
            key='models'
            onClick={wrapper.find('.profile-navigation__list-item').at(0).prop('onClick')}
            role="button">
            Models
          </li>
          <li className="profile-navigation__list-item"
            key='charms'
            onClick={wrapper.find('.profile-navigation__list-item').at(1).prop('onClick')}
            role="button">
            Charms
          </li>
        </ul>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('calls changeState when nav item clicked', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({
      changeState
    });
    wrapper.find('.profile-navigation__list-item').at(1).props().onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {hash: 'charms'});
  });

  it('updates the active nav item when re-rendered', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({
      changeState
    });
    assert.equal(wrapper.find('.is-active').length, 0);
    wrapper.setProps({ activeSection: 'charms' });
    assert.equal(wrapper.find('.is-active').length, 1);
  });

});
