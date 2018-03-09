/* Copyright (C) 2017 Canonical Ltd. */

/*
The ISV profile component renders a venders profile with stats based on there
charms and bundles. You can only see this page is you have access.
*/

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Panel = require('../panel/panel');
const PlansUsage = require('./plans-usage/plans-usage');

class ISVProfile extends React.Component {
  /**
    Placeholder function to get the data to render the plan usage chart

    @method getDataSet
    @returns {Array} Array of data points.
  */
  getDataSet() {
    return [[
      {'date': new Date(2012, 0, 1), 'value': 300},
      {'date': new Date(2012, 0, 3), 'value': 200},
      {'date': new Date(2012, 0, 12), 'value': 330},
      {'date': new Date(2012, 0, 21), 'value': 130},
      {'date': new Date(2012, 0, 30), 'value': 230}
    ], [
      {'date': new Date(2012, 0, 1), 'value': 300},
      {'date': new Date(2012, 0, 3), 'value': 220},
      {'date': new Date(2012, 0, 12), 'value': 630},
      {'date': new Date(2012, 0, 21), 'value': 230},
      {'date': new Date(2012, 0, 30), 'value': 30}
    ]];
  }

  render() {
    return (
      <Panel
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
                    <select className="isv-profile__historic-data-input"
                      name="select">
                      <option value="value1">01/08/2016</option>
                      <option value="value2">01/08/2016</option>
                      <option value="value3">01/08/2016</option>
                    </select>
                    to:
                    <select className="isv-profile__historic-data-input"
                      name="select">
                      <option value="value1">05/09/2016</option>
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
                  <PlansUsage
                    d3={this.props.d3}
                    dataset={this.getDataSet()} />
                </div>
              </div>
            </main>
          </div>
        </div>
      </Panel>
    );
  }
};

ISVProfile.propTypes = {
  d3: PropTypes.object.isRequired
};

module.exports = ISVProfile;
