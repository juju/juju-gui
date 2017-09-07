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
  let models, userInfo;

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
      isAlive: true,
      users: [
        {
          access: 'admin',
          displayName: 'steve',
          domain: 'Ubuntu SSO',
          lastConnection: new Date(),
          name: 'steve'
        },
        {
          access: 'write',
          displayName: 'who',
          domain: 'Ubuntu SSO',
          lastConnection: new Date(),
          name: 'who'
        }
      ]
    }];
    userInfo = {external: 'who-ext', profile: 'who', isCurrent: true};
  });

  it('renders the empty state', () => {
    const acl = {
      canAddModels: () => true
    };
    const changeState = sinon.stub();
    const clearPostDeployment = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        clearPostDeployment={clearPostDeployment}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, [])}
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="user-profile__model-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Models
            <span className="user-profile__size">
              ({0})
            </span>
          </div>
          <div className="right">
            <juju.components.CreateModelButton
              changeState={changeState}
              clearPostDeployment={clearPostDeployment}
              switchModel={instance.props.switchModel} />
          </div>
        </div>
        {undefined}
        {undefined}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('does not show the create model button if not current user', () => {
    const acl = {
      canAddModels: () => true
    };
    userInfo = {external: 'who-ext', profile: 'who', isCurrent: false};
    const changeState = sinon.stub();
    const clearPostDeployment = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        clearPostDeployment={clearPostDeployment}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={sinon.stub().callsArgWith(0, null, [])}
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="user-profile__model-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Models shared with you
            <span className="user-profile__size">
              ({0})
            </span>
          </div>
          <div className="right">
            {undefined}
          </div>
        </div>
        {undefined}
        {undefined}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('displays loading spinner when loading', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={sinon.stub()}
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="user-profile__model-list twelve-col">
        <juju.components.Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('renders a list of models', () => {
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const acl = {
      canAddModels: () => true
    };
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const clearPostDeployment = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        acl={acl}
        addNotification={addNotification}
        changeState={changeState}
        clearPostDeployment={clearPostDeployment}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={models}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const content = output.props.children[1].props.children;
    const expected = (
      <div className="user-profile__model-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Models
            <span className="user-profile__size">
              ({1})
            </span>
          </div>
          <div className="right">
            <juju.components.CreateModelButton
              changeState={changeState}
              clearPostDeployment={clearPostDeployment}
              switchModel={instance.props.switchModel} />
          </div>
        </div>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="user-profile__list-col two-col">
              Name
            </span>
            <span className="user-profile__list-col two-col">
              Owner
            </span>
            <span className="user-profile__list-col two-col">
              Machines
            </span>
            <span className="user-profile__list-col two-col">
              Cloud/Region
            </span>
            <span className="user-profile__list-col two-col">
              Permission
            </span>
            <span className={
              'user-profile__list-col two-col last-col'}>
              Last accessed
            </span>
          </li>
          {[<juju.components.UserProfileEntity
            acl={acl}
            addNotification={addNotification}
            displayConfirmation={content[1][0].props.displayConfirmation}
            entity={models[0]}
            expanded={true}
            key="model1"
            permission="write"
            switchModel={instance.props.switchModel}
            type="model">
            <span className="user-profile__list-col two-col">
              spinach
            </span>
            <span className="user-profile__list-col two-col">
              who
            </span>
            <span className="user-profile__list-col two-col">
              42
            </span>
            <span className="user-profile__list-col two-col">
              aws/gallifrey
            </span>
            <span className="user-profile__list-col two-col">
              write
            </span>
            <span className="user-profile__list-col two-col last-col">
              <juju.components.DateDisplay
                date='2016-09-12T15:42:09Z'
                relative={true}/>
            </span>
          </juju.components.UserProfileEntity>]}
        </ul>
        {undefined}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders a list of models shared with you', () => {
    models = [{
      uuid: 'model1-uuid',
      name: 'model1',
      lastConnection: '2016-09-12T15:42:09Z',
      owner: 'who',
      cloud: 'aws',
      region: 'gallifrey',
      numMachines: 42,
      isAlive: true,
      users: [
        {
          access: 'admin',
          displayName: 'steve',
          domain: 'Ubuntu SSO',
          lastConnection: new Date(),
          name: 'steve'
        },
        {
          access: 'write',
          displayName: 'dalek',
          domain: 'Ubuntu SSO',
          lastConnection: new Date(),
          name: 'dalek'
        }
      ]
    }, {
      uuid: 'model2-uuid',
      name: 'model2',
      lastConnection: '2016-09-12T15:42:09Z',
      owner: 'dalek@external',
      cloud: 'aws',
      region: 'gallifrey',
      numMachines: 47,
      isAlive: true,
      users: [
        {
          access: 'admin',
          displayName: 'steve',
          domain: 'Ubuntu SSO',
          lastConnection: new Date(),
          name: 'steve'
        },
        {
          access: 'write',
          displayName: 'dalek',
          domain: 'Ubuntu SSO',
          lastConnection: new Date(),
          name: 'dalek'
        }
      ]
    }];
    userInfo = {external: 'dalek', profile: 'dalek', isCurrent: false};
    const addNotification = sinon.stub();
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const acl = {
      canAddModels: () => true
    };
    const changeState = sinon.stub();
    const clearPostDeployment = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        acl={acl}
        addNotification={addNotification}
        changeState={changeState}
        clearPostDeployment={clearPostDeployment}
        currentModel={null}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={models}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const content = output.props.children[1].props.children;
    const expected = (
      <div className="user-profile__model-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Models shared with you
            <span className="user-profile__size">
              ({2})
            </span>
          </div>
          <div className="right">
            {undefined}
          </div>
        </div>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="user-profile__list-col two-col">
              Name
            </span>
            <span className="user-profile__list-col two-col">
              Owner
            </span>
            <span className="user-profile__list-col two-col">
              Machines
            </span>
            <span className="user-profile__list-col two-col">
              Cloud/Region
            </span>
            <span className="user-profile__list-col two-col">
              Permission
            </span>
            <span className={
              'user-profile__list-col two-col last-col'}>
              Last accessed
            </span>
          </li>
          {[<juju.components.UserProfileEntity
            acl={acl}
            addNotification={addNotification}
            displayConfirmation={content[1][0].props.displayConfirmation}
            entity={models[0]}
            expanded={false}
            key="model1-uuid"
            permission="write"
            switchModel={instance.props.switchModel}
            type="model">
            <span className="user-profile__list-col two-col">
              model1
            </span>
            <span className="user-profile__list-col two-col">
              who
            </span>
            <span className="user-profile__list-col two-col">
              42
            </span>
            <span className="user-profile__list-col two-col">
              aws/gallifrey
            </span>
            <span className="user-profile__list-col two-col">
              write
            </span>
            <span className="user-profile__list-col two-col last-col">
              <juju.components.DateDisplay
                date='2016-09-12T15:42:09Z'
                relative={true}/>
            </span>
          </juju.components.UserProfileEntity>,
          <juju.components.UserProfileEntity
            acl={acl}
            addNotification={addNotification}
            displayConfirmation={content[1][1].props.displayConfirmation}
            entity={models[1]}
            expanded={false}
            key="model2-uuid"
            permission="write"
            switchModel={instance.props.switchModel}
            type="model">
            <span className="user-profile__list-col two-col">
              model2
            </span>
            <span className="user-profile__list-col two-col">
              dalek
            </span>
            <span className="user-profile__list-col two-col">
              47
            </span>
            <span className="user-profile__list-col two-col">
              aws/gallifrey
            </span>
            <span className="user-profile__list-col two-col">
              write
            </span>
            <span className="user-profile__list-col two-col last-col">
              <juju.components.DateDisplay
                date='2016-09-12T15:42:09Z'
                relative={true}/>
            </span>
          </juju.components.UserProfileEntity>]}
        </ul>
        {undefined}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('hides models that are not alive', () => {
    models[0].isAlive = false;
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={models}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const output = component.getRenderOutput();
    const content = output.props.children[1].props.children[1][0];
    assert.isNull(content);
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
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const output = component.getRenderOutput();
    assert.isUndefined(output.props.children[0].props.children[2]);
  });
  */

  it('can display a confirmation when models are to be destroyed', () => {
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={models}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
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
    expect(output.props.children[2]).toEqualJSX(expected);
  });

  it('can destroy a model', () => {
    const addNotification = sinon.stub();
    const model = models[0];
    const results = {};
    results[model.uuid] = null;
    const destroyModels = sinon.stub().callsArgWith(1, null, results);
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={models}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    instance._displayConfirmation(model);
    let output = component.getRenderOutput();
    output.props.children[2].props.buttons[1].action();
    assert.equal(destroyModels.callCount, 1, 'destroyModels not called');
    output = component.getRenderOutput();
    // The confirmation should now be hidden.
    assert.isUndefined(output.props.children[2], 'Confirmation not hidden');
    assert.equal(addNotification.callCount, 1, 'addNotification not called');
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Model destroyed',
      message: `The model "${model.name}" is destroyed.`,
      level: 'important'
    }, 'Notification message does not match expected.');
  });

  it('can render a model with requested destruction', () => {
    const model = models[0];
    const results = {};
    results[model.uuid] = null;
    const destroyModels = sinon.stub();
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={models}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    instance._displayConfirmation(model);
    let output = component.getRenderOutput();
    output.props.children[2].props.buttons[1].action();
    output = component.getRenderOutput();
    const content = output.props.children[1].props.children[1][0];
    const classes = 'expanding-row twelve-col user-profile__entity'
                     + ' user-profile__list-row';
    const expected = (
      <li className={classes}
        key="model1">
        Requesting that {model.name} be destroyed.
      </li>);
    expect(content).toEqualJSX(expected);
  });

  it('can cancel destroying a model', () => {
    const modelName = models[0].name;
    const destroyModels = sinon.stub();
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    instance._displayConfirmation({name: modelName});
    let output = component.getRenderOutput();
    output.props.children[2].props.buttons[0].action();
    assert.equal(destroyModels.callCount, 0, 'destroyModels was called');
    output = component.getRenderOutput();
    // The confirmation should now be hidden.
    assert.isUndefined(output.props.children[2], 'Confirmation not hidden');
  });

  it('can display a global error when destroying', () => {
    const model = models[0];
    const addNotification = sinon.stub();
    const error = 'An error';
    const destroyModels = sinon.stub().callsArgWith(1, error, null);
    const listModelsWithInfo = sinon.stub().callsArgWith(0, null, models);
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    component.getRenderOutput();
    instance._displayConfirmation(model);
    instance._destroyModel();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Model destruction failed',
      message: `Could not destroy model "${model.name}": ${error}`,
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
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    component.getRenderOutput();
    instance._displayConfirmation(model);
    instance._destroyModel();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Model destruction failed',
      message: `Could not destroy model "${model.name}": ${error}`,
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
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
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

  it('handles errors when getting ', function() {
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileModelList
        addNotification={addNotification}
        changeState={sinon.stub()}
        clearPostDeployment={sinon.stub()}
        currentModel={'model1'}
        destroyModels={sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={sinon.stub().callsArgWith(0, 'bad wolf', [])}
        models={[]}
        setEntities={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={userInfo} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Cannot load models',
      message: 'Cannot load models: bad wolf',
      level: 'error'
    });
  });
});
