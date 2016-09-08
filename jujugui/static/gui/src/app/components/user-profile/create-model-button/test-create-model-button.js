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

const juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('CreateModelButton', () => {
  let controllerAPI, users;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('create-model-button', () => { done(); });
  });

  beforeEach(() => {
    controllerAPI = {
      findFacadeVersion: sinon.stub(),
      get: sinon.stub().returns('default'),
      createModel: (modelName, userTag, args, callback) => {
        assert.equal(modelName, 'newmodelname', 'model name not set properly');
        assert.equal(userTag, 'user-dalek', 'user tag not set properly');
        assert.deepEqual(args, {});
        // Simulate the model being created.
        callback(null, {
          uuid: 'abc123',
          name: modelName
        });
      }
    };
    users = {charmstore: {
      user: 'user-dalek',
      usernameDisplay: 'test owner'
    }};
  });

  it('renders a button', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.CreateModelButton
        addNotification={sinon.stub()}
        className={'test'}
        controllerAPI={controllerAPI}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        jem={null}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="user-profile__create-new test collapsed">
        <form onSubmit={instance.createAndSwitch}>
          <juju.components.GenericButton
            action={instance._nextCreateStep}
            type="inline-neutral first"
            title="Create new" />
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
            type="inline-neutral second"
            title="Submit" />
        </form>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('creates then switches to newly created models', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    const showConnectingMask = sinon.stub();
    const switchModel = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.CreateModelButton
        addNotification={sinon.stub()}
        controllerAPI={controllerAPI}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={showConnectingMask}
        switchModel={switchModel}
        user={users.charmstore} />, true);
    const instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: () => true,
        getValue: () => 'newmodelname'
      }
    };
    const preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    instance.createAndSwitch(preventable);
    assert.equal(preventable.preventDefault.callCount, 1,
                 'default not prevented');
    assert.equal(showConnectingMask.callCount, 1, 'mask not shown');
    // Make sure that it switches to the model after it's created.
    assert.equal(switchModel.callCount, 1, 'model not switched to');
    assert.equal(switchModel.args[0][0], 'abc123', 'uuid not passed through');
    assert.equal(switchModel.args[0][1], 'newmodelname', 'model name not set');
  });

  it('switches to an unconnected state if in gisf mode', () => {
    const switchModel = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.CreateModelButton
        addNotification={sinon.stub()}
        controllerAPI={controllerAPI}
        gisf={true}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
        switchModel={switchModel}
        user={users.charmstore} />, true);
    const instance = component.getMountedInstance();
    instance._nextCreateStep();
    // Make sure that it switches to the model after it's created.
    assert.equal(switchModel.callCount, 1, 'model not switched to');
    assert.deepEqual(switchModel.args[0], [], 'not switching to uncommitted');
  });

  it('does not submit to create new if name does not validate', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    const showConnectingMask = sinon.stub();
    const switchModel = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.CreateModelButton
        addNotification={sinon.stub()}
        controllerAPI={controllerAPI}
        gisf={false}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={showConnectingMask}
        switchModel={switchModel}
        user={users.charmstore} />, true);
    const instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: () => false
      }
    };
    const preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    instance.createAndSwitch(preventable);
    assert.equal(
      preventable.preventDefault.callCount, 1, 'default not prevented');
    assert.equal(showConnectingMask.callCount, 0, 'mask shown');
    // Make sure that it switches to the model after it's created.
    assert.equal(switchModel.callCount, 0, 'model should not be switched to');
  });

  it('gracefully handles errors when creating new model', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    controllerAPI.createModel = (modelName, userTag, args, callback) => {
      assert.equal(modelName, 'newmodelname', 'model name not set properly');
      assert.equal(userTag, 'user-dalek', 'user name not set properly');
      assert.deepEqual(args, {});
      // Simulate the model being created.
      callback('this is an error', {
        uuid: 'abc123',
        name: modelName
      });
    };
    const hideConnectingMask = sinon.stub();
    const addNotification = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.CreateModelButton
        addNotification={addNotification}
        controllerAPI={controllerAPI}
        gisf={false}
        hideConnectingMask={hideConnectingMask}
        showConnectingMask={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore} />, true);
    const instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: () => true,
        getValue: () => 'newmodelname'
      }
    };
    const preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    instance.createAndSwitch(preventable);
    // Make sure that the mask is hidden and that a notification was added
    // with the error message.
    assert.equal(hideConnectingMask.callCount, 1, 'mask not hidden');
    assert.equal(addNotification.callCount, 1, 'notification not added');
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Failed to create new model',
      message: 'this is an error',
      level: 'error'
    });
  });
});
