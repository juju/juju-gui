/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ISVProfile = require('./isv-profile');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ISVProfile', () => {

  it('renders the navigation', () => {
    var component = jsTestUtils.shallowRender(
      <ISVProfile
        d3={{}} />, true);
    var output = component.getRenderOutput();
    var content = output.props.children.props.children.props.children[0];
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
    assert.deepEqual(content, expected);
  });

  it('renders the live data section', () => {
    var component = jsTestUtils.shallowRender(
      <ISVProfile
        d3={{}} />, true);
    var output = component.getRenderOutput();
    var wrapper = output.props.children.props.children;
    var content = wrapper.props.children[1].props.children[0];
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
    assert.deepEqual(content, expected);
  });
});
