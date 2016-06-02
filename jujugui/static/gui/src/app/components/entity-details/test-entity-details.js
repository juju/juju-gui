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

describe('EntityDetails', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-details', 'jujulib-utils', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can be rendered', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        id="test"
        deployService={sinon.spy()}
        changeState={sinon.spy()}
        currentModel="uuid123"
        environmentName="my-env"
        getDiagramURL={sinon.stub()}
        getEntity={sinon.spy()}
        getFile={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={sinon.stub()}
        makeEntityModel={sinon.spy()}
        pluralize={sinon.spy()}
        renderMarkdown={sinon.stub()}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{}} />);
    assert.equal(output.props.className, 'entity-details');
  });

  it('fetches an entity properly', function() {
    var apiUrl = 'http://example.com';
    var id = mockEntity.get('id');
    var getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    var makeEntityModel = sinon.stub().returns(mockEntity);
    var deployService = sinon.spy();
    var changeState = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var pluralize = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var addNotification = sinon.spy();
    var listModels = sinon.spy();
    var switchModel = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.EntityDetails
          apiUrl={apiUrl}
          deployService={deployService}
          changeState={changeState}
          currentModel="uuid123"
          environmentName="my-env"
          importBundleYAML={importBundleYAML}
          getBundleYAML={getBundleYAML}
          getDiagramURL={sinon.stub()}
          getEntity={getEntity}
          getFile={getFile}
          scrollPosition={100}
          renderMarkdown={renderMarkdown}
          id={id}
          pluralize={pluralize}
          addNotification={addNotification}
          listModels={listModels}
          makeEntityModel={makeEntityModel}
          switchModel={switchModel}
          user={{}} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(getEntity.calledOnce,
                  'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
                 'getEntity not called with the entity ID');
    var expected = (
      <div className={'entity-details charm'}
        ref="content"
        tabIndex="0">
        <div>
          <juju.components.EntityHeader
            entityModel={mockEntity}
            importBundleYAML={importBundleYAML}
            getBundleYAML={getBundleYAML}
            changeState={changeState}
            currentModel="uuid123"
            addNotification={addNotification}
            deployService={deployService}
            environmentName="my-env"
            listModels={listModels}
            pluralize={pluralize}
            scrollPosition={100}
            switchModel={switchModel}
            user={{}} />
          {undefined}
          <juju.components.EntityContent
            apiUrl={apiUrl}
            changeState={changeState}
            entityModel={mockEntity}
            getFile={getFile}
            pluralize={pluralize}
            renderMarkdown={renderMarkdown} />
          </div>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can display a message if there is a loading error', function() {
    var id = mockEntity.get('id');
    var getEntity = sinon.stub().callsArgWith(1, 'bad wolf', [mockEntity]);
    var deployService = sinon.spy();
    var changeState = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var pluralize = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.EntityDetails
          addNotification={sinon.stub()}
          apiUrl="http://example.com/"
          deployService={deployService}
          changeState={changeState}
          currentModel="uuid123"
          environmentName="my-env"
          importBundleYAML={importBundleYAML}
          getBundleYAML={getBundleYAML}
          getDiagramURL={sinon.stub()}
          getEntity={getEntity}
          getFile={getFile}
          listModels={sinon.stub()}
          makeEntityModel={sinon.spy()}
          renderMarkdown={renderMarkdown}
          switchModel={sinon.stub()}
          id={id}
          pluralize={pluralize}
          scrollPosition={0}
          user={{}} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    var expected = (
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
    assert.deepEqual(output, expected);
  });

  it('can display a bundle diagram', function() {
    var apiUrl = 'http://example.com';
    var mockEntity = jsTestUtils.makeEntity(true);
    var id = mockEntity.get('id');
    var getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    var makeEntityModel = sinon.stub().returns(mockEntity);
    var deployService = sinon.spy();
    var changeState = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var pluralize = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var getDiagramURL = sinon.spy();
    var addNotification = sinon.spy();
    var listModels = sinon.spy();
    var switchModel = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.EntityDetails
          apiUrl={apiUrl}
          deployService={deployService}
          changeState={changeState}
          currentModel="uuid123"
          environmentName="my-env"
          importBundleYAML={importBundleYAML}
          getBundleYAML={getBundleYAML}
          getEntity={getEntity}
          getFile={getFile}
          scrollPosition={100}
          renderMarkdown={renderMarkdown}
          getDiagramURL={getDiagramURL}
          id={id}
          pluralize={pluralize}
          addNotification={addNotification}
          listModels={listModels}
          makeEntityModel={makeEntityModel}
          switchModel={switchModel}
          user={{}} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(getEntity.calledOnce,
                  'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
                 'getEntity not called with the entity ID');
    var expected = (
      <div className={'entity-details bundle'}
        ref="content"
        tabIndex="0">
        <div>
          <juju.components.EntityHeader
            entityModel={mockEntity}
            importBundleYAML={importBundleYAML}
            getBundleYAML={getBundleYAML}
            changeState={changeState}
            currentModel="uuid123"
            deployService={deployService}
            environmentName="my-env"
            addNotification={addNotification}
            listModels={listModels}
            pluralize={pluralize}
            scrollPosition={100}
            switchModel={switchModel}
            user={{}} />
          <juju.components.EntityContentDiagram
            getDiagramURL={getDiagramURL}
            id={id} />
          <juju.components.EntityContent
            apiUrl={apiUrl}
            changeState={changeState}
            entityModel={mockEntity}
            getFile={getFile}
            pluralize={pluralize}
            renderMarkdown={renderMarkdown} />
          </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('will abort the request when unmounting', function() {
    var abort = sinon.stub();
    var id = mockEntity.get('id');
    var getEntity = sinon.stub().returns({abort: abort});
    var deployService = sinon.spy();
    var changeState = sinon.spy();
    var importBundleYAML = sinon.spy();
    var getBundleYAML = sinon.spy();
    var pluralize = sinon.spy();
    var getFile = sinon.spy();
    var renderMarkdown = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.EntityDetails
          addNotification={sinon.stub()}
          apiUrl="http://example.com/"
          deployService={deployService}
          changeState={changeState}
          currentModel="uuid123"
          environmentName="my-env"
          importBundleYAML={importBundleYAML}
          getBundleYAML={getBundleYAML}
          getDiagramURL={sinon.stub()}
          getEntity={getEntity}
          getFile={getFile}
          listModels={sinon.stub()}
          makeEntityModel={sinon.spy()}
          renderMarkdown={renderMarkdown}
          id={id}
          pluralize={pluralize}
          scrollPosition={0}
          switchModel={sinon.stub()}
          user={{}} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    instance.componentWillUnmount();
    assert.equal(abort.callCount, 1);
  });

  it('sets the focus when rendered', function() {
    var focus = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.EntityDetails
        addNotification={sinon.stub()}
        apiUrl="http://example.com/"
        id="test"
        deployService={sinon.spy()}
        changeState={sinon.spy()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.spy()}
        getFile={sinon.stub()}
        importBundleYAML={sinon.stub()}
        makeEntityModel={sinon.spy()}
        pluralize={sinon.spy()}
        renderMarkdown={sinon.stub()}
        scrollPosition={0} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {content: {focus: focus}};
    instance.componentDidMount();
    assert.equal(focus.callCount, 1);
  });
});
