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

describe('EntityContent', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-content', function() { done(); });
  });

  beforeEach(function() {
    var pojo = {
      name: 'spinach',
      description: 'Julia felt cool.',
      displayName: 'spinach',
      url: 'http://example.com/spinach',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'spinach',
      type: 'charm',
      iconPath: 'data:image/gif;base64,',
      tags: ['database'],
      options: {}
    };
    mockEntity = {};
    mockEntity.toEntity = sinon.stub().returns(pojo);
    mockEntity.get = function(key) {
      return pojo[key];
    };
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders the description', function() {
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityContent
        entityModel={mockEntity} />);

    var entity = mockEntity.toEntity();
    var root = output.getDOMNode();
    var description = root.querySelector('.entity__description p');
    assert.equal(entity.description, description.textContent,
                 'rendered description does not match entity description');
  });
});
