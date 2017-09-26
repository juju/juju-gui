/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Charmbrowser = require('./charmbrowser');
const EntityDetails = require('../entity-details/entity-details');
const Panel = require('../panel/panel');
const SearchResults = require('../search-results/search-results');
const Store = require('../store/store');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Charmbrowser', function() {
  var acl, appState;

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    appState = {
      current: {},
      changeState: sinon.stub()
    };
  });

  it('displays the search results when the app state calls for it', function() {
    const query = 'django';
    appState.current.search = {text: query};
    appState.generatePath = sinon.stub();
    const series = {};
    const addNotification = sinon.stub();
    const deployService = sinon.stub();
    const deployTarget = sinon.stub();
    const getBundleYAML = sinon.stub();
    const importBundleYAML = sinon.stub();
    const charmstoreSearch = sinon.stub();
    const setPageTitle = sinon.stub();
    const makeEntityModel = sinon.spy();
    const utils = {getName: sinon.stub()};
    const renderer = jsTestUtils.shallowRender(
      <Charmbrowser
        acl={acl}
        addNotification={addNotification}
        apiUrl="http://example.com/"
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={charmstoreSearch}
        charmstoreURL="http://1.2.3.4/"
        deployService={deployService}
        deployTarget={deployTarget}
        flags={{}}
        getBundleYAML={getBundleYAML}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        getModelName={sinon.stub()}
        gisf={true}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={makeEntityModel}
        renderMarkdown={sinon.stub()}
        series={series}
        setPageTitle={setPageTitle}
        showTerms={sinon.stub()}
        urllib={sinon.stub()}
        utils={utils} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const searchResults = output.props.children.props.children.props;
    const expected = (
      <Panel
        instanceName="white-box"
        clickAction={instance._close}
        focus={false}
        visible={true}>
        <div className="charmbrowser"
          ref="charmbrowser">
          <SearchResults
            acl={acl}
            changeState={searchResults.changeState}
            charmstoreSearch={charmstoreSearch}
            deployTarget={deployTarget}
            generatePath={searchResults.generatePath}
            getName={utils.getName}
            makeEntityModel={makeEntityModel}
            owner={undefined}
            provides={undefined}
            query={query}
            requires={undefined}
            series={undefined}
            seriesList={series}
            setPageTitle={setPageTitle}
            sort={undefined}
            tags={undefined}
            type={undefined} />
        </div>
      </Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('displays the store when the app state calls for it', function() {
    const charmstoreSearch = sinon.stub();
    const setPageTitle = sinon.stub();
    const utils = {getName: sinon.stub()};
    const makeEntityModel = sinon.spy();
    const seriesList = {};
    const renderer = jsTestUtils.shallowRender(
      <Charmbrowser
        acl={acl}
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={charmstoreSearch}
        charmstoreURL="http://1.2.3.4/"
        flags={{}}
        deployService={sinon.stub()}
        deployTarget={sinon.stub()}
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        getModelName={sinon.stub()}
        gisf={true}
        importBundleYAML={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={makeEntityModel}
        renderMarkdown={sinon.stub()}
        series={seriesList}
        setPageTitle={setPageTitle}
        showTerms={sinon.stub()}
        staticURL='surl'
        urllib={sinon.stub()}
        utils={utils} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <Panel
        instanceName="white-box"
        clickAction={instance._close}
        focus={false}
        visible={true}>
        <div className="charmbrowser"
          ref="charmbrowser">
          <Store
            staticURL='surl'
            apiVersion="v5"
            charmstoreURL="http://1.2.3.4/"
            changeState={
              output.props.children.props.children.props.changeState}
            gisf={true}
            setPageTitle={setPageTitle} />
        </div>
      </Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('displays entity details when the app state calls for it', function() {
    const id = 'foobar';
    const apiUrl = 'http://example.com';
    appState.current.store = id;
    appState.current.hash = 'readme';
    const getEntity = sinon.spy();
    const makeEntityModel = sinon.spy();
    const clearLightbox = sinon.stub();
    const displayLightbox = sinon.stub();
    const deployService = sinon.spy();
    const importBundleYAML = sinon.spy();
    const getBundleYAML = sinon.spy();
    const getModelName = sinon.spy();
    const getFile = sinon.spy();
    const renderMarkdown = sinon.spy();
    const getDiagramURL = sinon.spy();
    const listPlansForCharm = sinon.spy();
    const addNotification = sinon.spy();
    const showTerms = sinon.stub();
    const utils = {
      pluralize: sinon.spy()
    };
    const setPageTitle = sinon.spy();
    const urllib = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Charmbrowser
        acl={acl}
        addNotification={addNotification}
        apiUrl={apiUrl}
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={sinon.stub()}
        charmstoreURL="http://1.2.3.4/"
        clearLightbox={clearLightbox}
        deployService={deployService}
        deployTarget={sinon.stub()}
        displayLightbox={displayLightbox}
        flags={{'test.ddeploy': true}}
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        getModelName={getModelName}
        gisf={true}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={listPlansForCharm}
        makeEntityModel={makeEntityModel}
        utils={utils}
        renderMarkdown={renderMarkdown}
        series={{}}
        setPageTitle={setPageTitle}
        showTerms={showTerms}
        staticURL="http://example.com"
        urllib={urllib}
      />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expectedOutput = (
      <Panel
        instanceName="white-box"
        clickAction={instance._close}
        focus={false}
        visible={true}>
        <div className="charmbrowser"
          ref="charmbrowser">
          <EntityDetails
            acl={acl}
            apiUrl={apiUrl}
            importBundleYAML={importBundleYAML}
            getBundleYAML={getBundleYAML}
            changeState={
              output.props.children.props.children.props.changeState}
            clearLightbox={clearLightbox}
            displayLightbox={displayLightbox}
            flags={{'test.ddeploy': true}}
            getEntity={getEntity}
            getModelName={getModelName}
            hash="readme"
            scrollPosition={0}
            listPlansForCharm={listPlansForCharm}
            makeEntityModel={makeEntityModel}
            getDiagramURL={getDiagramURL}
            getFile={getFile}
            renderMarkdown={renderMarkdown}
            deployService={deployService}
            id={id}
            addNotification={addNotification}
            pluralize={utils.pluralize}
            scrollCharmbrowser={instance._scrollCharmbrowser}
            setPageTitle={setPageTitle}
            showTerms={showTerms}
            urllib={urllib}
          />
        </div>
      </Panel>);
    expect(output).toEqualJSX(expectedOutput);
  });

  it('closes when clicked outside', function() {
    appState.current.user = 'spinch/koala';
    const utils = {
      pluralize: sinon.stub()
    };
    const renderer = jsTestUtils.shallowRender(
      <Charmbrowser
        acl={acl}
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={sinon.stub()}
        charmstoreURL="http://1.2.3.4/"
        deployService={sinon.stub()}
        deployTarget={sinon.stub()}
        flags={{}}
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        getModelName={sinon.stub()}
        gisf={true}
        importBundleYAML={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={sinon.stub()}
        renderMarkdown={sinon.stub()}
        series={{}}
        setPageTitle={sinon.stub()}
        showTerms={sinon.stub()}
        urllib={sinon.stub()}
        utils={utils} />, true);
    const output = renderer.getRenderOutput();
    output.props.clickAction();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      hash: null,
      root: null,
      search: null,
      store: null
    });
  });
});
