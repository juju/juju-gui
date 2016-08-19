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

/*
The ISV profile component renders a venders profile with stats based on there
charms and bundles. You can only see this page is you have access.
*/

'use strict';

YUI.add('isv-profile', function() {

  juju.components.ISVProfile = React.createClass({
    propTypes: {
    },

    render: function() {
      return (
        <juju.components.Panel
          instanceName="isv-profile"
          visible={true}>
          <div className="row-hero">
            <div className="inner-wrapper">
              <nav className="three-col isv-profile__navigation">
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
              </nav>
              <main className="nine-col last-col">
                <div className="isv-profile__live-data clearfix">
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
                </div>
                <div className="isv-profile__historic-data">
                  <h3 className="isv-profile__section-title">
                    Last six weeks
                  </h3>
                  <div className="twelve-col isv-profile__box">
                    <div className="twelve-col">
                      Show dates from:
                      <select name="select"
                        className="isv-profile__historic-data-input">
                        <option value="value1">01/08/2016</option>
                        <option value="value2">01/08/2016</option>
                        <option value="value3">01/08/2016</option>
                      </select>
                      from:
                      <select name="select"
                        className="isv-profile__historic-data-input">
                        <option value="value1">01/08/2016</option>
                        <option value="value2">01/08/2016</option>
                        <option value="value3">01/08/2016</option>
                      </select>
                    </div>
                    <div className="three-col">
                      <h3 className="isv-profile__box-title">
                        User this hour
                      </h3>
                      <p className="isv-profile__box-stat">1,034</p>
                    </div>
                    <div className="three-col">
                      <h3 className="isv-profile__box-title">
                        Units this hour
                      </h3>
                      <p className="isv-profile__box-stat">1,176</p>
                    </div>
                    <div className="three-col last-col align-right">
                      <h3 className="isv-profile__box-title">
                        Revenue
                      </h3>
                      <p className="isv-profile__box-stat">$500.00</p>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'panel-component',
  ]
});
