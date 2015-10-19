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

describe('EntityDetails', function() {

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-details', function() { done(); });
  });

  it('can be rendered', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        id="test"
        deployService={sinon.spy()}
        changeState={sinon.spy()}
        getEntity={sinon.spy()}
        pluralize={sinon.spy()} />);
    assert.equal(output.props.children, 'Loading...');
  });

  it('fetches an entity properly', function() {
    var id = 'spinach';
    var result = {
      name: 'spinach',
      displayName: 'spinach',
      url: 'http://example.com/spinach',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: id,
      type: 'charm',
      iconPath: 'data:image/gif;base64,',
      tags: ['database'],
      options: {},
      files: []
    };
    var mockModel = {};
    mockModel.toEntity = sinon.stub().returns(result);
    mockModel.get = function(key) {
      return result[key];
    };
    var mockData = [mockModel];
    var getEntity = sinon.stub().callsArgWith(1, mockData);

    var output = testUtils.renderIntoDocument(
        <juju.components.EntityDetails
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          getEntity={getEntity}
          id={id}
          pluralize={sinon.spy()} />);

    assert.isTrue(getEntity.calledOnce,
                  'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
                 'getEntity not called with the entity ID');
    var entity = output.state.entityModel.toEntity();
    assert.equal(entity.id, id,
                 'entity ID does not match the ID requested');
  });
});
