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

describe('EntityContentReadme', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('entity-content-readme', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can display a readme', function() {
    var renderMarkdown = sinon.stub().returns('<p>Readme</p>');
    var getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    var mockEntity = jsTestUtils.makeEntity(false, ['Readme.md']);
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentReadme
        renderMarkdown={renderMarkdown}
        getFile={getFile}
        entityModel={mockEntity} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.equal(getFile.callCount, 1);
    assert.equal(getFile.args[0][0], 'cs:~charmers/wily/django');
    assert.equal(getFile.args[0][1], 'Readme.md');
    assert.equal(renderMarkdown.callCount, 1);
    assert.equal(renderMarkdown.args[0][0], 'mock markdown');
    assert.deepEqual(output,
      <div className="entity-content__readme">
        <h2 className="entity-content__header" id="readme">Readme</h2>
        <div className="entity-content__readme-content"
          ref="content"
          dangerouslySetInnerHTML={{__html: '<p>Readme</p>'}} />
      </div>);
  });

  it('will cancel the readme request when unmounting', function() {
    var abort = sinon.stub();
    var renderMarkdown = sinon.stub();
    var getFile = sinon.stub().returns({abort: abort});
    var mockEntity = jsTestUtils.makeEntity(false, ['Readme.md']);
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentReadme
        getFile={getFile}
        entityModel={mockEntity}
        renderMarkdown={renderMarkdown}/>, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    shallowRenderer.unmount();
    assert.equal(abort.callCount, 1);
    assert.equal(renderMarkdown.callCount, 0);
  });

  it('can display a message if there is no readme file', function() {
    var component = testUtils.renderIntoDocument(
      <juju.components.EntityContentReadme
        renderMarkdown={sinon.spy()}
        getFile={sinon.spy()}
        entityModel={mockEntity} />
    );
    assert.equal(component.refs['content'].textContent, 'No readme.');
  });

  it('displays a message if there is an error getting the file', function() {
    var renderMarkdown = sinon.stub().returns('<p>Readme</p>');
    var getFile = sinon.stub().callsArgWith(2, 'No file');
    var mockEntity = jsTestUtils.makeEntity(false, ['Readme.md']);
    var component = testUtils.renderIntoDocument(
      <juju.components.EntityContentReadme
        renderMarkdown={renderMarkdown}
        getFile={getFile}
        entityModel={mockEntity} />
    );
    assert.equal(getFile.callCount, 1);
    assert.equal(getFile.args[0][0], 'cs:~charmers/wily/django');
    assert.equal(getFile.args[0][1], 'Readme.md');
    assert.equal(renderMarkdown.callCount, 0);
    assert.equal(component.refs['content'].textContent, 'No readme.');
  });
});
