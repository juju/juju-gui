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
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-details', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can be rendered', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        id="test"
        deployService={sinon.spy()}
        changeState={sinon.spy()}
        getEntity={sinon.spy()}
        pluralize={sinon.spy()} />);
    assert.equal(output.props.className, 'entity-details');
  });

  it('fetches an entity properly', function() {
    var id = mockEntity.get('id');
    var getEntity = sinon.stub().callsArgWith(1, [mockEntity]);
    var deployService = sinon.spy();
    var changeState = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var pluralize = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.EntityDetails
          deployService={deployService}
          changeState={changeState}
          importBundleYAML={importBundleYAML}
          getBundleYAML={getBundleYAML}
          getEntity={getEntity}
          getFile={getFile}
          renderMarkdown={renderMarkdown}
          id={id}
          pluralize={pluralize} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(getEntity.calledOnce,
                  'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
                 'getEntity not called with the entity ID');
    var expected = (
      <div className={'entity-details charm'}>
        <juju.components.EntityHeader
          entityModel={mockEntity}
          importBundleYAML={importBundleYAML}
          getBundleYAML={getBundleYAML}
          changeState={changeState}
          deployService={deployService}
          pluralize={pluralize} />
        {undefined}
        <juju.components.EntityContent
          getFile={getFile}
          renderMarkdown={renderMarkdown}
          entityModel={mockEntity} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display a bundle diagram', function() {
    var mockEntity = jsTestUtils.makeEntity(true);
    var id = mockEntity.get('id');
    var getEntity = sinon.stub().callsArgWith(1, [mockEntity]);
    var deployService = sinon.spy();
    var changeState = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var pluralize = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var getDiagramURL = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.EntityDetails
          deployService={deployService}
          changeState={changeState}
          importBundleYAML={importBundleYAML}
          getBundleYAML={getBundleYAML}
          getEntity={getEntity}
          getFile={getFile}
          renderMarkdown={renderMarkdown}
          getDiagramURL={getDiagramURL}
          id={id}
          pluralize={pluralize} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(getEntity.calledOnce,
                  'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
                 'getEntity not called with the entity ID');
    var expected = (
      <div className={'entity-details bundle'}>
        <juju.components.EntityHeader
          entityModel={mockEntity}
          importBundleYAML={importBundleYAML}
          getBundleYAML={getBundleYAML}
          changeState={changeState}
          deployService={deployService}
          pluralize={pluralize} />
        <juju.components.EntityContentDiagram
          getDiagramURL={getDiagramURL}
          id={id} />
        <juju.components.EntityContent
          getFile={getFile}
          renderMarkdown={renderMarkdown}
          entityModel={mockEntity} />
      </div>);
    assert.deepEqual(output, expected);
  });
});
