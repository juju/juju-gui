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

  function setupMockData(isBundle) {
    var result;
    if (isBundle) {
      result = {
        name: 'spinach',
        displayName: 'spinach',
        url: 'http://example.com/spinach',
        downloads: 1000,
        owner: 'test-owner',
        promulgated: true,
        id: 'spinach',
        type: 'bundle',
        tags: ['database']
      };
    } else {
      result = {
        name: 'spinach',
        displayName: 'spinach',
        url: 'http://example.com/spinach',
        downloads: 1000,
        owner: 'test-owner',
        promulgated: true,
        id: 'spinach',
        type: 'charm',
        iconPath: 'icon.svg',
        series: 'wily',
        tags: ['database']
      };
    }
    var mockModel = {};
    mockModel.toEntity = sinon.stub().returns(result);
    mockModel.get = function(key) {
      return result[key];
    };
    return [mockModel];
  };

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-details', function() { done(); });
  });

  it('can be rendered', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityDetails />);
    assert.equal(output.props.children, 'Loading...');
  });

  it('fetches and renders an entity properly', function() {
    var id = 'spinach';
    var changeState = sinon.spy();
    var mockData = setupMockData();
    var getEntity = sinon.stub().callsArgWith(1, mockData);
    var pluralize = sinon.spy();

    var output = testUtils.renderIntoDocument(
        <juju.components.EntityDetails
          changeState={changeState}
          getEntity={getEntity}
          id={id}
          pluralize={pluralize} />);

    assert.isTrue(getEntity.calledOnce,
                  'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
                 'getEntity not called with the entity ID');
    var entity = output.state.entityModel.toEntity();
    assert.equal(entity.id, id,
                 'entity ID does not match the ID requested');
    var root = output.getDOMNode();
    var title = root.querySelector('.header__title');
    assert.equal(entity.displayName, title.textContent,
                 'rendered name does not match entity name');
    var owner = root.querySelector('.header__by a');
    assert.equal(entity.owner, owner.textContent,
                 'rendered owner does not match entity owner');
    var downloads = root.querySelector('.bundle-stats__deploys-count');
    assert.equal(entity.downloads, downloads.textContent,
                 'rendered downloads does not match entity downloads');
  });

  it('dispatches to search when a tag is clicked', function() {
    var id = 'spinach';
    var tag = 'database';
    var mockData = setupMockData();
    var getEntity = sinon.stub().callsArgWith(1, mockData);
    var pluralize = sinon.spy();
    var changeState = sinon.stub();

    var component = testUtils.renderIntoDocument(
      <juju.components.EntityDetails
        changeState={changeState}
        getEntity={getEntity}
        id={id}
        pluralize={pluralize} />);
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
    var mockData = setupMockData();
    var getEntity = sinon.stub().callsArgWith(1, mockData);
    var pluralize = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize} />, true);
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize}
        id="django"/>, true);
    output = shallowRenderer.getRenderOutput();
    var deployButton = output.props.children.props.children.props.children
                             .props.children[1].props.children[1];
    assert.deepEqual(deployButton,
      <juju.components.GenericButton
        action={deployButton.props.action}
        type="confirm"
        title="Add to canvas" />);
  });

  it('adds the service when the add button is clicked', function() {
    var mockData = setupMockData();
    var getEntity = sinon.stub().callsArgWith(1, mockData);
    var pluralize = sinon.spy();
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        deployService={deployService}
        changeState={changeState}
        getEntity={getEntity}
        pluralize={pluralize} />, true);
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.EntityDetails
      getEntity={getEntity}
      deployService={deployService}
      changeState={changeState}
      pluralize={pluralize}
      id="django"/>, true);
    output = shallowRenderer.getRenderOutput();
    output.props.children.props.children.props.children.props.children[1]
          .props.children[1].props.action();
    assert.equal(deployService.callCount, 1);
    assert.equal(deployService.args[0][0], mockData[0]);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: null
      }
    });
  });

  it('can display the series for a charm', function() {
    var mockData = setupMockData();
    var getEntity = sinon.stub().callsArgWith(1, mockData);
    var pluralize = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize} />, true);
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize}
        id="django"/>, true);
    output = shallowRenderer.getRenderOutput();
    var seriesNode = output.props.children.props.children.props.children
                           .props.children[0].props.children[1]
                           .props.children[2].props.children[1];
    assert.deepEqual(seriesNode,
      <li className="header__series">wily</li>);
  });

  it('does not display the series for a bundle', function() {
    var mockData = setupMockData(true);
    var getEntity = sinon.stub().callsArgWith(1, mockData);
    var pluralize = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize} />, true);
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize}
        id="django"/>, true);
    output = shallowRenderer.getRenderOutput();
    var seriesNode = output.props.children.props.children.props.children
                           .props.children[0].props.children[1]
                           .props.children[2].props.children[1];
    assert.isNull(seriesNode);
  });

  it('displays the icon for a charm', function() {
    var mockData = setupMockData();
    var getEntity = sinon.stub().callsArgWith(1, mockData);
    var pluralize = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize} />, true);
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize}
        id="django"/>, true);
    output = shallowRenderer.getRenderOutput();
    var imgNode = output.props.children.props.children.props.children
                        .props.children[0].props.children[0];
    assert.deepEqual(imgNode,
      <img src="icon.svg" alt="spinach"
           width="96" className="header__icon"/>);
  });

  it('displays the default icon for a bundle', function() {
    var mockData = setupMockData(true);
    var getEntity = sinon.stub().callsArgWith(1, mockData);
    var pluralize = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize} />, true);
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.EntityDetails
        getEntity={getEntity}
        pluralize={pluralize}
        id="django"/>, true);
    output = shallowRenderer.getRenderOutput();
    var imgNode = output.props.children.props.children.props.children
                        .props.children[0].props.children[0];
    assert.deepEqual(imgNode,
      <img src="/juju-ui/assets/images/non-sprites/bundle.svg" alt="spinach"
           width="96" className="header__icon"/>);
  });
});
