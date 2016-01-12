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

var juju = {components: {}}; // eslint-disable-line no-unused-vars
var testUtils = React.addons.TestUtils;

describe('UserProfileList', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-list', () => { done(); });
  });

  it('renders without data', () => {
    var data = [];
    var count = 0;
    var switchEnv = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfileList
        title="Test List"
        data={data}
        uuidKey="uuid"
        switchEnv={switchEnv}/>);
    var expected = (
      <div className="user-profile-list">
        <div className="user-profile-list__header">
          Test List
          <span className="user-profile-list__size">
            {' '} ({count})
          </span>
        </div>
        <juju.components.Spinner />
      </div>);

    assert.deepEqual(output, expected);
  });

  it('renders with data', () => {
    var data = [{
      uuid: 'abc123',
      ship: 'tardis',
      pilot: 'the dr'
    }, {
      uuid: '123abc',
      ship: 'nebekenezer',
      pilot: 'dozer'
    }];
    var count = 2;
    var switchEnv = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileList
        title="TestList"
        data={data}
        uuidKey="uuid"
        switchEnv={switchEnv}/>, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var expected = (
      <div className="user-profile-list">
        <div className="user-profile-list__header">
          TestList
          <span className="user-profile-list__size">
            {' '} ({count})
          </span>
        </div>
        <ul>
          <li
            className="user-profile-list__header-row"
            key="TestList-header-row">
            <div
              className="user-profile-list__line-item"
              data-key="uuid"
              key="abc123-uuid">
              uuid
            </div>
            <div
              className="user-profile-list__line-item"
              data-key="ship"
              key="abc123-ship">
              ship
            </div>
            <div
              className="user-profile-list__line-item"
              data-key="pilot"
              key="abc123-pilot">
              pilot
            </div>
          </li>
          <li
            className="user-profile-list__item-row"
            key={data[0].uuid}
            data-uuid={data[0].uuid}
            onClick={instance._switchEnv}>
            <div
              className="user-profile-list__line-item"
              data-key="uuid"
              key="abc123-uuid">
              {data[0].uuid}
            </div>
            <div
              className="user-profile-list__line-item"
              data-key="ship"
              key="abc123-ship">
              {data[0].ship}
            </div>
            <div
              className="user-profile-list__line-item"
              data-key="pilot"
              key="abc123-pilot">
              {data[0].pilot}
            </div>
          </li>
          <li
            className="user-profile-list__item-row"
            key={data[1].uuid}
            data-uuid={data[1].uuid}
            onClick={instance._switchEnv}>
            <div
              className="user-profile-list__line-item"
              data-key="uuid"
              key="123abc-uuid">
              {data[1].uuid}
            </div>
            <div
              className="user-profile-list__line-item"
              data-key="ship"
              key="123abc-ship">
              {data[1].ship}
            </div>
            <div
              className="user-profile-list__line-item"
              data-key="pilot"
              key="123abc-pilot">
              {data[1].pilot}
            </div>
          </li>
        </ul>
      </div>);

    assert.deepEqual(output, expected);
  });

  it('respects key whitelist if supplied', function() {
    var data = [{
      uuid: 'abc123',
      ship: 'tardis',
      pilot: 'the dr'
    }];
    var count = 1;
    var switchEnv = sinon.stub();
    var whitelist = ['uuid', 'ship'];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileList
        title="TestList"
        data={data}
        uuidKey="uuid"
        switchEnv={switchEnv}
        whitelist={whitelist}/>, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var expected = (
      <div className="user-profile-list">
        <div className="user-profile-list__header">
          TestList
          <span className="user-profile-list__size">
            {' '} ({count})
          </span>
        </div>
        <ul>
          <li
            className="user-profile-list__header-row"
            key="TestList-header-row">
            <div
              className="user-profile-list__line-item"
              data-key="uuid"
              key="abc123-uuid">
              uuid
            </div>
            <div
              className="user-profile-list__line-item"
              data-key="ship"
              key="abc123-ship">
              ship
            </div>
          </li>
          <li
            className="user-profile-list__item-row"
            key={data[0].uuid}
            data-uuid={data[0].uuid}
            onClick={instance._switchEnv}>
            <div
              className="user-profile-list__line-item"
              data-key="uuid"
              key="abc123-uuid">
              {data[0].uuid}
            </div>
            <div
              className="user-profile-list__line-item"
              data-key="ship"
              key="abc123-ship">
              {data[0].ship}
            </div>
          </li>
        </ul>
      </div>);

    assert.deepEqual(output, expected);
  });

  it('calls to switch envs when clicking on row', function() {
    var data = [{
      uuid: 'abc123',
      ship: 'tardis',
      name: 'the dr'
    }];
    var switchEnv = sinon.stub();
    var component = testUtils.renderIntoDocument(
      <juju.components.UserProfileList
        title="TestList"
        data={data}
        uuidKey="uuid"
        switchEnv={switchEnv}/>);
    testUtils.Simulate.click(
      ReactDOM.findDOMNode(component)
              .querySelector('.user-profile-list__item-row'));
    assert.equal(switchEnv.callCount, 1);
    assert.deepEqual(switchEnv.args[0], ['abc123', 'the dr']);
  });

});
