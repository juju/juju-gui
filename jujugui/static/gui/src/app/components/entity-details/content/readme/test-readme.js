/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EntityContentReadme = require('./readme');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('EntityContentReadme', function() {
  let getContainer, mockEntity, renderMarkdown;

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <EntityContentReadme
        addNotification={options.addNotification || sinon.stub()}
        changeState={options.changeState || sinon.stub()}
        entityModel={options.entityModel || mockEntity}
        getFile={options.getFile || sinon.stub()}
        hash={options.hash}
        renderMarkdown={options.renderMarkdown || renderMarkdown}
        scrollCharmbrowser={options.scrollCharmbrowser || sinon.stub()} />,
      { disableLifecycleMethods: true });
    const instance = wrapper.instance();
    // Stub the method for getting the container node so that the component
    // works in the shallow renderer.
    getContainer = sinon.stub(instance, '_getContainer');
    getContainer.returns({querySelectorAll: sinon.stub().returns([])});
    instance.componentDidMount();
    wrapper.update();
    return wrapper;
  };

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
    renderMarkdown = sinon.stub().returns('<p>Readme</p>');
    renderMarkdown.Renderer = sinon.stub();
  });

  afterEach(function() {
    mockEntity = undefined;
    getContainer.restore();
  });

  it('can display a readme', function() {
    var getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    var mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const wrapper = renderComponent({
      getFile,
      entityModel: mockEntity
    });
    assert.equal(getFile.callCount, 1);
    assert.equal(getFile.args[0][0], 'cs:django');
    assert.equal(getFile.args[0][1], 'Readme.md');
    assert.equal(renderMarkdown.callCount, 1);
    assert.equal(renderMarkdown.args[0][0], 'mock markdown');
    const expected = (
      <div className="entity-content__readme">
        <div className="entity-content__readme-content"
          dangerouslySetInnerHTML={{__html: '<p>Readme</p>'}}
          ref="content" />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('will cancel the readme request when unmounting', function() {
    var abort = sinon.stub();
    var getFile = sinon.stub().returns({abort: abort});
    var mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const wrapper = renderComponent({
      getFile,
      entityModel: mockEntity
    });
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
    assert.equal(renderMarkdown.callCount, 0);
  });

  it('can display a message if there is no readme file', function() {
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.entity-content__readme-content').html().includes(
        'No readme.'), true);
  });

  it('displays a message if there is an error getting the file', function() {
    var getFile = sinon.stub().callsArgWith(2, 'No file');
    var mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const wrapper = renderComponent({
      getFile,
      entityModel: mockEntity
    });
    assert.equal(getFile.callCount, 1);
    assert.equal(getFile.args[0][0], 'cs:django');
    assert.equal(getFile.args[0][1], 'Readme.md');
    assert.equal(renderMarkdown.callCount, 0);
    assert.equal(
      wrapper.find('.entity-content__readme-content').html().includes(
        'No readme.'), true);
  });

  it('can scroll to an element after loading the readme', () => {
    const getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const scrollCharmbrowser = sinon.stub();
    renderComponent({
      getFile,
      entityModel: mockEntity,
      hash: 'readme',
      scrollCharmbrowser
    });
    assert.equal(scrollCharmbrowser.callCount, 1);
  });

  it('does not scroll to an element if there is no hash', () => {
    const getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const scrollCharmbrowser = sinon.stub();
    renderComponent({
      getFile,
      entityModel: mockEntity,
      scrollCharmbrowser
    });
    assert.equal(scrollCharmbrowser.callCount, 0);
  });

  it('can scroll to an element if the hash changes', () => {
    const getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const scrollCharmbrowser = sinon.stub();
    const wrapper = renderComponent({
      getFile,
      entityModel: mockEntity,
      hash: 'readme',
      scrollCharmbrowser
    });
    const instance = wrapper.instance();
    instance.componentDidUpdate({hash: 'another'});
    assert.equal(scrollCharmbrowser.callCount, 2);
  });

  it('does not scroll to an element if the hash does not change', () => {
    const getFile = sinon.stub().callsArgWith(2, null, 'mock markdown');
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    const scrollCharmbrowser = sinon.stub();
    const wrapper = renderComponent({
      getFile,
      entityModel: mockEntity,
      hash: 'readme',
      scrollCharmbrowser
    });
    const instance = wrapper.instance();
    instance.componentDidUpdate({hash: 'readme'});
    assert.equal(scrollCharmbrowser.callCount, 1);
  });

  it('handles error when getting the readme', function() {
    const addNotification = sinon.stub();
    const getFile = sinon.stub().callsArgWith(2, 'Uh oh!', null);
    const mockEntity = jsTestUtils.makeEntity(false, {files: ['Readme.md']});
    renderComponent({
      addNotification,
      getFile,
      entityModel: mockEntity
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to get readme',
      message: 'unable to get readme: Uh oh!',
      level: 'error'
    });
  });
});
