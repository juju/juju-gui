/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

describe('UserProfileModelList', () => {
  var controllerAPI, models, users;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-model-list', () => { done(); });
  });

  beforeEach(() => {
    controllerAPI = {
      findFacadeVersion: sinon.stub(),
      get: sinon.stub().returns('default'),
      createModel: (modelName, userTag, args, callback) => {
        assert.equal(modelName, 'newmodelname', 'model name not set properly');
        assert.equal(userTag, 'user-who', 'user name not set properly');
        assert.deepEqual(args, {});
        // Simulate the model being created.
        callback(null, {
          uuid: 'abc123',
          name: modelName
        });
      }
    };
    models = [{
      uuid: 'model1',
      name: 'spinach/sandbox',
      lastConnection: '2016-09-12T15:42:09Z',
      ownerTag: 'user-who',
      owner: 'who',
      isAlive: true
    }];
    users = {charmstore: {
      user: 'user-who',
      usernameDisplay: 'test owner'
    }};
  });

  it('renders the empty state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={false}
        controllerAPI={controllerAPI}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, [])}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    var output = component.getRenderOutput();
    assert.equal(output, null);
  });

  it('displays loading spinner when loading', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={false}
        controllerAPI={controllerAPI}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(output, (
      <div className="user-profile__model-list twelve-col">
        <juju.components.Spinner />
      </div>
    ));
  });

  it('renders a list of models', () => {
    var listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    var addNotification = sinon.stub();
    var hideConnectingMask = sinon.stub();
    var showConnectingMask = sinon.stub();
    const getCloudCredentials = sinon.stub();
    const getTagsForCloudCredentials = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        canCreateNew={true}
        cloud={'google'}
        controllerAPI={controllerAPI}
        getCloudCredentials={getCloudCredentials}
        getTagsForCloudCredentials={getTagsForCloudCredentials}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={hideConnectingMask}
        listModelsWithInfo={listModelsWithInfo}
        showConnectingMask={showConnectingMask}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var expected = (
      <div className="user-profile__model-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          Models
          <span className="user-profile__size">
            ({1})
          </span>
          <juju.components.CreateModelButton
            addNotification={addNotification}
            cloud={'google'}
            controllerAPI={controllerAPI}
            getCloudCredentials={getCloudCredentials}
            getTagsForCloudCredentials={getTagsForCloudCredentials}
            hideConnectingMask={hideConnectingMask}
            showConnectingMask={showConnectingMask}
            switchModel={instance.switchModel}
            user={users.charmstore} />
        </div>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="user-profile__list-col three-col">
              Name
            </span>
            <span className="user-profile__list-col four-col">
              Credential
            </span>
            <span className="user-profile__list-col two-col">
              Last accessed
            </span>
            <span className="user-profile__list-col one-col">
              Units
            </span>
            <span className={
              'user-profile__list-col two-col last-col'}>
              Owner
            </span>
          </li>
          {[<juju.components.UserProfileEntity
            entity={models[0]}
            expanded={true}
            key="model1"
            switchModel={instance.switchModel}
            type="model">
            <span className="user-profile__list-col three-col">
              spinach/sandbox
            </span>
            <span className="user-profile__list-col four-col">
              --
            </span>
            <span className="user-profile__list-col two-col">
              <juju.components.DateDisplay
                date='2016-09-12T15:42:09Z'
                relative={true}/>
            </span>
            <span className="user-profile__list-col one-col">
              --
            </span>
            <span className="user-profile__list-col two-col last-col">
              who
            </span>
          </juju.components.UserProfileEntity>]}
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can render models that are being destroyed', () => {
    models[0].isAlive = false;
    var listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={false}
        controllerAPI={controllerAPI}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={listModelsWithInfo}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    var output = component.getRenderOutput();
    var content = output.props.children[1].props.children[1][0];
    var expected = (
      <li className="user-profile__entity user-profile__list-row"
        key="model1">
        {'spinach/sandbox'} is being destroyed.
      </li>);
    assert.deepEqual(content, expected);
  });

  it('switches models when calling switchModel method passed to list', () => {
    // This method is passed down to child components and called from there.
    // We are just calling it directly here to unit test the method.
    var switchModel = sinon.stub();
    var listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={true}
        controllerAPI={controllerAPI}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={listModelsWithInfo}
        showConnectingMask={sinon.stub()}
        switchModel={switchModel}
        user={users.charmstore}
        users={users} />, true);
    var instance = component.getMountedInstance();
    // Call the method that's passed down. We test that this method is
    // correctly passed down in the initial 'happy path' full rendering test.
    instance.switchModel('abc123', 'modelname');
    // We need to call to generate the proper socket URL.
    // Check that switchModel is called with the proper values.
    assert.equal(switchModel.callCount, 1, 'switchModel not called');
    assert.deepEqual(switchModel.args[0], ['abc123', [{
      uuid: 'model1',
      name: 'spinach/sandbox',
      lastConnection: '2016-09-12T15:42:09Z',
      ownerTag: 'user-who',
      owner: 'who',
      isAlive: true
    }], 'modelname', undefined]);
  });

  it('can reset the model connection', () => {
    var utilsSwitchModel = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={true}
        controllerAPI={controllerAPI}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        showConnectingMask={sinon.stub()}
        switchModel={utilsSwitchModel}
        users={users}
        user={users.charmstore} />, true);
    var instance = renderer.getMountedInstance();
    instance.switchModel();
    assert.equal(utilsSwitchModel.callCount, 1,
                 'Model disconnect not called');
    var switchArgs = utilsSwitchModel.args[0];
    assert.equal(switchArgs[0], undefined,
                 'UUID should not be defined');
  });

  it('can hide the create new model button', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={false}
        controllerAPI={controllerAPI}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, models)}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        users={users}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.isUndefined(output.props.children[0].props.children[2]);
  });

  it('will abort the requests when unmounting', function() {
    var listModelsWithInfoAbort = sinon.stub();
    var listModelsWithInfo = sinon.stub().returns(
      {abort: listModelsWithInfoAbort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={false}
        currentModel={'model1'}
        controllerAPI={controllerAPI}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={listModelsWithInfo}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    renderer.unmount();
    assert.equal(listModelsWithInfoAbort.callCount, 1);
  });

  it('broadcasts starting status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        broadcastStatus={broadcastStatus}
        canCreateNew={false}
        controllerAPI={controllerAPI}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    assert.equal(broadcastStatus.args[0][0], 'starting');
  });

  it('broadcasts ok status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        broadcastStatus={broadcastStatus}
        canCreateNew={false}
        controllerAPI={controllerAPI}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, models)}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    assert.equal(broadcastStatus.args[1][0], 'ok');
  });

  it('broadcasts empty status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        broadcastStatus={broadcastStatus}
        canCreateNew={false}
        controllerAPI={controllerAPI}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, [])}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    assert.equal(broadcastStatus.args[1][0], 'empty');
  });

  it('broadcasts error status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        broadcastStatus={broadcastStatus}
        canCreateNew={false}
        controllerAPI={controllerAPI}
        currentModel={'model1'}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        listModelsWithInfo={sinon.stub().callsArgWith(0, 'bad wolf', [])}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    assert.equal(broadcastStatus.args[1][0], 'error');
  });
});
