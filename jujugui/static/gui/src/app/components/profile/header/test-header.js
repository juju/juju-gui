'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ProfileHeader = require('./header');

describe('Profile Header', function() {
  let getUser;

  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <ProfileHeader
        changeState={options.changeState || sinon.stub()}
        controllerIP={options.controllerIP || '1.2.3.4'}
        getUser={options.getUser || getUser}
        gisf={options.gisf === undefined ? true : options.gisf}
        userInfo={
          options.userInfo || {
            isCurrent: true,
            profile: 'spinach'
          }
        } />
    );

  beforeEach(() => {
    getUser = sinon.stub().callsArgWith(1, null, {
      email: 'spinach@example.com',
      fullname: 'Geoffrey Spinach',
      gravatar_id: 'id123'
    });
  });

  it('can render', () => {
    const wrapper = renderComponent({ gisf: true });
    expect(wrapper).toMatchSnapshot();
  });

  it('can render correctly for the non-logged in user', () => {
    const wrapper = renderComponent({
      userInfo: {
        isCurrent: false,
        profile: 'notspinach'
      }
    });
    assert.equal(wrapper.find('.ts-profile-header__menu').length, 0);
    assert.equal(wrapper.find('.p-tooltip__message').length, 0);
  });

  it('displays a different link list for non-jaas', () => {
    const wrapper = renderComponent({ gisf: false });
    const expected = (
      <ul className="p-list ts-profile-header__menu">
        <li className="p-list__item" key="controller">
          <h2>1.2.3.4</h2>
          <hr />
        </li>
        <li className="p-list__item" key="home">
          <a href="https://jujucharms.com/about">Juju Home</a>
        </li>
      </ul>
    );
    assert.compareJSX(wrapper.find('.ts-profile-header__menu'), expected);
  });

  it('displays a hidden gravatar until the user request has returned', () => {
    // For the test where it has returned successfully see the above tests.
    const wrapper = renderComponent({ getUser: sinon.stub() });
    assert.equal(
      wrapper
        .find('.profile-header__avatar')
        .prop('className')
        .includes('profile-header__avatar--hidden'),
      true
    );
  });

  it('displays the fallback gravatar if the user request fails', () => {
    const wrapper = renderComponent({
      getUser: sinon.stub().callsArgWith(1, null, null)
    });
    assert.equal(
      wrapper
        .find('.profile-header__avatar')
        .prop('className')
        .includes('profile-header__avatar--default'),
      true
    );
  });

  it('can close the profile', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper
      .find('.profile-header__close')
      .props()
      .onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: null,
      profile: null
    });
  });
});
