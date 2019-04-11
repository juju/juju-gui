/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ISVProfile = require('./isv-profile');

describe('ISVProfile', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ISVProfile
      d3={options.d3 || {}} />
  );

  it('renders the navigation', () => {
    const wrapper = renderComponent();
    var expected = (<nav className="three-col isv-profile__navigation">
      <ul className="isv-profile__navigation-list">
        <li className="isv-profile__navigation-item--title">
          <a href="">Acme Corp</a>
        </li>
        <li className="isv-profile__navigation-item">
          <a href="">Charms</a>
        </li>
        <li className="isv-profile__navigation-item">
          <a href="">Issues</a>
        </li>
        <li className="isv-profile__navigation-item">
          <a href="">Revenue</a>
        </li>
      </ul>
    </nav>);
    assert.compareJSX(wrapper.find('.isv-profile__navigation'), expected);
  });

  it('renders the live data section', () => {
    const wrapper = renderComponent();
    var expected = (<div className="isv-profile__live-data clearfix">
      <h3 className="isv-profile__section-title">
        03 September 2016 - 14:35
      </h3>
      <div className="three-col isv-profile__box">
        <h3 className="isv-profile__box-title">
          User this hour
        </h3>
        <p className="isv-profile__box-stat">23</p>
      </div>
      <div className="three-col isv-profile__box">
        <h3 className="isv-profile__box-title">
          Units this hour
        </h3>
        <p className="isv-profile__box-stat">64</p>
      </div>
      <div className="three-col last-col isv-profile__box">
        <h3 className="isv-profile__box-title">
          Net revenue to date
        </h3>
        <p className="isv-profile__box-stat">$1,500.00</p>
      </div>
    </div>);
    assert.compareJSX(wrapper.find('.isv-profile__live-data'), expected);
  });
});
