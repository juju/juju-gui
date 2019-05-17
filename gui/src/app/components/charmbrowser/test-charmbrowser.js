/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('../../../test/fake-analytics');
const Charmbrowser = require('./charmbrowser');

describe('Charmbrowser', function() {
  var acl, appState, charmstore;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Charmbrowser
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      addToModel={options.addToModel || sinon.stub()}
      analytics={Analytics}
      appState={options.appState || {}}
      charmstore={options.charmstore || charmstore}
      charmstoreURL={options.charmstoreURL || 'http://1.2.3.4/'}
      clearLightbox={options.clearLightbox}
      deployService={options.deployService || sinon.stub()}
      displayLightbox={options.displayLightbox}
      flags={options.flags || {}}
      getModelName={options.getModelName || sinon.stub()}
      gisf={options.gisf === undefined ? true : options.gisf}
      importBundleYAML={options.importBundleYAML || sinon.stub()}
      listPlansForCharm={options.listPlansForCharm || sinon.stub()}
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
      getEntity: sinon.stub(),
      getFile: sinon.stub(),
      search: sinon.stub(),
      url: 'http://example.com'
    };
  });

  it('displays the search results when the app state calls for it', function() {
    const query = 'django';
    appState.current.search = {text: query};
    appState.generatePath = sinon.stub();
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
      setPageTitle
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('displays the store when the app state calls for it', function() {
    const setPageTitle = sinon.stub();
    const wrapper = renderComponent({
      appState,
      setPageTitle,
      staticURL: 'surl'
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('displays entity details when the app state calls for it', function() {
    const id = 'foobar';
    appState.current.store = id;
    appState.current.hash = 'readme';
    const clearLightbox = sinon.stub();
    const displayLightbox = sinon.stub();
    const deployService = sinon.spy();
    const importBundleYAML = sinon.spy();
    const getModelName = sinon.spy();
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
      getModelName,
      importBundleYAML,
      listPlansForCharm,
      setPageTitle,
      showTerms,
      staticURL: 'http://example.com'
    });
    expect(wrapper).toMatchSnapshot();
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
