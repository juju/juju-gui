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
  var env, models, users;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-model-list', () => { done(); });
  });

  beforeEach(() => {
    env = {
      destroyModel: sinon.stub().callsArg(0),
      findFacadeVersion: sinon.stub(),
      get: sinon.stub().returns('default'),
      createModel: (modelName, userName, callback) => {
        assert.equal(modelName, 'newmodelname', 'model name not set properly');
        assert.equal(userName, 'test-owner', 'user name not set properly');
        // Simulate the model being created.
        callback({
          err: null,
          uuid: 'abc123',
          name: modelName
        });
      }
    };
    models = [{
      uuid: 'model1',
      name: 'spinach/sandbox',
      lastConnection: 'today',
      ownerTag: 'test-owner',
      isAlive: true
    }];
    users = {charmstore: {
      user: 'test-owner',
      usernameDisplay: 'test owner'
    }};
  });

  it('renders the empty state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={false}
        currentModel={'model1'}
        env={env}
        hideConnectingMask={sinon.stub()}
        jem={null}
        listModels={sinon.stub().callsArgWith(0, null, [])}
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
        currentModel={'model1'}
        env={env}
        hideConnectingMask={sinon.stub()}
        jem={null}
        listModels={sinon.stub()}
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
    var listModels = sinon.stub().callsArgWith(0, null, {models: models});
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={true}
        currentModel={'model1'}
        env={env}
        hideConnectingMask={sinon.stub()}
        jem={null}
        listModels={listModels}
        showConnectingMask={sinon.stub()}
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
          <div className="user-profile__create-new collapsed">
            <form onSubmit={instance.createAndSwitch}>
              <juju.components.GenericButton
                action={instance._nextCreateStep}
                type='inline-neutral first'
                title='Create new' />
              <juju.components.GenericInput
                placeholder="untitled_model"
                required={true}
                ref="modelName"
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }, {
                  regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                  error: 'This field must only contain upper and lowercase ' +
                    'letters, numbers, and hyphens. It must not start or ' +
                    'end with a hyphen.'
                }]} />
              <juju.components.GenericButton
                action={instance.createAndSwitch}
                type='inline-neutral second'
                title='Submit' />
            </form>
          </div>
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
              today
            </span>
            <span className="user-profile__list-col one-col">
              --
            </span>
            <span className="user-profile__list-col two-col last-col">
              test-owner
            </span>
          </juju.components.UserProfileEntity>]}
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can render models that are being destroyed', () => {
    models[0].isAlive = false;
    var listModels = sinon.stub().callsArgWith(0, null, {models: models});
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={false}
        currentModel={'model1'}
        env={env}
        hideConnectingMask={sinon.stub()}
        jem={null}
        listModels={listModels}
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
    var listModels = sinon.stub().callsArgWith(0, null, {models: models});
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={true}
        currentModel={'model1'}
        env={env}
        hideConnectingMask={sinon.stub()}
        jem={null}
        listModels={listModels}
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
      lastConnection: 'today',
      ownerTag: 'test-owner',
      isAlive: true,
      owner: 'test-owner'
    }], 'modelname', undefined]);
  });

  it('can reset the model connection', () => {
    var utilsSwitchModel = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={true}
        env={env}
        hideConnectingMask={sinon.stub()}
        listModels={sinon.stub()}
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
        env={env}
        hideConnectingMask={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        users={users}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.isUndefined(output.props.children[0].props.children[2]);
  });

  it('creates then switches to newly created models', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    var showConnectingMask = sinon.stub();
    var switchModel = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={true}
        env={env}
        hideConnectingMask={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        showConnectingMask={showConnectingMask}
        switchModel={switchModel}
        users={users}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: _ => true,
        getValue: _ => 'newmodelname'
      }
    };
    var preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    output.props.children[0].props.children[2].props.children.props.children[2]
      .props.action(preventable);
    assert.equal(preventable.preventDefault.callCount, 1,
                 'default not prevented');
    assert.equal(showConnectingMask.callCount, 1, 'mask not shown');
    // Make sure that it switches to the model after it's created.
    assert.equal(switchModel.callCount, 1, 'model not switched to');
    assert.equal(switchModel.args[0][0], 'abc123', 'uuid not passed through');
    assert.equal(switchModel.args[0][2], 'newmodelname', 'model name not set');
  });

  it('does not submit to create new if name does not validate', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    var showConnectingMask = sinon.stub();
    var switchModel = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={true}
        env={env}
        hideConnectingMask={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        showConnectingMask={showConnectingMask}
        switchModel={switchModel}
        users={users}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: _ => false
      }
    };
    var preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    output.props.children[0].props.children[2].props.children.props.children[2]
      .props.action(preventable);
    assert.equal(
      preventable.preventDefault.callCount, 1, 'default not prevented');
    assert.equal(showConnectingMask.callCount, 0, 'mask shown');
    // Make sure that it switches to the model after it's created.
    assert.equal(switchModel.callCount, 0, 'model should not be switched to');
  });

  it('gracefully handles errors when creating new model', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    env.createModel = (modelName, userName, callback) => {
      assert.equal(modelName, 'newmodelname', 'model name not set properly');
      assert.equal(userName, 'test-owner', 'user name not set properly');
      // Simulate the model being created.
      callback({
        err: 'this is an error',
        uuid: 'abc123',
        name: modelName
      });
    };
    var hideConnectingMask = sinon.stub();
    var addNotification = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        canCreateNew={true}
        env={env}
        hideConnectingMask={hideConnectingMask}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        users={users}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: _ => true,
        getValue: _ => 'newmodelname'
      }
    };
    var preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    output.props.children[0].props.children[2].props.children.props.children[2]
      .props.action(preventable);
    // Make sure that the mask is hidden and that a notification was added
    // with the error message.
    assert.equal(hideConnectingMask.callCount, 1, 'mask not hidden');
    assert.equal(addNotification.callCount, 1, 'notification not added');
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Failed to create new Model',
      message: 'this is an error',
      level: 'error'
    });
  });

  it('swtches models by switching to disconnected with JIMM', () => {
    var switchModel = sinon.stub();
    var showConnectingMask = sinon.stub();
    env.createModel = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={true}
        env={env}
        hideConnectingMask={sinon.stub()}
        jem={{}}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        showConnectingMask={showConnectingMask}
        switchModel={switchModel}
        users={users}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    // Click the button.
    output.props.children[0].props.children[2].props.children.props.children[0]
      .props.action();
    // It should not try to create a model.
    assert.equal(showConnectingMask.callCount, 0, 'should not show mask');
    assert.equal(env.createModel.callCount, 0, 'it should not create model');
    // Switching models.
    assert.equal(switchModel.callCount, 1, 'it should have called switchModel');
    assert.deepEqual(
      switchModel.args[0], [
        undefined,
        [{
          uuid: 'model1',
          name: 'spinach/sandbox',
          lastConnection: 'today',
          ownerTag: 'test-owner',
          isAlive: true,
          owner: 'test-owner'
        }],
        undefined,
        undefined
      ]);
  });

  it('will abort the requests when unmounting', function() {
    var listModelsAbort = sinon.stub();
    var listModels = sinon.stub().returns({abort: listModelsAbort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        canCreateNew={false}
        currentModel={'model1'}
        env={env}
        hideConnectingMask={sinon.stub()}
        jem={null}
        listModels={listModels}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore}
        users={users} />, true);
    renderer.unmount();
    assert.equal(listModelsAbort.callCount, 1);
  });
});
