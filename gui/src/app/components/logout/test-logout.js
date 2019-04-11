/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Logout = require('./logout');

describe('Logout', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Logout
      charmstoreLogoutUrl={options.charmstoreLogoutUrl || 'http://charmstorelogout'}
      doCharmstoreLogout={options.doCharmstoreLogout || sinon.stub().returns(false)}
      locationAssign={options.locationAssign || sinon.stub()}
      logoutUrl={options.logoutUrl || 'http://logout'}
      visible={options.visible === undefined ? true : options.visible} />
  );

  it('renders properly for regular logout', () => {
    const wrapper = renderComponent();
    const expected = (
      <a
        className="logout-link dropdown-menu__list-item-link"
        href="http://logout"
        onClick={wrapper.prop('onClick')}
        target="_self">Logout</a>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('renders properly for charmstore logout', () => {
    const doCharmstoreLogout = sinon.stub().returns(true);
    const wrapper = renderComponent({doCharmstoreLogout});
    assert.equal(wrapper.prop('href'), 'http://charmstorelogout');
  });

  it('can be hidden', () => {
    const wrapper = renderComponent({visible: false});
    assert.equal(wrapper.prop('className').includes('logout-link--hidden'), true);
  });

  it('does not redirect to logout onClick for regular logout', () => {
    const locationAssign = sinon.stub();
    const wrapper = renderComponent({locationAssign});
    wrapper.simulate('click');
    assert.equal(locationAssign.callCount, 0);
  });

  it('redirects to logout onClick for charmstore logout', () => {
    const locationAssign = sinon.stub();
    const doCharmstoreLogout = sinon.stub().returns(true);
    const wrapper = renderComponent({
      doCharmstoreLogout,
      locationAssign
    });
    wrapper.simulate('click');
    assert.equal(locationAssign.callCount, 1);
    assert.equal(locationAssign.args[0][0], 'http://logout');
  });
});
