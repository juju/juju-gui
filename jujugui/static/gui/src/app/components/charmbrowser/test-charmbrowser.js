/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Charmbrowser = require('./charmbrowser');
const EntityDetails = require('../entity-details/entity-details');
const SearchResults = require('../search-results/search-results');
const Store = require('../store/store');

describe('Charmbrowser', function() {
  var acl, appState;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Charmbrowser
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      addToModel={options.addToModel || sinon.stub()}
      apiUrl={options.apiUrl || 'http://example.com/'}
      apiVersion={options.apiUrl || 'v5'}
      appState={options.appState || {}}
      charmstoreSearch={options.charmstoreSearch || sinon.stub()}
      charmstoreURL={options.apiUrl || 'http://1.2.3.4/'}
      clearLightbox={options.clearLightbox}
      deployService={options.deployService || sinon.stub()}
      displayLightbox={options.displayLightbox}
      flags={options.flags}
      getBundleYAML={options.getBundleYAML || sinon.stub()}
      getDiagramURL={options.getDiagramURL || sinon.stub()}
      getEntity={options.getEntity || sinon.stub()}
      getFile={options.getFile || sinon.stub()}
      getModelName={options.getModelName || sinon.stub()}
      gisf={options.gisf === undefined ? true : options.gisf}
      importBundleYAML={options.importBundleYAML || sinon.stub()}
      listPlansForCharm={options.listPlansForCharm || sinon.stub()}
      makeEntityModel={options.makeEntityModel || sinon.stub()}
      renderMarkdown={options.renderMarkdown || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      series={options.series || {}}
      setPageTitle={options.setPageTitle || sinon.stub()}
      showTerms={options.showTerms || sinon.stub()}
      staticURL={options.staticURL}
      urllib={options.urllib || sinon.stub()}
      utils={options.utils || {}} />
  );

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
    const addToModel = sinon.stub();
    const getBundleYAML = sinon.stub();
    const importBundleYAML = sinon.stub();
    const charmstoreSearch = sinon.stub();
    const setPageTitle = sinon.stub();
    const makeEntityModel = sinon.spy();
    const utils = {getName: sinon.stub()};
    const wrapper = renderComponent({
      addNotification,
      addToModel,
      appState,
      charmstoreSearch,
      deployService,
      getBundleYAML,
      importBundleYAML,
      makeEntityModel,
      series,
      setPageTitle,
      utils
    });
    const searchResults = wrapper.find('SearchResults');
    const expected = (
      <div className="charmbrowser"
        ref="charmbrowser">
        <SearchResults
          acl={acl}
          addToModel={addToModel}
          changeState={searchResults.prop('changeState')}
          charmstoreSearch={charmstoreSearch}
          generatePath={searchResults.prop('generatePath')}
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
      </div>);
    assert.compareJSX(wrapper.find('.charmbrowser'), expected);
  });

  it('displays the store when the app state calls for it', function() {
    const charmstoreSearch = sinon.stub();
    const setPageTitle = sinon.stub();
    const utils = {getName: sinon.stub()};
    const makeEntityModel = sinon.spy();
    const seriesList = {};
    const wrapper = renderComponent({
      appState,
      charmstoreSearch,
      makeEntityModel,
      seriesList,
      setPageTitle,
      staticURL: 'surl',
      utils
    });
    const expected = (
      <div className="charmbrowser"
        ref="charmbrowser">
        <Store
          apiVersion="v5"
          changeState={wrapper.find('Store').prop('changeState')}
          charmstoreURL="http://1.2.3.4/"
          gisf={true}
          setPageTitle={setPageTitle}
          staticURL='surl' />
      </div>);
    assert.compareJSX(wrapper.find('.charmbrowser'), expected);
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
    const wrapper = renderComponent({
      addNotification,
      apiUrl,
      appState,
      clearLightbox,
      deployService,
      displayLightbox,
      flags: {'test.ddeploy': true},
      getBundleYAML,
      getDiagramURL,
      getEntity,
      getFile,
      getModelName,
      importBundleYAML,
      listPlansForCharm,
      makeEntityModel,
      renderMarkdown,
      setPageTitle,
      showTerms,
      staticURL: 'http://example.com',
      urllib,
      utils
    });
    const entityDetails = wrapper.find('EntityDetails');
    const expected = (
      <div className="charmbrowser"
        ref="charmbrowser">
        <EntityDetails
          acl={acl}
          addNotification={addNotification}
          apiUrl={apiUrl}
          changeState={entityDetails.prop('changeState')}
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
          pluralize={utils.pluralize}
          renderMarkdown={renderMarkdown}
          scrollCharmbrowser={entityDetails.prop('scrollCharmbrowser')}
          scrollPosition={0}
          sendAnalytics={sinon.stub()}
          setPageTitle={setPageTitle}
          showTerms={showTerms}
          staticURL="http://example.com"
          urllib={urllib} />
      </div>);
    assert.compareJSX(wrapper.find('.charmbrowser'), expected);
  });

  it('closes when clicked outside', function() {
    appState.current.user = 'spinch/koala';
    const wrapper = renderComponent({
      appState
    });
    wrapper.props().clickAction();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      hash: null,
      root: null,
      search: null,
      store: null
    });
  });
});
