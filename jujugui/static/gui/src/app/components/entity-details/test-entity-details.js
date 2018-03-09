/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EntityDetails = require('./entity-details');
const EntityContent = require('./content/content');
const EntityHeader = require('./header/header');

const jsTestUtils = require('../../utils/component-test-utils');

describe('EntityDetails', function() {
  var acl, mockEntity, urllib;

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    mockEntity = jsTestUtils.makeEntity();
    urllib = sinon.stub();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('fetches an entity properly', function() {
    mockEntity.hasMetrics = sinon.stub().returns(false);
    const apiUrl = 'http://example.com';
    const id = mockEntity.get('id');
    const getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    const makeEntityModel = sinon.stub().returns(mockEntity);
    const deployService = sinon.spy();
    const changeState = sinon.spy();
    const clearLightbox = sinon.stub();
    const displayLightbox = sinon.stub();
    const importBundleYAML = sinon.spy();
    const getBundleYAML = sinon.spy();
    const getModelName = sinon.spy();
    const pluralize = sinon.spy();
    const getDiagramURL = sinon.stub();
    const getFile = sinon.spy();
    const renderMarkdown = sinon.spy();
    const addNotification = sinon.spy();
    const showTerms = sinon.stub();
    const scrollCharmbrowser = sinon.stub();
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        clearLightbox={clearLightbox}
        deployService={deployService}
        displayLightbox={displayLightbox}
        flags={{'test.ddeploy': true}}
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        getModelName={getModelName}
        hash="readme"
        id={id}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={makeEntityModel}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        scrollPosition={100}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    const output = shallowRenderer.getRenderOutput();
    assert.isTrue(getEntity.calledOnce,
      'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
      'getEntity not called with the entity ID');
    const expectedOutput = (
      <div className="entity-details charm"
        ref="content"
        tabIndex="0">
        <div>
          <EntityHeader
            acl={acl}
            addNotification={addNotification}
            changeState={changeState}
            deployService={deployService}
            entityModel={mockEntity}
            getBundleYAML={getBundleYAML}
            getModelName={getModelName}
            hasPlans={false}
            importBundleYAML={importBundleYAML}
            plans={null}
            pluralize={pluralize}
            scrollPosition={100}
            urllib={urllib} />
          {undefined}
          <EntityContent
            addNotification={addNotification}
            apiUrl={apiUrl}
            changeState={changeState}
            clearLightbox={clearLightbox}
            displayLightbox={displayLightbox}
            entityModel={mockEntity}
            flags={{'test.ddeploy': true}}
            getDiagramURL={getDiagramURL}
            getFile={getFile}
            hash="readme"
            hasPlans={false}
            plans={null}
            pluralize={pluralize}
            renderMarkdown={renderMarkdown}
            scrollCharmbrowser={scrollCharmbrowser}
            sendAnalytics={sinon.stub()}
            showTerms={showTerms}
            staticURL="http://example.com" />
        </div>
      </div>
    );
    expect(output).toEqualJSX(expectedOutput);
  });

  it('can display a message if there is a loading error', function() {
    const id = mockEntity.get('id');
    const getEntity = sinon.stub().callsArgWith(1, 'bad wolf', [mockEntity]);
    const deployService = sinon.spy();
    const changeState = sinon.spy();
    const importBundleYAML = sinon.spy();
    const getBundleYAML = sinon.spy();
    const pluralize = sinon.spy();
    const getFile = sinon.spy();
    const renderMarkdown = sinon.spy();
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        changeState={changeState}
        deployService={deployService}
        flags={{}}
        getBundleYAML={getBundleYAML}
        getDiagramURL={sinon.stub()}
        getEntity={getEntity}
        getFile={getFile}
        getModelName={sinon.stub()}
        id={id}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={sinon.spy()}
        makeEntityModel={sinon.spy()}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        scrollPosition={0}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    const output = shallowRenderer.getRenderOutput();
    const expectedOutput = (
      <div className="entity-details"
        ref="content"
        tabIndex="0">
        <p className="error">
          There was a problem while loading the entity details.
          You could try searching for another charm or bundle or go{' '}
          <span className="link"
            onClick={instance._handleBack}>
            back
          </span>.
        </p>
      </div>);
    expect(output).toEqualJSX(expectedOutput);
  });

  it('can display a bundle diagram', function() {
    const apiUrl = 'http://example.com';
    const mockEntity = jsTestUtils.makeEntity(true);
    const id = mockEntity.get('id');
    const getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    const makeEntityModel = sinon.stub().returns(mockEntity);
    const deployService = sinon.spy();
    const displayLightbox = sinon.stub();
    const changeState = sinon.spy();
    const clearLightbox = sinon.stub();
    const importBundleYAML = sinon.spy();
    const getBundleYAML = sinon.spy();
    const getModelName = sinon.spy();
    const pluralize = sinon.spy();
    const getFile = sinon.spy();
    const renderMarkdown = sinon.spy();
    const getDiagramURL = sinon.spy();
    const addNotification = sinon.spy();
    const showTerms = sinon.stub();
    const scrollCharmbrowser = sinon.stub();
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        clearLightbox={clearLightbox}
        deployService={deployService}
        displayLightbox={displayLightbox}
        flags={{'test.ddeploy': true}}
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        getModelName={getModelName}
        hash="readme"
        id={id}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={makeEntityModel}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        scrollPosition={100}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    const output = shallowRenderer.getRenderOutput();
    assert.isTrue(getEntity.calledOnce,
      'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
      'getEntity not called with the entity ID');
    const expectedOutput = (
      <div className={'entity-details bundle'}
        ref="content"
        tabIndex="0">
        <div>
          <EntityHeader
            acl={acl}
            addNotification={addNotification}
            changeState={changeState}
            deployService={deployService}
            entityModel={mockEntity}
            getBundleYAML={getBundleYAML}
            getModelName={getModelName}
            hasPlans={false}
            importBundleYAML={importBundleYAML}
            plans={null}
            pluralize={pluralize}
            scrollPosition={100}
            urllib={urllib} />
          <EntityContent
            addNotification={addNotification}
            apiUrl={apiUrl}
            changeState={changeState}
            clearLightbox={clearLightbox}
            displayLightbox={displayLightbox}
            entityModel={mockEntity}
            flags={{'test.ddeploy': true}}
            getDiagramURL={getDiagramURL}
            getFile={getFile}
            hash="readme"
            hasPlans={false}
            plans={null}
            pluralize={pluralize}
            renderMarkdown={renderMarkdown}
            scrollCharmbrowser={scrollCharmbrowser}
            sendAnalytics={sinon.stub()}
            showTerms={showTerms}
            staticURL="http://example.com" />
        </div>
      </div>);
    expect(output).toEqualJSX(expectedOutput);
  });

  it('will abort the request when unmounting', function() {
    const abort = sinon.stub();
    const id = mockEntity.get('id');
    const getEntity = sinon.stub().returns({abort: abort});
    const deployService = sinon.spy();
    const changeState = sinon.spy();
    const importBundleYAML = sinon.spy();
    const getBundleYAML = sinon.spy();
    const pluralize = sinon.spy();
    const getFile = sinon.spy();
    const renderMarkdown = sinon.spy();
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        changeState={changeState}
        deployService={deployService}
        flags={{}}
        getBundleYAML={getBundleYAML}
        getDiagramURL={sinon.stub()}
        getEntity={getEntity}
        getFile={getFile}
        getModelName={sinon.stub()}
        id={id}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={sinon.spy()}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        scrollPosition={0}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    instance.componentWillUnmount();
    assert.equal(abort.callCount, 1);
  });

  it('sets the focus when rendered', function() {
    const focus = sinon.stub();
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        changeState={sinon.spy()}
        deployService={sinon.spy()}
        flags={{}}
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.spy()}
        getFile={sinon.stub()}
        getModelName={sinon.stub()}
        id="test"
        importBundleYAML={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={sinon.spy()}
        pluralize={sinon.spy()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        scrollPosition={0}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: focus}};
    instance.componentDidMount();
    assert.equal(focus.callCount, 1);
  });

  it('can get plans', function() {
    mockEntity.hasMetrics = sinon.stub().returns(true);
    const plans = ['plan1', 'plan2'];
    const addNotification = sinon.spy();
    const apiUrl = 'http://example.com';
    const changeState = sinon.spy();
    const clearLightbox = sinon.stub();
    const deployService = sinon.spy();
    const displayLightbox = sinon.stub();
    const getBundleYAML = sinon.spy();
    const getDiagramURL = sinon.spy();
    const getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    const getFile = sinon.spy();
    const getModelName = sinon.spy();
    const id = mockEntity.get('id');
    const importBundleYAML = sinon.spy();
    const listPlansForCharm = sinon.stub().callsArgWith(1, null, plans);
    const makeEntityModel = sinon.stub().returns(mockEntity);
    const pluralize = sinon.spy();
    const renderMarkdown = sinon.spy();
    const showTerms = sinon.stub();
    const scrollCharmbrowser = sinon.stub();
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        clearLightbox={clearLightbox}
        deployService={deployService}
        displayLightbox={displayLightbox}
        flags={{'test.ddeploy': true}}
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        getModelName={getModelName}
        hash="readme"
        id={id}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={listPlansForCharm}
        makeEntityModel={makeEntityModel}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        scrollPosition={100}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    const output = shallowRenderer.getRenderOutput();
    assert.isTrue(getEntity.calledOnce,
      'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
      'getEntity not called with the entity ID');
    const expectedOutput = (
      <div className={'entity-details charm'}
        ref="content"
        tabIndex="0">
        <div>
          <EntityHeader
            acl={acl}
            addNotification={addNotification}
            changeState={changeState}
            deployService={deployService}
            entityModel={mockEntity}
            getBundleYAML={getBundleYAML}
            getModelName={getModelName}
            hasPlans={true}
            importBundleYAML={importBundleYAML}
            plans={plans}
            pluralize={pluralize}
            scrollPosition={100}
            urllib={urllib} />
          {undefined}
          <EntityContent
            addNotification={addNotification}
            apiUrl={apiUrl}
            changeState={changeState}
            clearLightbox={clearLightbox}
            displayLightbox={displayLightbox}
            entityModel={mockEntity}
            flags={{'test.ddeploy': true}}
            getDiagramURL={getDiagramURL}
            getFile={getFile}
            hash="readme"
            hasPlans={true}
            plans={plans}
            pluralize={pluralize}
            renderMarkdown={renderMarkdown}
            scrollCharmbrowser={scrollCharmbrowser}
            sendAnalytics={sinon.stub()}
            showTerms={showTerms}
            staticURL="http://example.com" />
        </div>
      </div>);
    expect(output).toEqualJSX(expectedOutput);
    assert.equal(listPlansForCharm.callCount, 1);
    assert.equal(listPlansForCharm.args[0][0], 'cs:django');
  });

  it('can set plans to empty on error', function() {
    mockEntity.hasMetrics = sinon.stub().returns(true);
    const addNotification = sinon.spy();
    const apiUrl = 'http://example.com';
    const changeState = sinon.spy();
    const clearLightbox = sinon.stub();
    const deployService = sinon.spy();
    const displayLightbox = sinon.stub();
    const getBundleYAML = sinon.spy();
    const getDiagramURL = sinon.spy();
    const getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    const getFile = sinon.spy();
    const getModelName = sinon.spy();
    const id = mockEntity.get('id');
    const importBundleYAML = sinon.spy();
    const listPlansForCharm = sinon.stub().callsArgWith(1, 'An error', null);
    const makeEntityModel = sinon.stub().returns(mockEntity);
    const pluralize = sinon.spy();
    const renderMarkdown = sinon.spy();
    const showTerms = sinon.stub();
    const scrollCharmbrowser = sinon.stub();
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        clearLightbox={clearLightbox}
        deployService={deployService}
        displayLightbox={displayLightbox}
        flags={{'test.ddeploy': true}}
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        getModelName={getModelName}
        hash="readme"
        id={id}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={listPlansForCharm}
        makeEntityModel={makeEntityModel}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        scrollPosition={100}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    const output = shallowRenderer.getRenderOutput();
    assert.isTrue(getEntity.calledOnce,
      'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
      'getEntity not called with the entity ID');
    const expectedOutput = (
      <div className={'entity-details charm'}
        ref="content"
        tabIndex="0">
        <div>
          <EntityHeader
            acl={acl}
            addNotification={addNotification}
            changeState={changeState}
            deployService={deployService}
            entityModel={mockEntity}
            getBundleYAML={getBundleYAML}
            getModelName={getModelName}
            hasPlans={true}
            importBundleYAML={importBundleYAML}
            plans={[]}
            pluralize={pluralize}
            scrollPosition={100}
            urllib={urllib} />
          {undefined}
          <EntityContent
            addNotification={addNotification}
            apiUrl={apiUrl}
            changeState={changeState}
            clearLightbox={clearLightbox}
            displayLightbox={displayLightbox}
            entityModel={mockEntity}
            flags={{'test.ddeploy': true}}
            getDiagramURL={getDiagramURL}
            getFile={getFile}
            hash="readme"
            hasPlans={true}
            plans={[]}
            pluralize={pluralize}
            renderMarkdown={renderMarkdown}
            scrollCharmbrowser={scrollCharmbrowser}
            sendAnalytics={sinon.stub()}
            showTerms={showTerms}
            staticURL="http://example.com" />
        </div>
      </div>);
    expect(output).toEqualJSX(expectedOutput);
    assert.equal(listPlansForCharm.callCount, 1);
  });

  it('handles errors when getting an entity', function() {
    mockEntity.hasMetrics = sinon.stub().returns(false);
    const addNotification = sinon.stub();
    const getEntity = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    const makeEntityModel = sinon.stub().returns(mockEntity);
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={addNotification}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        deployService={sinon.stub()}
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={getEntity}
        getFile={sinon.stub()}
        getModelName={sinon.stub()}
        hash="readme"
        id={mockEntity.get('id')}
        importBundleYAML={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={makeEntityModel}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        scrollPosition={100}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'cannot fetch the entity',
      message: 'cannot fetch the entity: Uh oh!',
      level: 'error'
    });
  });

  it('handles errors when getting plans', function() {
    mockEntity.hasMetrics = sinon.stub().returns(true);
    const addNotification = sinon.stub();
    const getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    const id = mockEntity.get('id');
    const listPlansForCharm = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    const makeEntityModel = sinon.stub().returns(mockEntity);
    const shallowRenderer = jsTestUtils.shallowRender(
      <EntityDetails
        acl={acl}
        addNotification={addNotification}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        deployService={sinon.stub()}
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={getEntity}
        getFile={sinon.stub()}
        getModelName={sinon.stub()}
        hash="readme"
        id={id}
        importBundleYAML={sinon.stub()}
        listPlansForCharm={listPlansForCharm}
        makeEntityModel={makeEntityModel}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        scrollPosition={100}
        sendAnalytics={sinon.stub()}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com"
        urllib={urllib} />, true);
    const instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    shallowRenderer.getRenderOutput();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Fetching plans failed',
      message: 'Fetching plans failed: Uh oh!',
      level: 'error'
    });
  });
});
