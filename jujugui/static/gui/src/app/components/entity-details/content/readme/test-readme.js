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
  let mockEntity, renderMarkdown;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('entity-content-readme', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
    renderMarkdown = sinon.stub().returns('<p>Readme</p>');
    renderMarkdown.Renderer = sinon.stub();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can display a readme', function() {
    var getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    var mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const changeState = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentReadme
        changeState={changeState}
        renderMarkdown={renderMarkdown}
        getFile={getFile}
        entityModel={mockEntity}
        scrollCharmbrowser={sinon.stub()} />, true);
    const instance = shallowRenderer.getMountedInstance();
    const getContainer = sinon.stub(instance, '_getContainer');
    getContainer.returns({querySelectorAll: sinon.stub().returns([])});
    instance.componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    getContainer.restore();
    assert.equal(getFile.callCount, 1);
    assert.equal(getFile.args[0][0], 'cs:django');
    assert.equal(getFile.args[0][1], 'Readme.md');
    assert.equal(renderMarkdown.callCount, 1);
    assert.equal(renderMarkdown.args[0][0], 'mock markdown');
    expect(output).toEqualJSX(
      <div className="entity-content__readme">
        <div className="entity-content__readme-content"
          ref="content"
          dangerouslySetInnerHTML={{__html: '<p>Readme</p>'}} />
      </div>);
  });

  it('will cancel the readme request when unmounting', function() {
    var abort = sinon.stub();
    var getFile = sinon.stub().returns({abort: abort});
    var mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentReadme
        changeState={sinon.stub()}
        getFile={getFile}
        entityModel={mockEntity}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()} />, true);
    const instance = shallowRenderer.getMountedInstance();
    const getContainer = sinon.stub(instance, '_getContainer');
    getContainer.returns({querySelectorAll: sinon.stub().returns([])});
    instance.componentDidMount();
    shallowRenderer.unmount();
    getContainer.restore();
    assert.equal(abort.callCount, 1);
    assert.equal(renderMarkdown.callCount, 0);
  });

  it('can display a message if there is no readme file', function() {
    var component = testUtils.renderIntoDocument(
      <juju.components.EntityContentReadme
        changeState={sinon.stub()}
        renderMarkdown={sinon.spy()}
        getFile={sinon.spy()}
        entityModel={mockEntity}
        scrollCharmbrowser={sinon.stub()} />
    );
    assert.equal(component.refs['content'].textContent, 'No readme.');
  });

  it('displays a message if there is an error getting the file', function() {
    var getFile = sinon.stub().callsArgWith(2, 'No file');
    var mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    var component = testUtils.renderIntoDocument(
      <juju.components.EntityContentReadme
        changeState={sinon.stub()}
        renderMarkdown={renderMarkdown}
        getFile={getFile}
        entityModel={mockEntity}
        scrollCharmbrowser={sinon.stub()} />
    );
    assert.equal(getFile.callCount, 1);
    assert.equal(getFile.args[0][0], 'cs:django');
    assert.equal(getFile.args[0][1], 'Readme.md');
    assert.equal(renderMarkdown.callCount, 0);
    assert.equal(component.refs['content'].textContent, 'No readme.');
  });

  it('can scroll to an element after loading the readme', () => {
    const getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const scrollCharmbrowser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentReadme
        changeState={sinon.stub()}
        renderMarkdown={renderMarkdown}
        getFile={getFile}
        hash="readme"
        entityModel={mockEntity}
        scrollCharmbrowser={scrollCharmbrowser} />, true);
    const instance = renderer.getMountedInstance();
    const getContainer = sinon.stub(instance, '_getContainer');
    getContainer.returns({querySelectorAll: sinon.stub().returns([])});
    instance.componentDidMount();
    getContainer.restore();
    assert.equal(scrollCharmbrowser.callCount, 1);
  });

  it('does not scroll to an element if there is no hash', () => {
    const getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const scrollCharmbrowser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentReadme
        changeState={sinon.stub()}
        renderMarkdown={renderMarkdown}
        getFile={getFile}
        entityModel={mockEntity}
        scrollCharmbrowser={scrollCharmbrowser} />, true);
    const instance = renderer.getMountedInstance();
    const getContainer = sinon.stub(instance, '_getContainer');
    getContainer.returns({querySelectorAll: sinon.stub().returns([])});
    instance.componentDidMount();
    getContainer.restore();
    assert.equal(scrollCharmbrowser.callCount, 0);
  });

  it('can scroll to an element if the hash changes', () => {
    const getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const scrollCharmbrowser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentReadme
        changeState={sinon.stub()}
        renderMarkdown={renderMarkdown}
        getFile={getFile}
        hash="readme"
        entityModel={mockEntity}
        scrollCharmbrowser={scrollCharmbrowser} />, true);
    const instance = renderer.getMountedInstance();
    const getContainer = sinon.stub(instance, '_getContainer');
    getContainer.returns({querySelectorAll: sinon.stub().returns([])});
    instance.componentDidUpdate({hash: 'another'});
    getContainer.restore();
    assert.equal(scrollCharmbrowser.callCount, 1);
  });

  it('does not scroll to an element if the hash does not change', () => {
    const getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const scrollCharmbrowser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentReadme
        changeState={sinon.stub()}
        renderMarkdown={renderMarkdown}
        getFile={getFile}
        hash="readme"
        entityModel={mockEntity}
        scrollCharmbrowser={scrollCharmbrowser} />, true);
    const instance = renderer.getMountedInstance();
    instance.componentDidUpdate({hash: 'readme'});
    assert.equal(scrollCharmbrowser.callCount, 0);
  });
});
