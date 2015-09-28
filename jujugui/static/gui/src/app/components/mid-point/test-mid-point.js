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
  var charms;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('mid-point', function() { done(); });
  });

  beforeEach(function() {
    stubCharms();
  });

  afterEach(function() {
    // Make sure we reset the charms after every test even if it fails
    // so that we don't cause cascading failures.
    stubCharms();
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
      </div>);
  });

  it('calls addService when clicking on a charm', function() {
    juju.components.MidPoint.prototype.charms = [{
        id: 'trusty/mariadb',
        icon: 'icon.svg',
        name: 'Mariadb'
      }];
    var addService = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MidPoint
        addService={addService} />);
    output.props.children[1].props.children[0].props.onClick({
      currentTarget: {
        getAttribute: function() {
          return 'trusty/mariadb';
        }
      }
    });
    assert.equal(addService.callCount, 1);
    assert.deepEqual(addService.args[0][0], 'trusty/mariadb');
  });
});
