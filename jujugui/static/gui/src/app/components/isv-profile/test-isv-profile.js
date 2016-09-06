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

describe('ISVProfile', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('isv-profile', () => { done(); });
  });

  it('renders the navigation', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.ISVProfile />, true);
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
      <juju.components.ISVProfile />, true);
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
