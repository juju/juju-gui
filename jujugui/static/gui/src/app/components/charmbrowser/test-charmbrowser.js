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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Charmbrowser', function() {
  var acl, appState;

  beforeAll(function(done) {
    // Mock these out since we just do shallow renders.
    juju.components.Panel = function() {};
    // By loading this file it adds the component to the juju components.
    YUI().use('charmbrowser-component', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    appState = {
      current: {},
      changeState: sinon.stub()
    };
  });

  it('displays the search results when the app state calls for it', function() {
    var query = 'django';
    appState.current.search = {text: query};
    var series = {};
    var charmstoreSearch = sinon.stub();
    var makeEntityModel = sinon.spy();
    var utils = {getName: sinon.stub()};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        acl={acl}
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={charmstoreSearch}
        charmstoreURL="http://1.2.3.4/"
        deployService={sinon.stub()}
        displayPlans={true}
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={makeEntityModel}
        utils={utils}
        renderMarkdown={sinon.stub()}
        series={series} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
        <juju.components.Panel
          instanceName="white-box"
          clickAction={instance._close}
          focus={false}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            <juju.components.SearchResults
              changeState={
                output.props.children.props.children.props.changeState}
              getName={utils.getName}
              seriesList={series}
              makeEntityModel={makeEntityModel}
              query={query}
              tags={undefined}
              sort={undefined}
              type={undefined}
              series={undefined}
              provides={undefined}
              requires={undefined}
              owner={undefined}
              charmstoreSearch={charmstoreSearch} />
            </div>
        </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('displays the store when the app state calls for it', function() {
    var charmstoreSearch = sinon.stub();
    var utils = {getName: sinon.stub()};
    var makeEntityModel = sinon.spy();
    var seriesList = {};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        acl={acl}
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={charmstoreSearch}
        charmstoreURL="http://1.2.3.4/"
        deployService={sinon.stub()}
        displayPlans={true}
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={makeEntityModel}
        utils={utils}
        renderMarkdown={sinon.stub()}
        staticURL='surl'
        series={seriesList}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
        <juju.components.Panel
          instanceName="white-box"
          clickAction={instance._close}
          focus={false}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            <juju.components.Store
              staticURL='surl'
              apiVersion="v5"
              charmstoreURL="http://1.2.3.4/"
              changeState={
                output.props.children.props.children.props.changeState} />
          </div>
        </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('displays entity details when the app state calls for it', function() {
    var id = 'foobar';
    var apiUrl = 'http://example.com';
    appState.current.store = id;
    var getEntity = sinon.spy();
    var makeEntityModel = sinon.spy();
    var deployService = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var getDiagramURL = sinon.spy();
    var listPlansForCharm = sinon.spy();
    var addNotification = sinon.spy();
    var utils = {
      pluralize: sinon.spy()
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        acl={acl}
        addNotification={addNotification}
        apiUrl={apiUrl}
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={sinon.stub()}
        charmstoreURL="http://1.2.3.4/"
        deployService={deployService}
        displayPlans={true}
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={listPlansForCharm}
        makeEntityModel={makeEntityModel}
        utils={utils}
        renderMarkdown={renderMarkdown}
        series={{}} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const expected = (
        <juju.components.Panel
          instanceName="white-box"
          clickAction={instance._close}
          focus={false}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            <juju.components.EntityDetails
              acl={acl}
              apiUrl={apiUrl}
              importBundleYAML={importBundleYAML}
              getBundleYAML={getBundleYAML}
              changeState={
                output.props.children.props.children.props.changeState}
              getEntity={getEntity}
              scrollPosition={0}
              listPlansForCharm={listPlansForCharm}
              makeEntityModel={makeEntityModel}
              getDiagramURL={getDiagramURL}
              getFile={getFile}
              renderMarkdown={renderMarkdown}
              deployService={deployService}
              displayPlans={true}
              id={id}
              addNotification={addNotification}
              pluralize={utils.pluralize} />
          </div>
        </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('displays entity details when the state has a user path', function() {
    const apiUrl = 'http://example.com';
    appState.current.user = 'spinch/koala';
    const getEntity = sinon.stub();
    const makeEntityModel = sinon.stub();
    const deployService = sinon.stub();
    const importBundleYAML = sinon.stub();
    const getBundleYAML = sinon.stub();
    const getFile = sinon.stub();
    const renderMarkdown = sinon.stub();
    const getDiagramURL = sinon.stub();
    const listPlansForCharm = sinon.stub();
    const addNotification = sinon.stub();
    const utils = {
      pluralize: sinon.stub()
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        acl={acl}
        addNotification={addNotification}
        apiUrl={apiUrl}
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={sinon.stub()}
        charmstoreURL="http://1.2.3.4/"
        deployService={deployService}
        displayPlans={true}
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        importBundleYAML={importBundleYAML}
        listPlansForCharm={listPlansForCharm}
        makeEntityModel={makeEntityModel}
        utils={utils}
        renderMarkdown={renderMarkdown}
        series={{}} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const expected = (
        <juju.components.Panel
          instanceName="white-box"
          clickAction={instance._close}
          focus={false}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            <juju.components.EntityDetails
              acl={acl}
              apiUrl={apiUrl}
              importBundleYAML={importBundleYAML}
              getBundleYAML={getBundleYAML}
              changeState={
                output.props.children.props.children.props.changeState}
              getEntity={getEntity}
              scrollPosition={0}
              listPlansForCharm={listPlansForCharm}
              makeEntityModel={makeEntityModel}
              getDiagramURL={getDiagramURL}
              getFile={getFile}
              renderMarkdown={renderMarkdown}
              deployService={deployService}
              displayPlans={true}
              id='~spinch/koala'
              addNotification={addNotification}
              pluralize={utils.pluralize} />
          </div>
        </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('closes when clicked outside', function() {
    appState.current.user = 'spinch/koala';
    const utils = {
      pluralize: sinon.stub()
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        acl={acl}
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        apiVersion="v5"
        appState={appState}
        charmstoreSearch={sinon.stub()}
        charmstoreURL="http://1.2.3.4/"
        deployService={sinon.stub()}
        displayPlans={true}
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listPlansForCharm={sinon.stub()}
        makeEntityModel={sinon.stub()}
        utils={utils}
        renderMarkdown={sinon.stub()}
        series={{}} />, true);
    const output = renderer.getRenderOutput();
    output.props.clickAction();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      root: null,
      search: null,
      store: null
    });
  });
});
