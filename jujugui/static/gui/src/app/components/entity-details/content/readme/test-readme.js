/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EntityContentReadme = require('./readme');

const jsTestUtils = require('../../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('EntityContentReadme', function() {
  let mockEntity, renderMarkdown;

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
      <EntityContentReadme
        addNotification={sinon.stub()}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        renderMarkdown={renderMarkdown}
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
          dangerouslySetInnerHTML={{__html: '<p>Readme</p>'}}
          ref="content" />
      </div>);
  });

  it('will cancel the readme request when unmounting', function() {
    var abort = sinon.stub();
    var getFile = sinon.stub().returns({abort: abort});
    var mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    var shallowRenderer = jsTestUtils.shallowRender(
      <EntityContentReadme
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={getFile}
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
      <EntityContentReadme
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.spy()}
        renderMarkdown={sinon.spy()}
        scrollCharmbrowser={sinon.stub()} />
    );
    assert.equal(component.refs['content'].textContent, 'No readme.');
  });

  it('displays a message if there is an error getting the file', function() {
    var getFile = sinon.stub().callsArgWith(2, 'No file');
    var mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    var component = testUtils.renderIntoDocument(
      <EntityContentReadme
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={getFile}
        renderMarkdown={renderMarkdown}
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
      <EntityContentReadme
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={getFile}
        hash="readme"
        renderMarkdown={renderMarkdown}
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
      <EntityContentReadme
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={getFile}
        renderMarkdown={renderMarkdown}
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
      <EntityContentReadme
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={getFile}
        hash="readme"
        renderMarkdown={renderMarkdown}
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
      <EntityContentReadme
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={getFile}
        hash="readme"
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser} />, true);
    const instance = renderer.getMountedInstance();
    instance.componentDidUpdate({hash: 'readme'});
    assert.equal(scrollCharmbrowser.callCount, 0);
  });

  it('handles error when getting the readme', function() {
    const addNotification = sinon.stub();
    const getFile = sinon.stub().callsArgWith(2, 'Uh oh!', null);
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const renderer = jsTestUtils.shallowRender(
      <EntityContentReadme
        addNotification={addNotification}
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={getFile}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to get readme',
      message: 'unable to get readme: Uh oh!',
      level: 'error'
    });
  });
});
