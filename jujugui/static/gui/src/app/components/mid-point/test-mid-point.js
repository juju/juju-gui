/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('MidPoint', function() {
  var charms, tags;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('mid-point', function() { done(); });
  });

  beforeEach(function() {
    stubCharms();
    stubTags();
  });

  afterEach(function() {
    // Make sure we reset the charms and tags after every test even if it fails
    // so that we don't cause cascading failures.
    stubCharms();
    stubTags();
  });

  function stubCharms() {
    charms = juju.components.MidPoint.charms;
    juju.components.MidPoint.prototype.charms = [];
  }

  function resetCharms() {
    if (charms !== null) {
      juju.components.MidPoint.prototype.charms = charms;
    }
  }

  function stubTags() {
    tags = juju.components.MidPoint.tags;
    juju.components.MidPoint.prototype.tags = [];
  }

  function resetTags() {
    if (tags !== null) {
      juju.components.MidPoint.prototype.tags = tags;
    }
  }

  it('renders a list of charms', function() {
    juju.components.MidPoint.prototype.charms = [{
        id: 'trusty/mariadb',
        icon: 'icon.svg',
        name: 'Mariadb'
      }, {
        id: 'trusty/mongodb',
        icon: 'icon.svg',
        name: 'Mongodb'
    }];
    var addService = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MidPoint
        addService={addService} />);
    assert.deepEqual(output,
      <div className="mid-point">
        <h4 className="mid-point__title">Featured searches</h4>
        <ul className="mid-point__charm-list">
          <li tabIndex="0" role="button"
            className="mid-point__charm"
            data-id="trusty/mariadb"
            key="trusty/mariadb"
            onClick={output.props.children[1].props.children[0].props.onClick}>
            <img src="icon.svg" alt="Mariadb"
              className="mid-point__charm-icon" />
            <span className="mid-point__charm-name">
              Mariadb
            </span>
          </li>
          <li tabIndex="0" role="button"
            className="mid-point__charm"
            data-id="trusty/mongodb"
            key="trusty/mongodb"
            onClick={output.props.children[1].props.children[1].props.onClick}>
            <img src="icon.svg" alt="Mongodb"
              className="mid-point__charm-icon" />
            <span className="mid-point__charm-name">
              Mongodb
            </span>
          </li>
        </ul>
        <div className="mid-point__footer-row">
          <ul className="mid-point__tag-list">
            {juju.components.MidPoint.prototype.tags}
          </ul>
          <button className="mid-point__store-button">
            Show more
          </button>
        </div>
      </div>);
  });

  it('calls to show the charm details when clicking on a charm', function() {
    juju.components.MidPoint.prototype.charms = [{
        id: 'trusty/mariadb',
        icon: 'icon.svg',
        name: 'Mariadb'
      }];
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MidPoint
        changeState={changeState} />);
    output.props.children[1].props.children[0].props.onClick({
      currentTarget: {
        getAttribute: function() {
          return 'trusty/mariadb';
        }
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'entity-details',
          id: 'trusty/mariadb'
        }
      }
    });
  });

  it('renders a list of tags', function() {
    juju.components.MidPoint.prototype.tags = [{
        count: 5,
        name: 'databases'
      }, {
        count: 30,
        name: 'ops'
    }];
    // JSX doesn't like parentheses so it creates arrays of the data and we
    // have to define those outside of the markup.
    var counts = [
      ['(', 5, ')'],
      ['(', 30, ')']
    ];
    var addService = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MidPoint
        addService={addService} />);
    assert.deepEqual(output,
      <div className="mid-point">
        <h4 className="mid-point__title">Featured searches</h4>
        <ul className="mid-point__charm-list">
          {juju.components.MidPoint.prototype.charms}
        </ul>
        <div className="mid-point__footer-row">
          <ul className="mid-point__tag-list">
            <li tabIndex="0" role="button"
              className="mid-point__tag">
              databases
              <span className="mid-point__tag-count">
                {counts[0]}
              </span>
            </li>
            <li tabIndex="0" role="button"
              className="mid-point__tag">
              ops
              <span className="mid-point__tag-count">
                {counts[1]}
              </span>
            </li>
          </ul>
          <button className="mid-point__store-button">
            Show more
          </button>
        </div>
      </div>);
  });
});
