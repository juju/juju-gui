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

  beforeAll(function(done) {
    // Mock these out since we just do shallow renders.
    juju.components.Panel = function() {};
    // By loading this file it adds the component to the juju components.
    YUI().use('charmbrowser-component', function() { done(); });
  });

  it('displays the search results when the app state calls for it', function() {
    var query = 'django';
    var appState = {
      sectionC: {
        metadata: {
          activeComponent: 'search-results',
          search: query,
          tags: 'ops',
          sort: '-name',
          type: 'bundle',
          series: 'wily',
          provides: 'http',
          requires: 'cache',
          owner: 'charmers'
        }
      }};
    var series = {};
    var changeState = sinon.stub();
    var charmstoreSearch = sinon.stub();
    var makeEntityModel = sinon.spy();
    var utils = {getName: sinon.stub()};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        appState={appState}
        changeState={changeState}
        charmstoreSearch={charmstoreSearch}
        currentModel="uuid123"
        deployService={sinon.stub()}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={sinon.stub()}
        makeEntityModel={makeEntityModel}
        switchModel={sinon.stub()}
        utils={utils}
        user={{}}
        renderMarkdown={sinon.stub()}
        series={series} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
        <juju.components.Panel
          instanceName="white-box"
          clickAction={instance._close}
          focus={true}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            <juju.components.SearchResults
              changeState={changeState}
              getName={utils.getName}
              seriesList={series}
              makeEntityModel={makeEntityModel}
              query={query}
              tags="ops"
              sort="-name"
              type="bundle"
              series="wily"
              provides="http"
              requires="cache"
              owner="charmers"
              charmstoreSearch={charmstoreSearch} />
            </div>
        </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('displays the mid-point when the app state calls for it', function() {
    var appState = {
      sectionC: {
        metadata: {
          activeComponent: 'mid-point'
        }
      }};
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        appState={appState}
        changeState={changeState}
        charmstoreSearch={sinon.stub()}
        currentModel="uuid123"
        deployService={sinon.stub()}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={sinon.stub()}
        makeEntityModel={sinon.stub()}
        renderMarkdown={sinon.stub()}
        series={{}}
        switchModel={sinon.stub()}
        user={{}}
        utils={{}} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    assert.deepEqual(output,
        <juju.components.Panel
          instanceName="white-box"
          clickAction={instance._close}
          focus={false}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            <juju.components.MidPoint
              outsideClickClose={true}
              storeOpen={false}
              changeState={changeState} />
          </div>
        </juju.components.Panel>);
  });

  it('displays the store when the app state calls for it', function() {
    var appState = {
      sectionC: {
        metadata: {
          activeComponent: 'store'
        }
      }};
    var charmstoreSearch = sinon.stub();
    var changeState = sinon.stub();
    var utils = {getName: sinon.stub()};
    var makeEntityModel = sinon.spy();
    var seriesList = {};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        appState={appState}
        changeState={changeState}
        charmstoreSearch={charmstoreSearch}
        currentModel="uuid123"
        deployService={sinon.stub()}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        getFile={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={sinon.stub()}
        makeEntityModel={makeEntityModel}
        renderMarkdown={sinon.stub()}
        series={seriesList}
        switchModel={sinon.stub()}
        user={{}}
        utils={utils} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
        <juju.components.Panel
          instanceName="white-box"
          clickAction={instance._close}
          focus={true}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            <juju.components.Store
              makeEntityModel={makeEntityModel}
              charmstoreSearch={charmstoreSearch}
              getName={utils.getName}
              seriesList={seriesList}
              changeState={changeState} />
          </div>
        </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('displays entity details when the app state calls for it', function() {
    var id = 'foobar';
    var apiUrl = 'http://example.com';
    var appState = {
      sectionC: {
        metadata: {
          activeComponent: 'entity-details',
          id: id
        }
      }};
    var getEntity = sinon.spy();
    var makeEntityModel = sinon.spy();
    var changeState = sinon.spy();
    var deployService = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var getDiagramURL = sinon.spy();
    var addNotification = sinon.spy();
    var listModels = sinon.spy();
    var switchModel = sinon.spy();
    var utils = {
      pluralize: sinon.spy()
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        addNotification={addNotification}
        apiUrl={apiUrl}
        appState={appState}
        changeState={changeState}
        charmstoreSearch={sinon.stub()}
        currentModel="uuid123"
        deployService={deployService}
        environmentName="my-env"
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        importBundleYAML={importBundleYAML}
        listModels={listModels}
        makeEntityModel={makeEntityModel}
        renderMarkdown={renderMarkdown}
        series={{}}
        switchModel={switchModel}
        user={{}}
        utils={utils} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    assert.deepEqual(output,
        <juju.components.Panel
          instanceName="white-box"
          clickAction={instance._close}
          focus={true}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            <juju.components.EntityDetails
              apiUrl={apiUrl}
              currentModel="uuid123"
              environmentName="my-env"
              importBundleYAML={importBundleYAML}
              getBundleYAML={getBundleYAML}
              changeState={changeState}
              getEntity={getEntity}
              scrollPosition={0}
              listModels={listModels}
              makeEntityModel={makeEntityModel}
              getDiagramURL={getDiagramURL}
              getFile={getFile}
              renderMarkdown={renderMarkdown}
              deployService={deployService}
              id={id}
              addNotification={addNotification}
              pluralize={utils.pluralize}
              switchModel={switchModel}
              user={{}} />
          </div>
        </juju.components.Panel>);
  });
});
