/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const shapeup = require('shapeup');

const Charmbrowser = require('./charmbrowser');
const EntityDetails = require('../entity-details/entity-details');
const SearchResults = require('../search-results/search-results');
const Store = require('../store/store');

describe('Charmbrowser', function() {
  var acl, appState, charmstore;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Charmbrowser
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      addToModel={options.addToModel || sinon.stub()}
      apiVersion={options.apiVersion || 'v5'}
      appState={options.appState || {}}
      charmstore={options.charmstore || charmstore}
      charmstoreURL={options.charmstoreURL || 'http://1.2.3.4/'}
      clearLightbox={options.clearLightbox}
      deployService={options.deployService || sinon.stub()}
      displayLightbox={options.displayLightbox}
      flags={options.flags || {}}
      getEntity={options.getEntity || sinon.stub()}
      getModelName={options.getModelName || sinon.stub()}
      gisf={options.gisf === undefined ? true : options.gisf}
      importBundleYAML={options.importBundleYAML || sinon.stub()}
      listPlansForCharm={options.listPlansForCharm || sinon.stub()}
      renderMarkdown={options.renderMarkdown || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      series={options.series || {}}
      setPageTitle={options.setPageTitle || sinon.stub()}
      showTerms={options.showTerms || sinon.stub()}
      staticURL={options.staticURL} />
  );

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    appState = {
      current: {},
      changeState: sinon.stub()
    };
    charmstore = {
      getBundleYAML: sinon.stub(),
      getDiagramURL: sinon.stub(),
      getFile: sinon.stub(),
      search: sinon.stub(),
      url: 'http://example.com'
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
    const setPageTitle = sinon.stub();
    const wrapper = renderComponent({
      addNotification,
      addToModel,
      appState,
      deployService,
      getBundleYAML,
      importBundleYAML,
      series,
      setPageTitle
    });
    const searchResults = wrapper.find('SearchResults');
    const expected = (
      <div className="charmbrowser"
        ref="charmbrowser">
        <SearchResults
          acl={acl}
          addToModel={addToModel}
          changeState={searchResults.prop('changeState')}
          charmstoreSearch={charmstore.search}
          generatePath={searchResults.prop('generatePath')}
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
    const setPageTitle = sinon.stub();
    const seriesList = {};
    const wrapper = renderComponent({
      appState,
      seriesList,
      setPageTitle,
      staticURL: 'surl'
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
          showExperts={undefined}
          staticURL='surl' />
      </div>);
    assert.compareJSX(wrapper.find('.charmbrowser'), expected);
  });

  it('displays entity details when the app state calls for it', function() {
    const id = 'foobar';
    appState.current.store = id;
    appState.current.hash = 'readme';
    const getEntity = sinon.spy();
    const clearLightbox = sinon.stub();
    const displayLightbox = sinon.stub();
    const deployService = sinon.spy();
    const importBundleYAML = sinon.spy();
    const getModelName = sinon.spy();
    const renderMarkdown = sinon.spy();
    const listPlansForCharm = sinon.spy();
    const addNotification = sinon.spy();
    const showTerms = sinon.stub();
    const setPageTitle = sinon.spy();
    const wrapper = renderComponent({
      addNotification,
      appState,
      clearLightbox,
      deployService,
      displayLightbox,
      flags: {'test.ddeploy': true},
      getEntity,
      getModelName,
      importBundleYAML,
      listPlansForCharm,
      renderMarkdown,
      setPageTitle,
      showTerms,
      staticURL: 'http://example.com'
    });
    const entityDetails = wrapper.find('EntityDetails');
    const expected = (
      <div className="charmbrowser"
        ref="charmbrowser">
        <EntityDetails
          acl={acl}
          addNotification={addNotification}
          changeState={entityDetails.prop('changeState')}
          charmstore={{
            getBundleYAML: charmstore.getBundleYAML,
            getDiagramURL: charmstore.getDiagramURL,
            getFile: charmstore.getFile,
            reshape: shapeup.reshapeFunc,
            url: charmstore.url
          }}
          clearLightbox={clearLightbox}
          deployService={deployService}
          displayLightbox={displayLightbox}
          flags={{'test.ddeploy': true}}
          getEntity={getEntity}
          getModelName={getModelName}
          hash="readme"
          id={id}
          importBundleYAML={importBundleYAML}
          listPlansForCharm={listPlansForCharm}
          renderMarkdown={renderMarkdown}
          scrollCharmbrowser={entityDetails.prop('scrollCharmbrowser')}
          scrollPosition={0}
          sendAnalytics={sinon.stub()}
          setPageTitle={setPageTitle}
          showTerms={showTerms}
          staticURL="http://example.com" />
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
