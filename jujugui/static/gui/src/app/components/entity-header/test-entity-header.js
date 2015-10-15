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

describe('EntityHeader', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-header', function() { done(); });
  });

  beforeEach(function() {
    var pojo = {
      name: 'spinach',
      displayName: 'spinach',
      url: 'http://example.com/spinach',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'spinach',
      type: 'charm',
      iconPath: 'data:image/gif;base64,',
      tags: ['database']
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

  it('renders an entity properly', function() {
    var output = testUtils.renderIntoDocument(
        <juju.components.EntityHeader
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity}
          pluralize={sinon.spy()} />);

    var entity = output.props.entityModel.toEntity();
    var root = output.getDOMNode();
    var title = root.querySelector('.entity-header__title');
    assert.equal(entity.displayName, title.textContent,
                 'rendered name does not match entity name');
    var owner = root.querySelector('.entity-header__by a');
    assert.equal(entity.owner, owner.textContent,
                 'rendered owner does not match entity owner');
    var downloads = root.querySelector('.bundle-stats__deploys-count');
    assert.equal(entity.downloads, downloads.textContent,
                 'rendered downloads does not match entity downloads');
  });

  it('dispatches to search when a tag is clicked', function() {
    var tag = 'database';
    var changeState = sinon.spy();

    var component = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        deployService={sinon.spy()}
        changeState={changeState}
        entityModel={mockEntity}
        pluralize={sinon.spy()} />);
    var node = component.getDOMNode().querySelector('.tag-list__item a');
    testUtils.Simulate.click(node);

    assert.equal(changeState.callCount, 1,
                 'changeState not called as expected');
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'search-results',
          search: null,
          tags: tag
        }
      }
    }, 'App state not set properly.');
  });

  it('displays an add to canvas button', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        entityModel={mockEntity}
        changeState={sinon.spy()}
        deployService={sinon.spy()}
        pluralize={sinon.spy()} />);
    var deployButton = output.props.children.props.children.props.children[1]
                             .props.children[1];
    assert.deepEqual(deployButton,
      <juju.components.GenericButton
        action={deployButton.props.action}
        type="confirm"
        title="Add to canvas" />);
  });

  it('adds the service when the add button is clicked', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        deployService={deployService}
        changeState={changeState}
        entityModel={mockEntity}
        pluralize={sinon.stub()} />);
    var deployButton = output.props.children.props.children.props.children[1]
                             .props.children[1];
    // Simulate a click.
    deployButton.props.action();
    assert.equal(deployService.callCount, 1);
    assert.equal(deployService.args[0][0], mockEntity);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: null
      }
    });
  });
});
