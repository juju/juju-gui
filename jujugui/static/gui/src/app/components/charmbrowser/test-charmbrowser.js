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
          series: 'wily'
        }
      }};
    var changeState = sinon.stub();
    var charmstoreSearch = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        appState={appState}
        changeState={changeState}
        charmstoreSearch={charmstoreSearch} />);
    assert.deepEqual(output,
        <juju.components.Panel
          instanceName="white-box"
          visible={true}>
          <juju.components.SearchResults
            changeState={changeState}
            query={query}
            tags="ops"
            sort="-name"
            type="bundle"
            series="wily"
            charmstoreSearch={charmstoreSearch} />
        </juju.components.Panel>);
  });

  it('displays the mid-point when the app state calls for it', function() {
    var appState = {
      sectionC: {
        metadata: {
          activeComponent: 'mid-point'
        }
      }};
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        appState={appState}
        changeState={changeState} />);
    assert.deepEqual(output,
        <juju.components.Panel
          instanceName="mid-point-panel"
          visible={true}>
          <juju.components.MidPoint
            outsideClickClose={true}
            storeOpen={false}
            changeState={changeState} />
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
    var output = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        appState={appState}
        charmstoreSearch={charmstoreSearch}
        changeState={changeState} />);
    assert.deepEqual(output,
        <juju.components.Panel
          instanceName="white-box"
          visible={true}>
          <juju.components.Store
            charmstoreSearch={charmstoreSearch}
            changeState={changeState} />
        </juju.components.Panel>);
  });

  it('displays entity details when the app state calls for it', function() {
    var id = 'foobar';
    var appState = {
      sectionC: {
        metadata: {
          activeComponent: 'entity-details',
          id: id
        }
      }};
    var getEntity = sinon.spy();
    var changeState = sinon.spy();
    var deployService = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var getDiagramURL = sinon.spy();
    var utils = {
      pluralize: sinon.spy()
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.Charmbrowser
        appState={appState}
        changeState={changeState}
        deployService={deployService}
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        getDiagramURL={getDiagramURL}
        getEntity={getEntity}
        getFile={getFile}
        renderMarkdown={renderMarkdown}
        utils={utils} />);
    assert.deepEqual(output,
        <juju.components.Panel
          instanceName="white-box"
          visible={true}>
          <juju.components.EntityDetails
            importBundleYAML={importBundleYAML}
            getBundleYAML={getBundleYAML}
            changeState={changeState}
            getEntity={getEntity}
            getDiagramURL={getDiagramURL}
            getFile={getFile}
            renderMarkdown={renderMarkdown}
            deployService={deployService}
            id={id}
            pluralize={utils.pluralize} />
        </juju.components.Panel>);
  });
});
