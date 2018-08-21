'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ProfileHeader = require('./header');
const SvgIcon = require('../../svg-icon/svg-icon');

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
    const wrapper = renderComponent();
    const expected = (
      <div className="profile-header v1">
        <div className="p-strip is-shallow">
          <div className="row p-divider u-no-padding--top u-no-padding--bottom">
            <div className="col-10 p-divider__block">
              <div className="p-media-object--large u-no-margin--bottom">
                <span className="profile-header__avatar tooltip">
                  <a
                    aria-describedby="tp-cntr"
                    className="p-tooltip p-tooltip--btm-center"
                    href="http://gravatar.com/"
                    target="_blank">
                    <img
                      alt="Gravatar for Geoffrey Spinach"
                      className="p-media-object__image is-round"
                      src="https://www.gravatar.com/avatar/id123" />
                    <span className="p-tooltip__message" id="tp-cntr" role="tooltip">
                      Edit your Gravatar
                    </span>
                  </a>
                </span>
                <div className="p-media-object__details">
                  <h1>spinach</h1>
                  <p className="p-media-object__content">
                    <strong>Geoffrey Spinach</strong>
                  </p>
                  <p className="p-media-object__content">spinach@example.com</p>
                </div>
              </div>
            </div>
            <div className="col-2 p-divider__block">
              <ul className="p-list ts-profile-header__menu">
                <li className="p-list__item">
                  <h2>
                    <a href="/">jaas</a>
                  </h2>
                  <hr />
                </li>
                <li className="p-list__item">
                  <a href="https://jujucharms.com/home">Home</a>
                </li>
                <li className="p-list__item">
                  <a href="https://jujucharms.com/jaas">About JAAS</a>
                </li>
              </ul>
              <div
                className="profile-header__close"
                onClick={wrapper.find('.profile-header__close').prop('onClick')}
                role="button"
                tabIndex="0">
                <SvgIcon name="close_16" size="20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
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
