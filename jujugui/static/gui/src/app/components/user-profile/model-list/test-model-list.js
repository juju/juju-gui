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
  let models, user;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-model-list', () => { done(); });
  });

  beforeEach(() => {
    models = [{
      uuid: 'model1',
      name: 'spinach',
      lastConnection: '2016-09-12T15:42:09Z',
      ownerTag: 'user-who',
      owner: 'who',
      cloud: 'aws',
      region: 'gallifrey',
      numMachines: 42,
      isAlive: true
    }];
    user = {
      user: 'user-who',
      usernameDisplay: 'test owner'
    };
  });

  it('renders the empty state', () => {
    const acl = {
      canAddModels: () => true
    };
    const changeState = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        currentModel={'model1'}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, [])}
        switchModel={sinon.stub()}
        user={user} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="user-profile__model-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          Models
          <span className="user-profile__size">
            ({0})
          </span>
          <juju.components.CreateModelButton
            changeState={changeState}
            switchModel={instance.props.switchModel} />
        </div>
        {undefined}
        {undefined}
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('displays loading spinner when loading', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        currentModel={'model1'}
        facadesExist={true}
        listModelsWithInfo={sinon.stub()}
        switchModel={sinon.stub()}
        user={user} />, true);
    const output = component.getRenderOutput();
    assert.deepEqual(output, (
      <div className="user-profile__model-list twelve-col">
        <juju.components.Spinner />
      </div>
    ));
  });

  it('renders a list of models', () => {
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const acl = {
      canAddModels: () => true
    };
    const changeState = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const content = output.props.children[1].props.children;
    const expected = (
      <div className="user-profile__model-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          Models
          <span className="user-profile__size">
            ({1})
          </span>
          <juju.components.CreateModelButton
            changeState={changeState}
            switchModel={instance.props.switchModel} />
        </div>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="user-profile__list-col three-col">
              Name
            </span>
            <span className="user-profile__list-col four-col">
              Cloud/Region
            </span>
            <span className="user-profile__list-col two-col">
              Last accessed
            </span>
            <span className="user-profile__list-col one-col">
              Machines
            </span>
            <span className={
              'user-profile__list-col two-col last-col'}>
              Owner
            </span>
          </li>
          {[<juju.components.UserProfileEntity
            displayConfirmation={content[1][0].props.displayConfirmation}
            entity={models[0]}
            expanded={true}
            key="model1"
            switchModel={instance.props.switchModel}
            type="model">
            <span className="user-profile__list-col three-col">
              spinach
            </span>
            <span className="user-profile__list-col four-col">
              aws/gallifrey
            </span>
            <span className="user-profile__list-col two-col">
              <juju.components.DateDisplay
                date='2016-09-12T15:42:09Z'
                relative={true}/>
            </span>
            <span className="user-profile__list-col one-col">
              {42}
            </span>
            <span className="user-profile__list-col two-col last-col">
              who
            </span>
          </juju.components.UserProfileEntity>]}
        </ul>
        {undefined}
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can render models that are being destroyed', () => {
    models[0].isAlive = false;
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        currentModel={'model1'}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    const output = component.getRenderOutput();
    const content = output.props.children[1].props.children[1][0];
    const classes = 'expanding-row twelve-col user-profile__entity'
                     + ' user-profile__list-row';
    const expected = (
      <li className={classes}
        key="model1">
        {'spinach'} is being destroyed.
      </li>);
    assert.deepEqual(content, expected);
  });

  // XXX kadams54 2016-09-29: ACL check disabled until
  // https://bugs.launchpad.net/juju/+bug/1629089 is resolved.
  /*
  it('can hide the create new model button', () => {
    const acl = {
      canAddModels: () => false
    };
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        acl={acl}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, models)}
        switchModel={sinon.stub()}
        user={user} />, true);
    const output = component.getRenderOutput();
    assert.isUndefined(output.props.children[0].props.children[2]);
  });
  */

  it('can display a confirmation when models are to be destroyed', () => {
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    let output = component.getRenderOutput();
    output.props.children[1].props.children[1][0].props.displayConfirmation();
    output = component.getRenderOutput();
    const expected = (
      <juju.components.Popup
        buttons={output.props.children[2].props.buttons}
        title="Destroy model">
        <p>
          Are you sure you want to destroy spinach? All the
          applications and units included in the model will be destroyed.
          This action cannot be undone.
        </p>
      </juju.components.Popup>);
    assert.deepEqual(output.props.children[2], expected);
  });

  it('can destroy a model', () => {
    const addNotification = sinon.stub();
    const uuids = {};
    models.forEach(model => {
      uuids[model.uuid] = null;
    });
    const destroyModels = sinon.stub().callsArgWith(1, null, uuids);
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    const instance = component.getMountedInstance();
    instance._displayConfirmation({name: 'spinach/my-model'});
    let output = component.getRenderOutput();
    output.props.children[2].props.buttons[1].action();
    assert.equal(destroyModels.callCount, 1, 'destroyModels not called');
    output = component.getRenderOutput();
    // The confirmation should now be hidden.
    assert.isUndefined(output.props.children[2], 'Confirmation not hidden');
    assert.equal(addNotification.callCount, 1, 'addNotification not called');
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Model destroyed',
      message: 'The model is currently being destroyed.',
      level: 'important'
    }, 'Notification message does not match expected.');
  });

  it('can cancel destroying a model', () => {
    const destroyModels = sinon.stub();
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    const instance = component.getMountedInstance();
    instance._displayConfirmation({name: 'spinach/my-model'});
    let output = component.getRenderOutput();
    output.props.children[2].props.buttons[0].action();
    assert.equal(destroyModels.callCount, 0, 'destroyModels was called');
    output = component.getRenderOutput();
    // The confirmation should now be hidden.
    assert.isUndefined(output.props.children[2], 'Confirmation not hidden');
  });

  it('can display a global error when destroying', () => {
    const addNotification = sinon.stub();
    const error = 'An error';
    const destroyModels = sinon.stub().callsArgWith(1, error, null);
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    const instance = component.getMountedInstance();
    component.getRenderOutput();
    instance._displayConfirmation({name: 'spinach/my-model', uuid: 'my-model'});
    instance._destroyModel();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Model destruction failed',
      message: 'The model failed to be destroyed: ' + error,
      level: 'error'
    });
  });

  it('can display a specific error when destroying', () => {
    const addNotification = sinon.stub();
    const statuses = {};
    const model = models[0];
    const error = 'An error.';
    statuses[model.uuid] = error;
    const destroyModels = sinon.stub().callsArgWith(1, null, statuses);
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    const instance = component.getMountedInstance();
    component.getRenderOutput();
    instance._displayConfirmation({name: 'spinach/my-model', uuid: 'my-model'});
    instance._destroyModel();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Model destruction failed',
      message: 'The model failed to be destroyed: ' + error,
      level: 'error'
    });
  });

  it('can prevent deletion of a controller', () => {
    const addNotification = sinon.stub();
    const destroyModels = sinon.stub();
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    const instance = component.getMountedInstance();
    component.getRenderOutput();
    const model = {
      name: 'spinach/my-model',
      uuid: 'my-model',
      isController: true
    };
    instance._displayConfirmation(model);
    assert.equal(addNotification.callCount, 1,
                 'addNotification was not called');
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Cannot destroy model',
      message: 'The controller model cannot be destroyed.',
      level: 'error'
    }, 'The notification does not match expected.');
  });

  it('will abort the requests when unmounting', function() {
    const listModelsWithInfoAbort = sinon.stub();
    const listModelsWithInfo = sinon.stub().returns(
      {abort: listModelsWithInfoAbort});
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        currentModel={'model1'}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={sinon.stub()}
        user={user} />, true);
    renderer.unmount();
    assert.equal(listModelsWithInfoAbort.callCount, 1);
  });

  it('broadcasts starting status', function() {
    const broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        broadcastStatus={broadcastStatus}
        currentModel={'model1'}
        facadesExist={true}
        listModelsWithInfo={sinon.stub()}
        switchModel={sinon.stub()}
        user={user} />, true);
    assert.equal(broadcastStatus.args[0][0], 'starting');
  });

  it('broadcasts ok status', function() {
    const broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        broadcastStatus={broadcastStatus}
        currentModel={'model1'}
        facadesExist={true}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, models)}
        switchModel={sinon.stub()}
        user={user} />, true);
    assert.equal(broadcastStatus.args[1][0], 'ok');
  });

  it('broadcasts empty status', function() {
    const broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        broadcastStatus={broadcastStatus}
        currentModel={'model1'}
        facadesExist={true}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, [])}
        switchModel={sinon.stub()}
        user={user} />, true);
    assert.equal(broadcastStatus.args[1][0], 'empty');
  });

  it('broadcasts error status', function() {
    const broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        broadcastStatus={broadcastStatus}
        currentModel={'model1'}
        facadesExist={true}
        listModelsWithInfo={sinon.stub().callsArgWith(0, 'bad wolf', [])}
        switchModel={sinon.stub()}
        user={user} />, true);
    assert.equal(broadcastStatus.args[1][0], 'error');
  });
});
